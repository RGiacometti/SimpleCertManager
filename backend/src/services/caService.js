const forge = require('node-forge');
const {
  generateKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  verifyPassphrase,
  calculateFingerprint
} = require('../utils/crypto');
const {
  saveCAcertificate,
  saveCAPrivateKey,
  loadCAcertificate,
  loadCAPrivateKey,
  isCAInitialized,
  initializeStorage
} = require('../utils/fileManager');
const { getPocketBase } = require('../config/database');
const { CA_VALIDITY_YEARS } = require('../config/constants');
const { generateCRL } = require('./crlService');

/**
 * Certificate Authority (CA) management service
 */

/**
 * Initialize the Certificate Authority
 * @param {Object} caData - CA initialization data
 * @param {string} caData.ca_name - CA name
 * @param {string} caData.organization - Organization name
 * @param {string} caData.organizational_unit - Organizational unit
 * @param {string} caData.country - Country code (2 letters)
 * @param {string} caData.state - State/Province
 * @param {string} caData.locality - City/Locality
 * @param {string} caData.email - Email address
 * @param {string} caData.passphrase - Passphrase to encrypt CA private key
 * @param {number} caData.key_size - Key size (2048 or 4096)
 * @param {number} caData.validity_years - Validity period in years
 * @param {number} caData.default_validity_days - Default validity for issued certificates
 * @param {number} caData.default_key_size - Default key size for issued certificates
 * @param {string} caData.crl_distribution_point - CRL distribution point URL
 * @returns {Promise<Object>} CA configuration
 */
