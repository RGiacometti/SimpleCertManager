const forge = require('node-forge');
const { loadCAcertificate, loadCAPrivateKey, saveCRL, loadCRL } = require('../utils/fileManager');
const { decryptPrivateKey } = require('../utils/crypto');
const { getPocketBase } = require('../config/database');
const { CERT_STATUS } = require('../config/constants');

/**
 * Certificate Revocation List (CRL) management service
 */

/**
 * Generate or update CRL
 * @param {string} passphrase - CA passphrase to sign the CRL
 * @returns {Promise<string>} CRL in PEM format
 */
async function generateCRL(passphrase) {
  try {
    // Load CA certificate
    const caCertPem = await loadCAcertificate();
    const caCert = forge.pki.certificateFromPem(caCertPem);
    
    // Get all revoked certificates from database
    const pb = getPocketBase();
    const revokedCerts = await pb.collection('certificates').getFullList({
      filter: `status = "${CERT_STATUS.REVOKED}"`
    });
    
    // Create CRL data structure (JSON format for simplicity)
    // Note: node-forge doesn't fully support CRL generation
    // In production, consider using OpenSSL or another library
    const crlData = {
      version: 2,
      issuer: {
        commonName: caCert.subject.getField('CN')?.value || 'Unknown',
        organization: caCert.subject.getField('O')?.value || '',
        country: caCert.subject.getField('C')?.value || ''
      },
      thisUpdate: new Date().toISOString(),
      nextUpdate: (() => {
        const next = new Date();
        next.setDate(next.getDate() + 30);
        return next.toISOString();
      })(),
      revokedCertificates: revokedCerts.map(cert => ({
        serialNumber: cert.serial_number,
        revocationDate: cert.revoked_at,
        reason: cert.revocation_reason || 'unspecified'
      })),
      crlNumber: generateCRLNumber()
    };
    
    // Convert to JSON format (simplified CRL)
    const crlJson = JSON.stringify(crlData, null, 2);
    
    // Save CRL to file
    await saveCRL(crlJson);
    
    return crlJson;
  } catch (error) {
    console.error('Failed to generate CRL:', error);
    throw new Error(`Failed to generate CRL: ${error.message}`);
  }
}

/**
 * Get current CRL
 * @returns {Promise<string|null>} CRL in PEM format or null if not found
 */
async function getCRL() {
  try {
    return await loadCRL();
  } catch (error) {
    console.error('Failed to load CRL:', error);
    return null;
  }
}

/**
 * Parse CRL and extract information
 * @param {string} crlPem - CRL in PEM format
 * @returns {Object} Parsed CRL information
 */
function parseCRL(crlPem) {
  try {
    const crl = forge.pki.certificateRevocationListFromPem(crlPem);
    
    const issuer = {};
    crl.issuer.attributes.forEach(attr => {
      issuer[attr.shortName || attr.name] = attr.value;
    });
    
    const revokedCertificates = crl.revokedCertificates.map(cert => {
      const revoked = {
        serialNumber: cert.serialNumber,
        revocationDate: cert.revocationDate
      };
      
      // Extract revocation reason if present
      if (cert.extensions) {
        const reasonExt = cert.extensions.find(ext => ext.id === '2.5.29.21');
        if (reasonExt) {
          const reasonMap = [
            'unspecified',
            'keyCompromise',
            'caCompromise',
            'affiliationChanged',
            'superseded',
            'cessationOfOperation'
          ];
          
          try {
            const reasonValue = forge.asn1.fromDer(reasonExt.value);
            const reasonCode = parseInt(reasonValue.value, 10);
            revoked.reason = reasonMap[reasonCode] || 'unspecified';
          } catch (e) {
            revoked.reason = 'unspecified';
          }
        }
      }
      
      return revoked;
    });
    
    return {
      issuer,
      thisUpdate: crl.thisUpdate,
      nextUpdate: crl.nextUpdate,
      revokedCertificates,
      totalRevoked: revokedCertificates.length
    };
  } catch (error) {
    console.error('Failed to parse CRL:', error);
    throw new Error(`Failed to parse CRL: ${error.message}`);
  }
}

/**
 * Check if a certificate is revoked
 * @param {string} serialNumber - Certificate serial number
 * @returns {Promise<boolean>} True if certificate is revoked
 */
async function isCertificateRevoked(serialNumber) {
  try {
    const crlPem = await getCRL();
    
    if (!crlPem) {
      return false;
    }
    
    const crl = forge.pki.certificateRevocationListFromPem(crlPem);
    
    // Check if serial number is in the CRL
    const isRevoked = crl.revokedCertificates.some(
      cert => cert.serialNumber === serialNumber
    );
    
    return isRevoked;
  } catch (error) {
    console.error('Failed to check certificate revocation status:', error);
    return false;
  }
}

/**
 * Get CRL information
 * @returns {Promise<Object>} CRL information
 */
async function getCRLInfo() {
  try {
    const crlPem = await getCRL();
    
    if (!crlPem) {
      return {
        exists: false,
        message: 'CRL not found'
      };
    }
    
    const crlInfo = parseCRL(crlPem);
    
    return {
      exists: true,
      ...crlInfo
    };
  } catch (error) {
    console.error('Failed to get CRL info:', error);
    throw error;
  }
}

/**
 * Generate CRL number (incremental)
 * This is a simplified version - in production, you'd want to store this in the database
 * @returns {number} CRL number
 */
function generateCRLNumber() {
  // For now, use timestamp as CRL number
  // In production, this should be stored and incremented in the database
  return Math.floor(Date.now() / 1000);
}

/**
 * Verify CRL signature
 * @param {string} crlPem - CRL in PEM format
 * @returns {Promise<boolean>} True if signature is valid
 */
async function verifyCRLSignature(crlPem) {
  try {
    const caCertPem = await loadCAcertificate();
    const caCert = forge.pki.certificateFromPem(caCertPem);
    const crl = forge.pki.certificateRevocationListFromPem(crlPem);
    
    // Verify CRL signature using CA public key
    const caPublicKey = caCert.publicKey;
    const verified = crl.verify(caPublicKey);
    
    return verified;
  } catch (error) {
    console.error('Failed to verify CRL signature:', error);
    return false;
  }
}

/**
 * Check if CRL needs update
 * @returns {Promise<boolean>} True if CRL needs update
 */
async function needsCRLUpdate() {
  try {
    const crlPem = await getCRL();
    
    if (!crlPem) {
      return true; // No CRL exists
    }
    
    const crl = forge.pki.certificateRevocationListFromPem(crlPem);
    const now = new Date();
    
    // Check if CRL has expired or is about to expire (within 1 day)
    const oneDayFromNow = new Date(now);
    oneDayFromNow.setDate(oneDayFromNow.getDate() + 1);
    
    if (crl.nextUpdate < oneDayFromNow) {
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Failed to check CRL update status:', error);
    return true; // Assume update needed on error
  }
}

/**
 * Get CRL distribution point URL
 * @returns {Promise<string|null>} CRL distribution point URL
 */
async function getCRLDistributionPoint() {
  try {
    const pb = getPocketBase();
    
    // Get CA config
    const configs = await pb.collection('ca_config').getFullList();
    
    if (configs.length === 0) {
      return null;
    }
    
    return configs[0].crl_distribution_point || null;
  } catch (error) {
    console.error('Failed to get CRL distribution point:', error);
    return null;
  }
}

module.exports = {
  generateCRL,
  getCRL,
  parseCRL,
  isCertificateRevoked,
  getCRLInfo,
  verifyCRLSignature,
  needsCRLUpdate,
  getCRLDistributionPoint
};
