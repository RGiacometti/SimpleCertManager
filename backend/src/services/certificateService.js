const forge = require('node-forge');
const {
  generateKeyPair,
  calculateFingerprint,
  clearSensitiveData
} = require('../utils/crypto');
const {
  saveCertificate,
  savePrivateKey,
  loadCertificate,
  loadPrivateKey,
  loadCAcertificate,
  createCertificateBundle
} = require('../utils/fileManager');
const { getPocketBase } = require('../config/database');
const { getCAPrivateKey, getNextSerialNumber, getCACertificate } = require('./caService');
const { generateCRL } = require('./crlService');
const { CERT_STATUS, REQUEST_STATUS, REVOCATION_REASONS } = require('../config/constants');

/**
 * Certificate management service
 */

/**
 * Issue a certificate from an approved request
 * @param {string} requestId - Certificate request ID
 * @param {string} passphrase - CA passphrase
 * @param {string} userId - User ID who is issuing the certificate
 * @returns {Promise<Object>} Issued certificate
 */
async function issueCertificate(requestId, passphrase, userId) {
  try {
    const pb = getPocketBase();
    
    // Get certificate request
    const request = await pb.collection('certificate_requests').getOne(requestId);
    
    // Verify request is approved
    if (request.status !== REQUEST_STATUS.APPROVED) {
      throw new Error('Certificate request must be approved before issuing');
    }
    
    console.log(`Issuing certificate for request ${requestId}...`);
    
    // Get CA private key (will throw if passphrase is wrong)
    const caPrivateKey = await getCAPrivateKey(passphrase);
    const caCertPem = await getCACertificate();
    const caCert = forge.pki.certificateFromPem(caCertPem);
    
    // Generate key pair for the certificate
    console.log('Generating certificate key pair...');
    const { privateKey, publicKey, privateKeyObj, publicKeyObj } = await generateKeyPair(
      request.key_size || 2048
    );
    
    // Create certificate
    console.log('Creating certificate...');
    const cert = forge.pki.createCertificate();
    
    // Set public key
    cert.publicKey = publicKeyObj;
    
    // Get next serial number
    const serialNumber = await getNextSerialNumber();
    cert.serialNumber = serialNumber;
    
    // Set validity period
    const notBefore = new Date();
    const notAfter = new Date();
    notAfter.setDate(notAfter.getDate() + (request.validity_days || 365));
    
    cert.validity.notBefore = notBefore;
    cert.validity.notAfter = notAfter;
    
    // Set subject
    const subjectAttrs = [
      { name: 'commonName', value: request.common_name },
      { name: 'organizationName', value: request.organization },
      { name: 'countryName', value: request.country }
    ];
    
    if (request.organizational_unit) {
      subjectAttrs.push({ name: 'organizationalUnitName', value: request.organizational_unit });
    }
    if (request.state) {
      subjectAttrs.push({ name: 'stateOrProvinceName', value: request.state });
    }
    if (request.locality) {
      subjectAttrs.push({ name: 'localityName', value: request.locality });
    }
    if (request.email) {
      subjectAttrs.push({ name: 'emailAddress', value: request.email });
    }
    
    cert.setSubject(subjectAttrs);
    
    // Set issuer (CA)
    cert.setIssuer(caCert.subject.attributes);
    
    // Set extensions
    const extensions = [
      {
        name: 'basicConstraints',
        cA: false,
        critical: true
      },
      {
        name: 'keyUsage',
        digitalSignature: true,
        keyEncipherment: true,
        critical: true
      },
      {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true
      },
      {
        name: 'subjectKeyIdentifier'
      },
      {
        name: 'authorityKeyIdentifier',
        keyIdentifier: caCert.generateSubjectKeyIdentifier().getBytes()
      }
    ];
    
    // Add Subject Alternative Names (SAN)
    const altNames = [];
    
    // Add DNS names
    if (request.san_dns && Array.isArray(request.san_dns) && request.san_dns.length > 0) {
      request.san_dns.forEach(dns => {
        altNames.push({
          type: 2, // DNS
          value: dns
        });
      });
    }
    
    // Add IP addresses
    if (request.san_ip && Array.isArray(request.san_ip) && request.san_ip.length > 0) {
      request.san_ip.forEach(ip => {
        altNames.push({
          type: 7, // IP
          ip: ip
        });
      });
    }
    
    // Always include CN in SAN
    altNames.push({
      type: 2, // DNS
      value: request.common_name
    });
    
    if (altNames.length > 0) {
      extensions.push({
        name: 'subjectAltName',
        altNames: altNames
      });
    }
    
    cert.setExtensions(extensions);
    
    // Sign certificate with CA private key
    console.log('Signing certificate...');
    cert.sign(caPrivateKey, forge.md.sha256.create());
    
    // Clear CA private key from memory
    clearSensitiveData(caPrivateKey);
    clearSensitiveData(passphrase);
    
    // Convert to PEM
    const certPem = forge.pki.certificateToPem(cert);
    
    // Calculate fingerprint
    const fingerprint = calculateFingerprint(certPem);
    
    // Save certificate and private key to files
    console.log('Saving certificate files...');
    const certPath = await saveCertificate(serialNumber, certPem);
    const keyPath = await savePrivateKey(serialNumber, privateKey);
    
    // Prepare subject and issuer data for database
    const subjectData = {};
    subjectAttrs.forEach(attr => {
      subjectData[attr.shortName || attr.name] = attr.value;
    });
    
    const issuerData = {};
    caCert.issuer.attributes.forEach(attr => {
      issuerData[attr.shortName || attr.name] = attr.value;
    });
    
    // Save certificate to database
    console.log('Saving certificate to database...');
    const certificate = await pb.collection('certificates').create({
      request_id: requestId,
      serial_number: serialNumber,
      common_name: request.common_name,
      subject: subjectData,
      issuer: issuerData,
      not_before: notBefore.toISOString(),
      not_after: notAfter.toISOString(),
      fingerprint_sha256: fingerprint,
      certificate_pem: certPem,
      certificate_path: certPath,
      private_key_path: keyPath,
      status: CERT_STATUS.ACTIVE,
      issued_at: new Date().toISOString(),
      issued_by: userId
    });
    
    // Update request status to issued
    await pb.collection('certificate_requests').update(requestId, {
      status: REQUEST_STATUS.ISSUED
    });
    
    console.log(`Certificate ${serialNumber} issued successfully`);
    
    return certificate;
  } catch (error) {
    console.error('Failed to issue certificate:', error);
    throw new Error(`Failed to issue certificate: ${error.message}`);
  }
}

