const forge = require('node-forge');
const {
  generateKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  verifyPassphrase,
  calculateFingerprint,
  clearSensitiveData
} = require('../utils/crypto');
const {
  ensureICADirectories,
  saveIntermediateCACertificate,
  saveIntermediateCAPrivateKey,
  saveIntermediateCAChain,
  loadIntermediateCACertificate,
  loadIntermediateCAPrivateKey,
  loadIntermediateCAChain,
  isIntermediateCAInitialized,
  deleteIntermediateCAFiles,
  loadCAcertificate
} = require('../utils/fileManager');
const { getPocketBase } = require('../config/database');
const { getCAPrivateKey, getNextSerialNumber, getCACertificate } = require('./caService');
const { generateCRL } = require('./crlService');
const { ICA_STATUS, CERT_STATUS, REVOCATION_REASONS } = require('../config/constants');

/**
 * Intermediate Certificate Authority (CA) management service
 */

/**
 * Create a new Intermediate CA
 * @param {Object} icaData - ICA creation data
 * @param {string} icaData.name - Display name for the ICA
 * @param {string} icaData.description - Description
 * @param {string} icaData.common_name - Common Name for the ICA certificate
 * @param {string} icaData.organization - Organization
 * @param {string} icaData.organizational_unit - Organizational Unit
 * @param {string} icaData.country - Country code (2 letters)
 * @param {string} icaData.state - State/Province
 * @param {string} icaData.locality - City/Locality
 * @param {string} icaData.email - Email address
 * @param {number} icaData.key_size - Key size (2048 or 4096)
 * @param {number} icaData.validity_years - Validity period in years
 * @param {number} icaData.max_validity_days - Max validity for issued certs
 * @param {number} icaData.default_validity_days - Default validity for issued certs
 * @param {number} icaData.default_key_size - Default key size for issued certs
 * @param {string} icaData.crl_distribution_point - CRL distribution point URL
 * @param {string} icaData.root_passphrase - Root CA passphrase (to sign the ICA cert)
 * @param {string} icaData.ica_passphrase - Passphrase for the new ICA private key
 * @param {string} userId - User ID creating the ICA
 * @returns {Promise<Object>} Created ICA record
 */
