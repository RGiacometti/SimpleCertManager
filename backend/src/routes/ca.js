const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validator');
const { caInitializationSchema, caConfigUpdateSchema, passphraseSchema } = require('../utils/validators');
const {
  initializeCA,
  getCAConfig,
  updateCAConfig,
  getCACertificate,
  verifyCAPassphrase,
  checkCAInitialized,
  getCAStatus
} = require('../services/caService');
const { getCRL, getCRLInfo, generateCRL } = require('../services/crlService');
const { logInitializeCA, logUpdateCAConfig } = require('../services/auditService');

const router = express.Router();

/**
 * @route   GET /api/ca/status
 * @desc    Get CA status and information
 * @access  Private
 */
router.get('/status', authenticate, async (req, res, next) => {
  try {
    const status = await getCAStatus();
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ca/config
 * @desc    Get CA configuration
 * @access  Private
 */
router.get('/config', authenticate, async (req, res, next) => {
  try {
    const config = await getCAConfig();
    
    res.json({
      success: true,
      data: config,
      initialized: config !== null
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ca/initialize
 * @desc    Initialize the Certificate Authority
 * @access  Private
 */
router.post('/initialize', authenticate, validateBody(caInitializationSchema), async (req, res, next) => {
  try {
    // Check if CA is already initialized
    const initialized = await checkCAInitialized();
    if (initialized) {
      return res.status(400).json({
        success: false,
        error: 'CA is already initialized'
      });
    }
    
    const caInfo = await initializeCA(req.body);
    
    // Log initialization
    await logInitializeCA(
      req.user.id,
      req.ip,
      {
        ca_name: req.body.ca_name,
        key_size: req.body.key_size,
        validity_years: req.body.validity_years
      }
    );
    
    res.status(201).json({
      success: true,
      data: caInfo,
      message: 'CA initialized successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/ca/config
 * @desc    Update CA configuration
 * @access  Private
 */
router.put('/config', authenticate, validateBody(caConfigUpdateSchema), async (req, res, next) => {
  try {
    const updatedConfig = await updateCAConfig(req.body);
    
    // Log update
    await logUpdateCAConfig(
      updatedConfig.id,
      req.user.id,
      req.ip,
      { updates: req.body }
    );
    
    res.json({
      success: true,
      data: updatedConfig,
      message: 'CA configuration updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ca/certificate
 * @desc    Download CA certificate
 * @access  Public (CA certificate should be publicly accessible)
 */
router.get('/certificate', async (req, res, next) => {
  try {
    const caCert = await getCACertificate();
    
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', 'attachment; filename="ca-cert.pem"');
    res.send(caCert);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ca/crl
 * @desc    Download Certificate Revocation List
 * @access  Public (CRL should be publicly accessible)
 */
router.get('/crl', async (req, res, next) => {
  try {
    const crl = await getCRL();
    
    if (!crl) {
      return res.status(404).json({
        success: false,
        error: 'CRL not found'
      });
    }
    
    res.setHeader('Content-Type', 'application/pkix-crl');
    res.setHeader('Content-Disposition', 'attachment; filename="ca.crl"');
    res.send(crl);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ca/crl/info
 * @desc    Get CRL information
 * @access  Private
 */
router.get('/crl/info', authenticate, async (req, res, next) => {
  try {
    const crlInfo = await getCRLInfo();
    
    res.json({
      success: true,
      data: crlInfo
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ca/crl/regenerate
 * @desc    Regenerate CRL
 * @access  Private
 */
router.post('/crl/regenerate', authenticate, validateBody(passphraseSchema), async (req, res, next) => {
  try {
    const { passphrase } = req.body;
    
    const crl = await generateCRL(passphrase);
    
    res.json({
      success: true,
      message: 'CRL regenerated successfully',
      data: {
        size: crl.length
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/ca/verify-passphrase
 * @desc    Verify CA passphrase
 * @access  Private
 */
router.post('/verify-passphrase', authenticate, validateBody(passphraseSchema), async (req, res, next) => {
  try {
    const { passphrase } = req.body;
    
    const isValid = await verifyCAPassphrase(passphrase);
    
    res.json({
      success: true,
      data: {
        valid: isValid
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/ca/initialized
 * @desc    Check if CA is initialized
 * @access  Public
 */
router.get('/initialized', async (req, res, next) => {
  try {
    const initialized = await checkCAInitialized();
    
    res.json({
      success: true,
      data: {
        initialized
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