/**
 * Revoke a certificate
 * @param {string} certificateId - Certificate ID
 * @param {string} passphrase - CA passphrase
 * @param {string} reason - Revocation reason
 * @returns {Promise<Object>} Updated certificate
 */
async function revokeCertificate(certificateId, passphrase, reason = REVOCATION_REASONS.UNSPECIFIED) {
  try {
    const pb = getPocketBase();
    
    // Get certificate
    const certificate = await pb.collection('certificates').getOne(certificateId);
    
    // Check if already revoked
    if (certificate.status === CERT_STATUS.REVOKED) {
      throw new Error('Certificate is already revoked');
    }
    
    // Verify passphrase by attempting to generate CRL
    console.log('Verifying passphrase...');
    await getCAPrivateKey(passphrase); // Will throw if passphrase is wrong
    
    // Update certificate status
    console.log(`Revoking certificate ${certificate.serial_number}...`);
    const updatedCert = await pb.collection('certificates').update(certificateId, {
      status: CERT_STATUS.REVOKED,
      revoked_at: new Date().toISOString(),
      revocation_reason: reason
    });
    
    // Regenerate CRL
    console.log('Updating CRL...');
    try {
      await generateCRL(passphrase);
    } catch (error) {
      console.warn('Failed to update CRL:', error.message);
    }
    
    // Clear passphrase from memory
    clearSensitiveData(passphrase);
    
    console.log(`Certificate ${certificate.serial_number} revoked successfully`);
    
    return updatedCert;
  } catch (error) {
    console.error('Failed to revoke certificate:', error);
    throw new Error(`Failed to revoke certificate: ${error.message}`);
  }
}

