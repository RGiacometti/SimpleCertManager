const forge = require('node-forge');
const crypto = require('crypto');

/**
 * Cryptographic utilities using node-forge
 */

/**
 * Generate RSA key pair
 * @param {number} keySize - Key size in bits (2048 or 4096)
 * @returns {Promise<{privateKey: string, publicKey: string}>} PEM-encoded keys
 */
function generateKeyPair(keySize = 2048) {
  return new Promise((resolve, reject) => {
    forge.pki.rsa.generateKeyPair({ bits: keySize, workers: -1 }, (err, keypair) => {
      if (err) {
        return reject(err);
      }
      
      const privateKeyPem = forge.pki.privateKeyToPem(keypair.privateKey);
      const publicKeyPem = forge.pki.publicKeyToPem(keypair.publicKey);
      
      resolve({
        privateKey: privateKeyPem,
        publicKey: publicKeyPem,
        privateKeyObj: keypair.privateKey,
        publicKeyObj: keypair.publicKey
      });
    });
  });
}

/**
 * Encrypt private key with passphrase using AES-256-CBC
 * @param {string} privateKeyPem - Private key in PEM format
 * @param {string} passphrase - Passphrase to encrypt with
 * @returns {string} Encrypted private key in PEM format
 */
function encryptPrivateKey(privateKeyPem, passphrase) {
  const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
  
  // Encrypt using AES-256-CBC
  const encryptedPem = forge.pki.encryptRsaPrivateKey(
    privateKey,
    passphrase,
    {
      algorithm: 'aes256',
      count: 10000, // PBKDF2 iterations
      saltSize: 16
    }
  );
  
  return encryptedPem;
}

/**
 * Decrypt private key with passphrase
 * @param {string} encryptedPrivateKeyPem - Encrypted private key in PEM format
 * @param {string} passphrase - Passphrase to decrypt with
 * @returns {Object} Decrypted private key object
 * @throws {Error} If passphrase is incorrect
 */
function decryptPrivateKey(encryptedPrivateKeyPem, passphrase) {
  try {
    const privateKey = forge.pki.decryptRsaPrivateKey(encryptedPrivateKeyPem, passphrase);
    
    if (!privateKey) {
      throw new Error('Invalid passphrase');
    }
    
    return privateKey;
  } catch (error) {
    throw new Error('Failed to decrypt private key: Invalid passphrase');
  }
}

/**
 * Generate a random serial number for certificates
 * @returns {string} Hex-encoded serial number
 */
function generateSerialNumber() {
  // Generate 16 bytes (128 bits) of random data
  const bytes = forge.random.getBytesSync(16);
  const hex = forge.util.bytesToHex(bytes);
  
  // Ensure it's positive by setting the first bit to 0
  const serialNumber = '00' + hex;
  
  return serialNumber;
}

/**
 * Calculate SHA-256 fingerprint of a certificate
 * @param {string} certificatePem - Certificate in PEM format
 * @returns {string} Hex-encoded SHA-256 fingerprint (64 chars, lowercase)
 */
function calculateFingerprint(certificatePem) {
  const cert = forge.pki.certificateFromPem(certificatePem);
  const der = forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes();
  
  const md = forge.md.sha256.create();
  md.update(der);
  const hash = md.digest().toHex();
  
  // Return lowercase hex without separators (exactly 64 characters)
  return hash.toLowerCase();
}

/**
 * Verify if a passphrase is correct for an encrypted private key
 * @param {string} encryptedPrivateKeyPem - Encrypted private key in PEM format
 * @param {string} passphrase - Passphrase to verify
 * @returns {boolean} True if passphrase is correct
 */
function verifyPassphrase(encryptedPrivateKeyPem, passphrase) {
  try {
    const privateKey = forge.pki.decryptRsaPrivateKey(encryptedPrivateKeyPem, passphrase);
    return privateKey !== null;
  } catch (error) {
    return false;
  }
}

