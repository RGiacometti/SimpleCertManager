const fs = require('fs').promises;
const fsSync = require('fs');
const path = require('path');
const {
  CA_PATH,
  INTERMEDIATE_CA_PATH,
  CERTIFICATES_PATH,
  PRIVATE_KEYS_PATH,
  CRL_PATH,
  INTERMEDIATE_CRL_PATH
} = require('../config/constants');

/**
 * File management utilities for certificate storage
 */

/**
 * Ensure a directory exists, create if it doesn't
 * @param {string} dirPath - Directory path
 */
async function ensureDirectory(dirPath) {
  try {
    await fs.access(dirPath);
  } catch (error) {
    if (error.code === 'ENOENT') {
      await fs.mkdir(dirPath, { recursive: true, mode: 0o700 });
    } else {
      throw error;
    }
  }
}

/**
 * Initialize storage directories
 */
async function initializeStorage() {
  await ensureDirectory(CA_PATH);
  await ensureDirectory(CERTIFICATES_PATH);
  await ensureDirectory(PRIVATE_KEYS_PATH);
  await ensureDirectory(CRL_PATH);
  
  // Set restrictive permissions on private keys directory
  try {
    await fs.chmod(PRIVATE_KEYS_PATH, 0o700);
  } catch (error) {
    console.warn('Could not set permissions on private keys directory:', error.message);
  }
}

/**
 * Save CA certificate
 * @param {string} certificatePem - CA certificate in PEM format
 * @returns {string} File path
 */
async function saveCAcertificate(certificatePem) {
  await ensureDirectory(CA_PATH);
  const filePath = path.join(CA_PATH, 'ca-cert.pem');
  await fs.writeFile(filePath, certificatePem, { mode: 0o644 });
  return filePath;
}

/**
 * Save CA private key (encrypted)
 * @param {string} encryptedPrivateKeyPem - Encrypted private key in PEM format
 * @returns {string} File path
 */
async function saveCAPrivateKey(encryptedPrivateKeyPem) {
  await ensureDirectory(CA_PATH);
  const filePath = path.join(CA_PATH, 'ca-key.pem');
  await fs.writeFile(filePath, encryptedPrivateKeyPem, { mode: 0o600 });
  return filePath;
}

/**
 * Load CA certificate
 * @returns {string} CA certificate in PEM format
 */
async function loadCAcertificate() {
  const filePath = path.join(CA_PATH, 'ca-cert.pem');
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('CA certificate not found. Please initialize the CA first.');
    }
    throw error;
  }
}

/**
 * Load CA private key (encrypted)
 * @returns {string} Encrypted CA private key in PEM format
 */
async function loadCAPrivateKey() {
  const filePath = path.join(CA_PATH, 'ca-key.pem');
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error('CA private key not found. Please initialize the CA first.');
    }
    throw error;
  }
}

/**
 * Check if CA is initialized
 * @returns {boolean} True if CA exists
 */
async function isCAInitialized() {
  try {
    const certPath = path.join(CA_PATH, 'ca-cert.pem');
    const keyPath = path.join(CA_PATH, 'ca-key.pem');
    
    await fs.access(certPath);
    await fs.access(keyPath);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Save certificate
 * @param {string} serialNumber - Certificate serial number
 * @param {string} certificatePem - Certificate in PEM format
 * @returns {string} File path
 */
async function saveCertificate(serialNumber, certificatePem) {
  await ensureDirectory(CERTIFICATES_PATH);
  const fileName = `${serialNumber}.crt`;
  const filePath = path.join(CERTIFICATES_PATH, fileName);
  await fs.writeFile(filePath, certificatePem, { mode: 0o644 });
  return filePath;
}

/**
 * Save private key
 * @param {string} serialNumber - Certificate serial number
 * @param {string} privateKeyPem - Private key in PEM format
 * @returns {string} File path
 */
async function savePrivateKey(serialNumber, privateKeyPem) {
  await ensureDirectory(PRIVATE_KEYS_PATH);
  const fileName = `${serialNumber}.key`;
  const filePath = path.join(PRIVATE_KEYS_PATH, fileName);
  await fs.writeFile(filePath, privateKeyPem, { mode: 0o600 });
  return filePath;
}

/**
 * Load certificate
 * @param {string} serialNumber - Certificate serial number
 * @returns {string} Certificate in PEM format
 */
async function loadCertificate(serialNumber) {
  const fileName = `${serialNumber}.crt`;
  const filePath = path.join(CERTIFICATES_PATH, fileName);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Certificate ${serialNumber} not found`);
    }
    throw error;
  }
}

/**
 * Load private key
 * @param {string} serialNumber - Certificate serial number
 * @returns {string} Private key in PEM format
 */
async function loadPrivateKey(serialNumber) {
  const fileName = `${serialNumber}.key`;
  const filePath = path.join(PRIVATE_KEYS_PATH, fileName);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Private key for certificate ${serialNumber} not found`);
    }
    throw error;
  }
}