/**
 * Renew a certificate
 * @param {string} certificateId - Certificate ID to renew
 * @param {string} passphrase - CA passphrase
 * @param {number} validityDays - New validity period in days
 * @returns {Promise<Object>} New certificate
 */
async function renewCertificate(certificateId, passphrase, validityDays = null) {
  try {
    const pb = getPocketBase();
    
    // Get original certificate
    const oldCert = await pb.collection('certificates').getOne(certificateId, {
      expand: 'request_id'
    });
    
    // Get original request
    const oldRequest = oldCert.expand?.request_id;
    
    if (!oldRequest) {
      throw new Error('Original certificate request not found');
    }
    
    // Create new request with same parameters
    const newRequest = await pb.collection('certificate_requests').create({
      common_name: oldRequest.common_name,
      organization: oldRequest.organization,
      organizational_unit: oldRequest.organizational_unit,
      country: oldRequest.country,
      state: oldRequest.state,
      locality: oldRequest.locality,
      email: oldRequest.email,
      san_dns: oldRequest.san_dns,
      san_ip: oldRequest.san_ip,
      key_size: oldRequest.key_size,
      validity_days: validityDays || oldRequest.validity_days,
      status: REQUEST_STATUS.APPROVED, // Auto-approve renewal
      notes: `Renewal of certificate ${oldCert.serial_number}`
    });
    
    // Issue new certificate
    const newCert = await issueCertificate(newRequest.id, passphrase);
    
    // Mark old certificate as superseded
    await pb.collection('certificates').update(certificateId, {
      status: CERT_STATUS.REVOKED,
      revoked_at: new Date().toISOString(),
      revocation_reason: REVOCATION_REASONS.SUPERSEDED
    });
    
    // Update CRL
    try {
      await generateCRL(passphrase);
    } catch (error) {
      console.warn('Failed to update CRL:', error.message);
    }
    
    return newCert;
  } catch (error) {
    console.error('Failed to renew certificate:', error);
    throw new Error(`Failed to renew certificate: ${error.message}`);
  }
}

/**
 * Get certificate by ID
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<Object>} Certificate
 */
async function getCertificate(certificateId) {
  try {
    const pb = getPocketBase();
    const certificate = await pb.collection('certificates').getOne(certificateId, {
      expand: 'request_id,issued_by'
    });
    return certificate;
  } catch (error) {
    console.error('Failed to get certificate:', error);
    throw error;
  }
}

/**
 * Get all certificates with filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Paginated certificates
 */
async function getCertificates(filters = {}) {
  try {
    const pb = getPocketBase();
    const {
      status,
      common_name,
      expiring_days,
      page = 1,
      limit = 50
    } = filters;
    
    // Build filter query
    const filterParts = [];
    
    if (status) {
      filterParts.push(`status = "${status}"`);
    }
    
    if (common_name) {
      filterParts.push(`common_name ~ "${common_name}"`);
    }
    
    if (expiring_days) {
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + expiring_days);
      filterParts.push(`not_after <= "${expiryDate.toISOString()}" && status = "${CERT_STATUS.ACTIVE}"`);
    }
    
    const filterQuery = filterParts.length > 0 ? filterParts.join(' && ') : '';
    
    const result = await pb.collection('certificates').getList(page, limit, {
      filter: filterQuery,
      sort: '-issued_at',
      expand: 'request_id,issued_by'
    });
    
    return {
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error('Failed to get certificates:', error);
    throw error;
  }
}