/**
 * Create a Certificate Signing Request (CSR)
 * @param {Object} subject - Subject information
 * @param {Object} privateKey - Private key object
 * @returns {string} CSR in PEM format
 */
function createCSR(subject, privateKey) {
  const csr = forge.pki.createCertificationRequest();
  csr.publicKey = forge.pki.rsa.setPublicKey(privateKey.n, privateKey.e);
  
  // Set subject
  const attrs = [];
  if (subject.commonName) attrs.push({ name: 'commonName', value: subject.commonName });
  if (subject.country) attrs.push({ name: 'countryName', value: subject.country });
  if (subject.state) attrs.push({ name: 'stateOrProvinceName', value: subject.state });
  if (subject.locality) attrs.push({ name: 'localityName', value: subject.locality });
  if (subject.organization) attrs.push({ name: 'organizationName', value: subject.organization });
  if (subject.organizationalUnit) attrs.push({ name: 'organizationalUnitName', value: subject.organizationalUnit });
  if (subject.email) attrs.push({ name: 'emailAddress', value: subject.email });
  
  csr.setSubject(attrs);
  
  // Sign CSR
  csr.sign(privateKey);
  
  return forge.pki.certificationRequestToPem(csr);
}

/**
 * Parse a certificate and extract information
 * @param {string} certificatePem - Certificate in PEM format
 * @returns {Object} Certificate information
 */
function parseCertificate(certificatePem) {
  const cert = forge.pki.certificateFromPem(certificatePem);
  
  const subject = {};
  cert.subject.attributes.forEach(attr => {
    subject[attr.shortName || attr.name] = attr.value;
  });
  
  const issuer = {};
  cert.issuer.attributes.forEach(attr => {
    issuer[attr.shortName || attr.name] = attr.value;
  });
  
  // Extract SANs if present
  const sans = { dns: [], ip: [] };
  const sanExt = cert.extensions.find(ext => ext.name === 'subjectAltName');
  if (sanExt && sanExt.altNames) {
    sanExt.altNames.forEach(altName => {
      if (altName.type === 2) { // DNS
        sans.dns.push(altName.value);
      } else if (altName.type === 7) { // IP
        sans.ip.push(altName.ip);
      }
    });
  }
  
  return {
    serialNumber: cert.serialNumber,
    subject,
    issuer,
    notBefore: cert.validity.notBefore,
    notAfter: cert.validity.notAfter,
    sans,
    fingerprint: calculateFingerprint(certificatePem)
  };
}

/**
 * Generate a secure random password
 * @param {number} length - Password length
 * @returns {string} Random password
 */
function generateRandomPassword(length = 32) {
  const bytes = forge.random.getBytesSync(length);
  return forge.util.bytesToHex(bytes);
}

/**
 * Hash data using SHA-256
 * @param {string} data - Data to hash
 * @returns {string} Hex-encoded hash
 */
function sha256(data) {
  const md = forge.md.sha256.create();
  md.update(data, 'utf8');
  return md.digest().toHex();
}

/**
 * Securely clear sensitive data from memory
 * @param {string|Object} data - Data to clear
 */
function clearSensitiveData(data) {
  if (typeof data === 'string') {
    // Overwrite string with zeros (best effort in JavaScript)
    data = '\0'.repeat(data.length);
  } else if (typeof data === 'object' && data !== null) {
    // Recursively clear object properties
    Object.keys(data).forEach(key => {
      if (typeof data[key] === 'string') {
        data[key] = '\0'.repeat(data[key].length);
      }
      delete data[key];
    });
  }
}

module.exports = {
  generateKeyPair,
  encryptPrivateKey,
  decryptPrivateKey,
  generateSerialNumber,
  calculateFingerprint,
  verifyPassphrase,
  createCSR,
  parseCertificate,
  generateRandomPassword,
  sha256,
  clearSensitiveData
};