/**
 * Delete certificate files
 * @param {string} serialNumber - Certificate serial number
 */
async function deleteCertificateFiles(serialNumber) {
  const certPath = path.join(CERTIFICATES_PATH, `${serialNumber}.crt`);
  const keyPath = path.join(PRIVATE_KEYS_PATH, `${serialNumber}.key`);
  
  try {
    await fs.unlink(certPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to delete certificate file: ${error.message}`);
    }
  }
  
  try {
    await fs.unlink(keyPath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to delete private key file: ${error.message}`);
    }
  }
}

/**
 * Save CRL (Certificate Revocation List)
 * @param {string} crlPem - CRL in PEM format
 * @returns {string} File path
 */
async function saveCRL(crlPem) {
  await ensureDirectory(CRL_PATH);
  const filePath = path.join(CRL_PATH, 'ca.crl');
  await fs.writeFile(filePath, crlPem, { mode: 0o644 });
  return filePath;
}

/**
 * Load CRL
 * @returns {string|null} CRL in PEM format or null if not found
 */
async function loadCRL() {
  const filePath = path.join(CRL_PATH, 'ca.crl');
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

/**
 * Create a ZIP bundle with certificate, private key, and CA certificate
 * @param {string} serialNumber - Certificate serial number
 * @returns {Buffer} ZIP file buffer
 */
async function createCertificateBundle(serialNumber) {
  const archiver = require('archiver');
  const { Readable } = require('stream');
  
  const archive = archiver('zip', { zlib: { level: 9 } });
  const chunks = [];
  
  return new Promise(async (resolve, reject) => {
    archive.on('data', chunk => chunks.push(chunk));
    archive.on('end', () => resolve(Buffer.concat(chunks)));
    archive.on('error', reject);
    
    try {
      // Add certificate
      const cert = await loadCertificate(serialNumber);
      archive.append(cert, { name: `${serialNumber}.crt` });
      
      // Add private key
      const key = await loadPrivateKey(serialNumber);
      archive.append(key, { name: `${serialNumber}.key` });
      
      // Add CA certificate
      const caCert = await loadCAcertificate();
      archive.append(caCert, { name: 'ca-cert.pem' });
      
      // Add README
      const readme = `Certificate Bundle for ${serialNumber}
=====================================

This bundle contains:
- ${serialNumber}.crt: Your certificate
- ${serialNumber}.key: Your private key (keep this secure!)
- ca-cert.pem: CA certificate (for trust chain)

Installation instructions:
1. Copy the certificate and key to your server
2. Configure your web server to use these files
3. Import ca-cert.pem into your client's trust store

IMPORTANT: Keep the private key secure and never share it!
`;
      archive.append(readme, { name: 'README.txt' });
      
      archive.finalize();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Get file stats
 * @param {string} filePath - File path
 * @returns {Object} File stats
 */
async function getFileStats(filePath) {
  try {
    return await fs.stat(filePath);
  } catch (error) {
    return null;
  }
}

/**
 * List all certificate files
 * @returns {Array<string>} Array of serial numbers
 */
async function listCertificates() {
  try {
    const files = await fs.readdir(CERTIFICATES_PATH);
    return files
      .filter(file => file.endsWith('.crt'))
      .map(file => path.basename(file, '.crt'));
  } catch (error) {
    return [];
  }
}

/**
 * Check if file exists
 * @param {string} filePath - File path
 * @returns {boolean} True if file exists
 */
function fileExists(filePath) {
  return fsSync.existsSync(filePath);
}

// ============================================================
// Intermediate CA file operations
// ============================================================

/**
 * Ensure Intermediate CA directories exist
 */
async function ensureICADirectories() {
  await ensureDirectory(INTERMEDIATE_CA_PATH);
  await ensureDirectory(INTERMEDIATE_CRL_PATH);
}

/**
 * Get the directory path for a specific Intermediate CA
 * @param {string} icaId - Intermediate CA ID
 * @returns {string} Directory path
 */
function getICADirectory(icaId) {
  return path.join(INTERMEDIATE_CA_PATH, icaId);
}

/**
 * Save Intermediate CA certificate
 * @param {string} icaId - Intermediate CA ID
 * @param {string} certPem - ICA certificate in PEM format
 * @returns {Promise<string>} File path
 */
async function saveIntermediateCACertificate(icaId, certPem) {
  const icaDir = getICADirectory(icaId);
  await ensureDirectory(icaDir);
  const filePath = path.join(icaDir, 'ica-cert.pem');
  await fs.writeFile(filePath, certPem, { mode: 0o644 });
  return filePath;
}

/**
 * Save Intermediate CA private key (encrypted)
 * @param {string} icaId - Intermediate CA ID
 * @param {string} encryptedKeyPem - Encrypted private key in PEM format
 * @returns {Promise<string>} File path
 */
async function saveIntermediateCAPrivateKey(icaId, encryptedKeyPem) {
  const icaDir = getICADirectory(icaId);
  await ensureDirectory(icaDir);
  const filePath = path.join(icaDir, 'ica-key.pem');
  await fs.writeFile(filePath, encryptedKeyPem, { mode: 0o600 });
  return filePath;
}

/**
 * Save Intermediate CA chain (ICA cert + Root cert)
 * @param {string} icaId - Intermediate CA ID
 * @param {string} chainPem - Full chain in PEM format
 * @returns {Promise<string>} File path
 */
async function saveIntermediateCAChain(icaId, chainPem) {
  const icaDir = getICADirectory(icaId);
  await ensureDirectory(icaDir);
  const filePath = path.join(icaDir, 'chain.pem');
  await fs.writeFile(filePath, chainPem, { mode: 0o644 });
  return filePath;
}

/**
 * Load Intermediate CA certificate
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<string>} ICA certificate in PEM format
 */
async function loadIntermediateCACertificate(icaId) {
  const filePath = path.join(getICADirectory(icaId), 'ica-cert.pem');
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Intermediate CA certificate not found for ID: ${icaId}`);
    }
    throw error;
  }
}

/**
 * Load Intermediate CA private key (encrypted)
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<string>} Encrypted ICA private key in PEM format
 */
async function loadIntermediateCAPrivateKey(icaId) {
  const filePath = path.join(getICADirectory(icaId), 'ica-key.pem');
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Intermediate CA private key not found for ID: ${icaId}`);
    }
    throw error;
  }
}

/**
 * Load Intermediate CA chain (ICA cert + Root cert)
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<string>} Full chain in PEM format
 */
async function loadIntermediateCAChain(icaId) {
  const filePath = path.join(getICADirectory(icaId), 'chain.pem');
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(`Intermediate CA chain not found for ID: ${icaId}`);
    }
    throw error;
  }
}