async function initializeCA(caData) {
  try {
    // Check if CA is already initialized
    const initialized = await isCAInitialized();
    if (initialized) {
      throw new Error('CA is already initialized');
    }
    
    // Initialize storage directories
    await initializeStorage();
    
    const {
      ca_name,
      organization,
      organizational_unit,
      country,
      state,
      locality,
      email,
      passphrase,
      key_size = 4096,
      validity_years = CA_VALIDITY_YEARS,
      default_validity_days = 365,
      default_key_size = 2048,
      crl_distribution_point = ''
    } = caData;
    
    console.log('Generating CA key pair...');
    // Generate CA key pair
    const { privateKey, publicKey, privateKeyObj, publicKeyObj } = await generateKeyPair(key_size);
    
    console.log('Creating CA certificate...');
    // Create CA certificate
    const cert = forge.pki.createCertificate();
    
    // Set public key
    cert.publicKey = publicKeyObj;
    
    // Generate serial number
    cert.serialNumber = '01';
    
    // Set validity period
    const notBefore = new Date();
    const notAfter = new Date();
    notAfter.setFullYear(notAfter.getFullYear() + validity_years);
    
    cert.validity.notBefore = notBefore;
    cert.validity.notAfter = notAfter;
    
    // Set subject (same as issuer for self-signed)
    const attrs = [
      { name: 'commonName', value: ca_name },
      { name: 'organizationName', value: organization },
      { name: 'countryName', value: country }
    ];
    
    if (organizational_unit) {
      attrs.push({ name: 'organizationalUnitName', value: organizational_unit });
    }
    if (state) {
      attrs.push({ name: 'stateOrProvinceName', value: state });
    }
    if (locality) {
      attrs.push({ name: 'localityName', value: locality });
    }
    if (email) {
      attrs.push({ name: 'emailAddress', value: email });
    }
    
    cert.setSubject(attrs);
    cert.setIssuer(attrs); // Self-signed
    
    // Set extensions for CA certificate
    const extensions = [
      {
        name: 'basicConstraints',
        cA: true,
        critical: true
      },
      {
        name: 'keyUsage',
        keyCertSign: true,
        cRLSign: true,
        critical: true
      },
      {
        name: 'subjectKeyIdentifier'
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
    
    console.log('Signing CA certificate...');
    // Self-sign the certificate
    cert.sign(privateKeyObj, forge.md.sha256.create());
    
    // Convert to PEM format
    const certPem = forge.pki.certificateToPem(cert);
    
    console.log('Encrypting CA private key...');
    // Encrypt private key with passphrase
    const encryptedPrivateKey = encryptPrivateKey(privateKey, passphrase);
    
    console.log('Saving CA files...');
    // Save CA certificate and encrypted private key
    await saveCAcertificate(certPem);
    await saveCAPrivateKey(encryptedPrivateKey);
    
    // Calculate fingerprint
    const fingerprint = calculateFingerprint(certPem);
    
    console.log('Saving CA configuration to database...');
    // Save CA configuration to database
    const pb = getPocketBase();
    const caConfig = await pb.collection('ca_config').create({
      ca_name,
      ca_certificate_pem: certPem,
      ca_private_key_encrypted: 'stored_on_disk', // Placeholder - actual key is stored in storage/ca/
      ca_serial_number: 1, // Start serial numbers from 1
      ca_not_before: notBefore.toISOString(),
      ca_not_after: notAfter.toISOString(),
      default_validity_days,
      default_key_size,
      crl_distribution_point: crl_distribution_point || ''
    });
    
    console.log('Generating initial CRL...');
    // Generate initial empty CRL
    try {
      await generateCRL(passphrase);
    } catch (error) {
      console.warn('Failed to generate initial CRL:', error.message);
    }
    
    console.log('CA initialized successfully');
    
    return {
      id: caConfig.id,
      ca_name,
      fingerprint,
      not_before: notBefore,
      not_after: notAfter,
      key_size,
      validity_years
    };
  } catch (error) {
    console.error('Failed to initialize CA:', error);
    throw new Error(`Failed to initialize CA: ${error.message}`);
  }
}

/**
 * Get CA configuration
 * @returns {Promise<Object>} CA configuration
 */
async function getCAConfig() {
  try {
    const pb = getPocketBase();
    
    // Get CA config from database
    const configs = await pb.collection('ca_config').getFullList();
    
    if (configs.length === 0) {
      return null; // CA not initialized yet
    }
    
    const config = configs[0];
    
    // Calculate fingerprint
    const fingerprint = calculateFingerprint(config.ca_certificate_pem);
    
    return {
      id: config.id,
      ca_name: config.ca_name,
      ca_certificate_pem: config.ca_certificate_pem,
      ca_serial_number: config.ca_serial_number,
      ca_not_before: config.ca_not_before,
      ca_not_after: config.ca_not_after,
      default_validity_days: config.default_validity_days,
      default_key_size: config.default_key_size,
      crl_distribution_point: config.crl_distribution_point,
      fingerprint,
      created: config.created,
      updated: config.updated
    };
  } catch (error) {
    console.error('Failed to get CA config:', error);
    throw error;
  }
}

/**
 * Update CA configuration
 * @param {Object} updates - Configuration updates
 * @returns {Promise<Object>} Updated configuration
 */
async function updateCAConfig(updates) {
  try {
    const pb = getPocketBase();
    
    // Get current config
    const configs = await pb.collection('ca_config').getFullList();
    
    if (configs.length === 0) {
      throw new Error('CA not initialized');
    }
    
    const config = configs[0];
    
    // Update allowed fields only
    const allowedUpdates = {};
    if (updates.default_validity_days !== undefined) {
      allowedUpdates.default_validity_days = updates.default_validity_days;
    }
    if (updates.default_key_size !== undefined) {
      allowedUpdates.default_key_size = updates.default_key_size;
    }
    if (updates.crl_distribution_point !== undefined) {
      allowedUpdates.crl_distribution_point = updates.crl_distribution_point;
    }
    
    // Update config
    const updatedConfig = await pb.collection('ca_config').update(config.id, allowedUpdates);
    
    return updatedConfig;
  } catch (error) {
    console.error('Failed to update CA config:', error);
    throw error;
  }
}

/**
 * Get CA certificate
 * @returns {Promise<string>} CA certificate in PEM format
 */
async function getCACertificate() {
  try {
    return await loadCAcertificate();
  } catch (error) {
    console.error('Failed to get CA certificate:', error);
    throw error;
  }
}

/**
 * Verify CA passphrase
 * @param {string} passphrase - Passphrase to verify
 * @returns {Promise<boolean>} True if passphrase is correct
 */
async function verifyCAPassphrase(passphrase) {
  try {
    const encryptedKey = await loadCAPrivateKey();
    return verifyPassphrase(encryptedKey, passphrase);
  } catch (error) {
    console.error('Failed to verify CA passphrase:', error);
    return false;
  }
}

/**
 * Get next serial number for certificate
 * @returns {Promise<string>} Next serial number in hex format
 */
async function getNextSerialNumber() {
  try {
    const pb = getPocketBase();
    
    // Get current config
    const configs = await pb.collection('ca_config').getFullList();
    
    if (configs.length === 0) {
      throw new Error('CA not initialized');
    }
    
    const config = configs[0];
    const nextSerial = config.ca_serial_number + 1;
    
    // Update serial number in database
    await pb.collection('ca_config').update(config.id, {
      ca_serial_number: nextSerial
    });
    
    // Convert to hex string (padded to 16 characters)
    const serialHex = nextSerial.toString(16).toUpperCase().padStart(16, '0');
    
    return serialHex;
  } catch (error) {
    console.error('Failed to get next serial number:', error);
    throw error;
  }
}

/**
 * Check if CA is initialized
 * @returns {Promise<boolean>} True if CA is initialized
 */
async function checkCAInitialized() {
  try {
    const fileCheck = await isCAInitialized();
    
    if (!fileCheck) {
      return false;
    }
    
    // Also check database
    const pb = getPocketBase();
    const configs = await pb.collection('ca_config').getFullList();
    
    return configs.length > 0;
  } catch (error) {
    console.error('Failed to check CA initialization:', error);
    return false;
  }
}

/**
 * Get CA status and information
 * @returns {Promise<Object>} CA status information
 */
async function getCAStatus() {
  try {
    const initialized = await checkCAInitialized();
    
    if (!initialized) {
      return {
        initialized: false,
        message: 'CA not initialized'
      };
    }
    
    const config = await getCAConfig();
    const caCert = forge.pki.certificateFromPem(config.ca_certificate_pem);
    
    const now = new Date();
    const notBefore = new Date(config.ca_not_before);
    const notAfter = new Date(config.ca_not_after);
    
    const daysUntilExpiry = Math.floor((notAfter - now) / (1000 * 60 * 60 * 24));
    const isExpired = now > notAfter;
    const isValid = now >= notBefore && now <= notAfter;
    
    // Get certificate count
    const pb = getPocketBase();
    const totalCerts = await pb.collection('certificates').getFullList();
    
    // Get intermediate CA count
    let intermediateCACount = 0;
    let activeIntermediateCACount = 0;
    try {
      const allICAs = await pb.collection('intermediate_cas').getFullList();
      intermediateCACount = allICAs.length;
      activeIntermediateCACount = allICAs.filter(ica => ica.status === 'active').length;
    } catch (error) {
      // Collection may not exist yet in older installations
      console.warn('Could not fetch intermediate CAs:', error.message);
    }
    
    return {
      initialized: true,
      ca_name: config.ca_name,
      fingerprint: config.fingerprint,
      not_before: notBefore,
      not_after: notAfter,
      is_valid: isValid,
      is_expired: isExpired,
      days_until_expiry: daysUntilExpiry,
      total_certificates_issued: totalCerts.length,
      serial_number: config.ca_serial_number,
      default_validity_days: config.default_validity_days,
      default_key_size: config.default_key_size,
      intermediate_ca_count: intermediateCACount,
      active_intermediate_ca_count: activeIntermediateCACount
    };
  } catch (error) {
    console.error('Failed to get CA status:', error);
    throw error;
  }
}

/**
 * Get CA private key (decrypted)
 * IMPORTANT: This should only be used internally and the key should be cleared from memory after use
 * @param {string} passphrase - CA passphrase
 * @returns {Promise<Object>} Decrypted private key object
 */
async function getCAPrivateKey(passphrase) {
  try {
    const encryptedKey = await loadCAPrivateKey();
    return decryptPrivateKey(encryptedKey, passphrase);
  } catch (error) {
    console.error('Failed to get CA private key:', error);
    throw error;
  }
}

module.exports = {
  initializeCA,
  getCAConfig,
  updateCAConfig,
  getCACertificate,
  verifyCAPassphrase,
  getNextSerialNumber,
  checkCAInitialized,
  getCAStatus,
  getCAPrivateKey
};