/**
 * Get certificates expiring soon
 * @param {number} days - Number of days threshold
 * @returns {Promise<Array>} Expiring certificates
 */
async function getExpiringCertificates(days = 30) {
  try {
    const pb = getPocketBase();
    
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + days);
    
    const result = await pb.collection('certificates').getFullList({
      filter: `not_after <= "${expiryDate.toISOString()}" && status = "${CERT_STATUS.ACTIVE}"`,
      sort: 'not_after'
    });
    
    return result;
  } catch (error) {
    console.error('Failed to get expiring certificates:', error);
    throw error;
  }
}

/**
 * Download certificate file
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<string>} Certificate PEM
 */
async function downloadCertificate(certificateId) {
  try {
    const certificate = await getCertificate(certificateId);
    return certificate.certificate_pem;
  } catch (error) {
    console.error('Failed to download certificate:', error);
    throw error;
  }
}

/**
 * Download private key file
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<string>} Private key PEM
 */
async function downloadPrivateKey(certificateId) {
  try {
    const certificate = await getCertificate(certificateId);
    const privateKey = await loadPrivateKey(certificate.serial_number);
    return privateKey;
  } catch (error) {
    console.error('Failed to download private key:', error);
    throw error;
  }
}

/**
 * Download certificate bundle (ZIP)
 * @param {string} certificateId - Certificate ID
 * @returns {Promise<Buffer>} ZIP file buffer
 */
async function downloadCertificateBundle(certificateId) {
  try {
    const certificate = await getCertificate(certificateId);
    const bundle = await createCertificateBundle(certificate.serial_number);
    return bundle;
  } catch (error) {
    console.error('Failed to download certificate bundle:', error);
    throw error;
  }
}

/**
 * Update certificate status (for expired certificates)
 */
async function updateCertificateStatuses() {
  try {
    const pb = getPocketBase();
    
    const now = new Date();
    
    // Find active certificates that have expired
    const expiredCerts = await pb.collection('certificates').getFullList({
      filter: `status = "${CERT_STATUS.ACTIVE}" && not_after < "${now.toISOString()}"`
    });
    
    // Update status to expired
    for (const cert of expiredCerts) {
      await pb.collection('certificates').update(cert.id, {
        status: CERT_STATUS.EXPIRED
      });
    }
    
    return expiredCerts.length;
  } catch (error) {
    console.error('Failed to update certificate statuses:', error);
    throw error;
  }
}

/**
 * Get certificate statistics
 * @returns {Promise<Object>} Certificate statistics
 */
async function getCertificateStatistics() {
  try {
    const pb = getPocketBase();
    
    const allCerts = await pb.collection('certificates').getFullList();
    
    const stats = {
      total: allCerts.length,
      active: 0,
      expired: 0,
      revoked: 0,
      expiring_soon: 0 // Within 30 days
    };
    
    const now = new Date();
    const thirtyDaysFromNow = new Date(now);
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    allCerts.forEach(cert => {
      if (cert.status === CERT_STATUS.ACTIVE) {
        stats.active++;
        
        const notAfter = new Date(cert.not_after);
        if (notAfter <= thirtyDaysFromNow && notAfter > now) {
          stats.expiring_soon++;
        }
      } else if (cert.status === CERT_STATUS.EXPIRED) {
        stats.expired++;
      } else if (cert.status === CERT_STATUS.REVOKED) {
        stats.revoked++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to get certificate statistics:', error);
    throw error;
  }
}

module.exports = {
  issueCertificate,
  revokeCertificate,
  renewCertificate,
  getCertificate,
  getCertificates,
  getExpiringCertificates,
  downloadCertificate,
  downloadPrivateKey,
  downloadCertificateBundle,
  updateCertificateStatuses,
  getCertificateStatistics
};