/**
 * Check if Intermediate CA files exist
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<boolean>} True if ICA files exist
 */
async function isIntermediateCAInitialized(icaId) {
  try {
    const icaDir = getICADirectory(icaId);
    const certPath = path.join(icaDir, 'ica-cert.pem');
    const keyPath = path.join(icaDir, 'ica-key.pem');
    
    await fs.access(certPath);
    await fs.access(keyPath);
    
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Delete Intermediate CA files
 * @param {string} icaId - Intermediate CA ID
 */
async function deleteIntermediateCAFiles(icaId) {
  const icaDir = getICADirectory(icaId);
  
  const files = ['ica-cert.pem', 'ica-key.pem', 'chain.pem'];
  
  for (const file of files) {
    try {
      await fs.unlink(path.join(icaDir, file));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        console.error(`Failed to delete ICA file ${file}: ${error.message}`);
      }
    }
  }
  
  // Try to remove the directory
  try {
    await fs.rmdir(icaDir);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error(`Failed to remove ICA directory: ${error.message}`);
    }
  }
}

/**
 * Save Intermediate CA CRL
 * @param {string} icaId - Intermediate CA ID
 * @param {string} crlData - CRL data
 * @returns {Promise<string>} File path
 */
async function saveIntermediateCRL(icaId, crlData) {
  await ensureDirectory(INTERMEDIATE_CRL_PATH);
  const filePath = path.join(INTERMEDIATE_CRL_PATH, `${icaId}.crl`);
  await fs.writeFile(filePath, crlData, { mode: 0o644 });
  return filePath;
}

/**
 * Load Intermediate CA CRL
 * @param {string} icaId - Intermediate CA ID
 * @returns {Promise<string|null>} CRL data or null if not found
 */
async function loadIntermediateCRL(icaId) {
  const filePath = path.join(INTERMEDIATE_CRL_PATH, `${icaId}.crl`);
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

module.exports = {
  ensureDirectory,
  initializeStorage,
  saveCAcertificate,
  saveCAPrivateKey,
  loadCAcertificate,
  loadCAPrivateKey,
  isCAInitialized,
  saveCertificate,
  savePrivateKey,
  loadCertificate,
  loadPrivateKey,
  deleteCertificateFiles,
  saveCRL,
  loadCRL,
  createCertificateBundle,
  getFileStats,
  listCertificates,
  fileExists,
  // Intermediate CA file operations
  ensureICADirectories,
  saveIntermediateCACertificate,
  saveIntermediateCAPrivateKey,
  saveIntermediateCAChain,
  loadIntermediateCACertificate,
  loadIntermediateCAPrivateKey,
  loadIntermediateCAChain,
  isIntermediateCAInitialized,
  deleteIntermediateCAFiles,
  saveIntermediateCRL,
  loadIntermediateCRL
};