async function createIntermediateCA(icaData, userId) {
  try {
    const {
      name,
      description = '',
      common_name,
      organization = '',
      organizational_unit = '',
      country = '',
      state = '',
      locality = '',
      email = '',
      key_size = 4096,
      validity_years = 5,
      max_validity_days = 397,
      default_validity_days = 365,
      default_key_size = 2048,
      crl_distribution_point = '',
      root_passphrase,
      ica_passphrase
    } = icaData;

    // Ensure ICA storage directories exist
    await ensureICADirectories();

    // Verify Root CA passphrase and get Root CA private key
    console.log('Verifying Root CA passphrase...');
    const rootPrivateKey = await getCAPrivateKey(root_passphrase);
    const rootCertPem = await getCACertificate();
    const rootCert = forge.pki.certificateFromPem(rootCertPem);

    // Generate ICA key pair
    console.log('Generating Intermediate CA key pair...');
    const { privateKey, publicKey, privateKeyObj, publicKeyObj } = await generateKeyPair(key_size);

    // Get next serial number (globally managed)
    const serialNumber = await getNextSerialNumber();

    // Create ICA certificate
    console.log('Creating Intermediate CA certificate...');
    const cert = forge.pki.createCertificate();

    // Set public key
    cert.publicKey = publicKeyObj;

    // Set serial number
    cert.serialNumber = serialNumber;

    // Set validity period
    const notBefore = new Date();
    const notAfter = new Date();
    notAfter.setFullYear(notAfter.getFullYear() + validity_years);

    cert.validity.notBefore = notBefore;
    cert.validity.notAfter = notAfter;

    // Set subject
    const subjectAttrs = [
      { name: 'commonName', value: common_name }
    ];

    if (organization) {
      subjectAttrs.push({ name: 'organizationName', value: organization });
    }
    if (organizational_unit) {
      subjectAttrs.push({ name: 'organizationalUnitName', value: organizational_unit });
    }
    if (country) {
      subjectAttrs.push({ name: 'countryName', value: country });
    }
    if (state) {
      subjectAttrs.push({ name: 'stateOrProvinceName', value: state });
    }
    if (locality) {
      subjectAttrs.push({ name: 'localityName', value: locality });
    }
    if (email) {
      subjectAttrs.push({ name: 'emailAddress', value: email });
    }

    cert.setSubject(subjectAttrs);

    // Set issuer (Root CA)
    cert.setIssuer(rootCert.subject.attributes);

    // Set extensions for Intermediate CA certificate
    const extensions = [
      {
        name: 'basicConstraints',
        cA: true,
        pathLenConstraint: 0, // Cannot sign further sub-CAs
        critical: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        cRLSign: true,
        digitalSignature: true,
        critical: true
      },
      {
        name: 'subjectKeyIdentifier'
      },
      {
        name: 'authorityKeyIdentifier',
        keyIdentifier: rootCert.generateSubjectKeyIdentifier().getBytes()
      }
    ];

    // Add CRL distribution point if provided
    if (crl_distribution_point) {
      extensions.push({
        name: 'cRLDistributionPoints',
        altNames: [{
          type: 6, // URI
          value: crl_distribution_point
        }]
      });
    }

    cert.setExtensions(extensions);

    // Sign ICA certificate with Root CA private key
    console.log('Signing Intermediate CA certificate with Root CA...');
    cert.sign(rootPrivateKey, forge.md.sha256.create());

    // Clear Root CA private key from memory
    clearSensitiveData(rootPrivateKey);

    // Convert to PEM
    const certPem = forge.pki.certificateToPem(cert);

    // Calculate fingerprint
    const fingerprint = calculateFingerprint(certPem);

    // Encrypt ICA private key with its own passphrase
    console.log('Encrypting Intermediate CA private key...');
    const encryptedPrivateKey = encryptPrivateKey(privateKey, ica_passphrase);

    // Build chain PEM (ICA cert + Root cert)
    const chainPem = certPem + rootCertPem;

    // We need to create the PB record first to get the ID for file storage
    console.log('Saving Intermediate CA to database...');
    const pb = getPocketBase();
    const icaRecord = await pb.collection('intermediate_cas').create({
      name,
      description,
      common_name,
      organization,
      organizational_unit,
      country,
      state,
      locality,
      email,
      serial_number: serialNumber,
      certificate_pem: certPem,
      private_key_encrypted: 'stored_on_disk',
      key_size,
      not_before: notBefore.toISOString(),
      not_after: notAfter.toISOString(),
      fingerprint_sha256: fingerprint,
      path_length_constraint: 0,
      max_validity_days,
      default_validity_days,
      default_key_size,
      crl_distribution_point: crl_distribution_point || '',
      status: ICA_STATUS.ACTIVE,
      created_by: userId
    });

    // Save ICA files using the record ID
    console.log('Saving Intermediate CA files...');
    await saveIntermediateCACertificate(icaRecord.id, certPem);
    await saveIntermediateCAPrivateKey(icaRecord.id, encryptedPrivateKey);
    await saveIntermediateCAChain(icaRecord.id, chainPem);

    console.log(`Intermediate CA "${name}" created successfully with ID: ${icaRecord.id}`);

    return {
      id: icaRecord.id,
      name,
      common_name,
      serial_number: serialNumber,
      fingerprint_sha256: fingerprint,
      not_before: notBefore,
      not_after: notAfter,
      key_size,
      status: ICA_STATUS.ACTIVE
    };
  } catch (error) {
    console.error('Failed to create Intermediate CA:', error);
    throw new Error(`Failed to create Intermediate CA: ${error.message}`);
  }
}

/**
 * List all Intermediate CAs
 * @param {Object} filters - Optional filters
 * @param {string} filters.status - Filter by status (active/revoked/expired)
 * @returns {Promise<Array>} List of ICA records
 */
async function listIntermediateCAs(filters = {}) {
  try {
    const pb = getPocketBase();
    const { status } = filters;

    const filterParts = [];
    if (status) {
      filterParts.push(`status = "${status}"`);
    }

    const filterQuery = filterParts.length > 0 ? filterParts.join(' && ') : '';

    const result = await pb.collection('intermediate_cas').getFullList({
      filter: filterQuery,
      sort: '-created',
      expand: 'created_by'
    });

    return result;
  } catch (error) {
    console.error('Failed to list Intermediate CAs:', error);
    throw error;
  }
}

/**
 * Get a single Intermediate CA by ID
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<Object>} ICA record
 */
async function getIntermediateCA(icaId) {
  try {
    const pb = getPocketBase();
    const ica = await pb.collection('intermediate_cas').getOne(icaId, {
      expand: 'created_by'
    });

    // Get certificate count for this ICA
    const certs = await pb.collection('certificates').getFullList({
      filter: `issuing_ca_id = "${icaId}"`
    });

    const activeCerts = certs.filter(c => c.status === CERT_STATUS.ACTIVE).length;
    const revokedCerts = certs.filter(c => c.status === CERT_STATUS.REVOKED).length;
    const expiredCerts = certs.filter(c => c.status === CERT_STATUS.EXPIRED).length;

    return {
      ...ica,
      certificates_issued: certs.length,
      certificates_active: activeCerts,
      certificates_revoked: revokedCerts,
      certificates_expired: expiredCerts
    };
  } catch (error) {
    console.error('Failed to get Intermediate CA:', error);
    throw error;
  }
}

/**
 * Update Intermediate CA metadata
 * @param {string} icaId - Intermediate CA ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} Updated ICA record
 */
async function updateIntermediateCA(icaId, updates) {
  try {
    const pb = getPocketBase();

    // Only allow updating specific fields
    const allowedUpdates = {};
    if (updates.name !== undefined) {
      allowedUpdates.name = updates.name;
    }
    if (updates.description !== undefined) {
      allowedUpdates.description = updates.description;
    }
    if (updates.default_validity_days !== undefined) {
      allowedUpdates.default_validity_days = updates.default_validity_days;
    }
    if (updates.default_key_size !== undefined) {
      allowedUpdates.default_key_size = updates.default_key_size;
    }
    if (updates.crl_distribution_point !== undefined) {
      allowedUpdates.crl_distribution_point = updates.crl_distribution_point;
    }

    if (Object.keys(allowedUpdates).length === 0) {
      throw new Error('No valid fields to update');
    }

    const updatedICA = await pb.collection('intermediate_cas').update(icaId, allowedUpdates);

    return updatedICA;
  } catch (error) {
    console.error('Failed to update Intermediate CA:', error);
    throw error;
  }
}

/**
 * Revoke an Intermediate CA
 * @param {string} icaId - Intermediate CA ID
 * @param {string} rootPassphrase - Root CA passphrase
 * @param {string} reason - Revocation reason
 * @returns {Promise<Object>} Updated ICA record
 */
async function revokeIntermediateCA(icaId, rootPassphrase, reason = REVOCATION_REASONS.UNSPECIFIED) {
  try {
    const pb = getPocketBase();

    // Get ICA record
    const ica = await pb.collection('intermediate_cas').getOne(icaId);

    if (ica.status === ICA_STATUS.REVOKED) {
      throw new Error('Intermediate CA is already revoked');
    }

    // Verify Root CA passphrase
    console.log('Verifying Root CA passphrase...');
    await getCAPrivateKey(rootPassphrase);

    // Mark ICA as revoked
    console.log(`Revoking Intermediate CA ${ica.name}...`);
    const updatedICA = await pb.collection('intermediate_cas').update(icaId, {
      status: ICA_STATUS.REVOKED,
      revoked_at: new Date().toISOString(),
      revocation_reason: reason
    });

    // Cascade revoke all active certificates issued by this ICA
    console.log('Revoking all certificates issued by this ICA...');
    const activeCerts = await pb.collection('certificates').getFullList({
      filter: `issuing_ca_id = "${icaId}" && status = "${CERT_STATUS.ACTIVE}"`
    });

    for (const cert of activeCerts) {
      await pb.collection('certificates').update(cert.id, {
        status: CERT_STATUS.REVOKED,
        revoked_at: new Date().toISOString(),
        revocation_reason: REVOCATION_REASONS.CA_COMPROMISE
      });
    }

    console.log(`Revoked ${activeCerts.length} certificates issued by ICA ${ica.name}`);

    // Regenerate Root CA CRL
    console.log('Updating Root CA CRL...');
    try {
      await generateCRL(rootPassphrase);
    } catch (error) {
      console.warn('Failed to update Root CA CRL:', error.message);
    }

    // Clear passphrase from memory
    clearSensitiveData(rootPassphrase);

    console.log(`Intermediate CA "${ica.name}" revoked successfully`);

    return {
      ...updatedICA,
      certificates_revoked: activeCerts.length
    };
  } catch (error) {
    console.error('Failed to revoke Intermediate CA:', error);
    throw new Error(`Failed to revoke Intermediate CA: ${error.message}`);
  }
}

/**
 * Get Intermediate CA certificate PEM
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<string>} Certificate PEM
 */
async function getIntermediateCACertificate(icaId) {
  try {
    return await loadIntermediateCACertificate(icaId);
  } catch (error) {
    console.error('Failed to get ICA certificate:', error);
    throw error;
  }
}

/**
 * Get Intermediate CA chain PEM (ICA cert + Root cert)
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<string>} Chain PEM
 */
async function getIntermediateCAChain(icaId) {
  try {
    return await loadIntermediateCAChain(icaId);
  } catch (error) {
    console.error('Failed to get ICA chain:', error);
    throw error;
  }
}

/**
 * Get Intermediate CA private key (decrypted)
 * IMPORTANT: The key should be cleared from memory after use
 * @param {string} icaId - Intermediate CA ID
 * @param {string} passphrase - ICA passphrase
 * @returns {Promise<Object>} Decrypted private key object
 */
async function getIntermediateCAPrivateKey(icaId, passphrase) {
  try {
    const encryptedKey = await loadIntermediateCAPrivateKey(icaId);
    return decryptPrivateKey(encryptedKey, passphrase);
  } catch (error) {
    console.error('Failed to get ICA private key:', error);
    throw error;
  }
}

/**
 * Verify Intermediate CA passphrase
 * @param {string} icaId - Intermediate CA ID
 * @param {string} passphrase - Passphrase to verify
 * @returns {Promise<boolean>} True if passphrase is correct
 */
async function verifyIntermediateCAPassphrase(icaId, passphrase) {
  try {
    const encryptedKey = await loadIntermediateCAPrivateKey(icaId);
    return verifyPassphrase(encryptedKey, passphrase);
  } catch (error) {
    console.error('Failed to verify ICA passphrase:', error);
    return false;
  }
}

/**
 * Get Intermediate CA status information
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<Object>} Status information
 */
async function getIntermediateCAStatus(icaId) {
  try {
    const ica = await getIntermediateCA(icaId);

    const now = new Date();
    const notBefore = new Date(ica.not_before);
    const notAfter = new Date(ica.not_after);

    const daysUntilExpiry = Math.floor((notAfter - now) / (1000 * 60 * 60 * 24));
    const isExpired = now > notAfter;
    const isValid = now >= notBefore && now <= notAfter && ica.status === ICA_STATUS.ACTIVE;

    return {
      id: ica.id,
      name: ica.name,
      common_name: ica.common_name,
      status: ica.status,
      is_valid: isValid,
      is_expired: isExpired,
      days_until_expiry: daysUntilExpiry,
      not_before: notBefore,
      not_after: notAfter,
      fingerprint_sha256: ica.fingerprint_sha256,
      certificates_issued: ica.certificates_issued,
      certificates_active: ica.certificates_active,
      certificates_revoked: ica.certificates_revoked,
      certificates_expired: ica.certificates_expired
    };
  } catch (error) {
    console.error('Failed to get ICA status:', error);
    throw error;
  }
}

module.exports = {
  createIntermediateCA,
  listIntermediateCAs,
  getIntermediateCA,
  updateIntermediateCA,
  revokeIntermediateCA,
  getIntermediateCACertificate,
  getIntermediateCAChain,
  getIntermediateCAPrivateKey,
  verifyIntermediateCAPassphrase,
  getIntermediateCAStatus
};
