const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validator');
const {
  intermediateCACreationSchema,
  intermediateCAUpdateSchema,
  intermediateCARevocationSchema,
  passphraseSchema
} = require('../utils/validators');
const {
  createIntermediateCA,
  listIntermediateCAs,
  getIntermediateCA,
  updateIntermediateCA,
  revokeIntermediateCA,
  getIntermediateCACertificate,
  getIntermediateCAChain,
  verifyIntermediateCAPassphrase,
  getIntermediateCAStatus
} = require('../services/intermediateCAService');
const {
  logCreateIntermediateCA,
  logRevokeIntermediateCA,
  logUpdateIntermediateCA
} = require('../services/auditService');

const router = express.Router();

/**
 * @route   GET /api/intermediate-cas
 * @desc    List all Intermediate CAs
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status } = req.query;
    
    const result = await listIntermediateCAs({ status });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/intermediate-cas/:id
 * @desc    Get Intermediate CA details
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const ica = await getIntermediateCA(req.params.id);
    
    res.json({
      success: true,
      data: ica
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/intermediate-cas
 * @desc    Create a new Intermediate CA
 * @access  Private
 */
router.post('/', authenticate, validateBody(intermediateCACreationSchema), async (req, res, next) => {
  try {
    const ica = await createIntermediateCA(req.body, req.user.id);
    
    // Log audit
    await logCreateIntermediateCA(
      ica.id,
      req.user.id,
      req.ip,
      {
        name: ica.name,
        common_name: ica.common_name,
        serial_number: ica.serial_number
      }
    );
    
    res.status(201).json({
      success: true,
      data: ica,
      message: 'Intermediate CA created successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/intermediate-cas/:id
 * @desc    Update Intermediate CA metadata
 * @access  Private
 */
router.put('/:id', authenticate, validateBody(intermediateCAUpdateSchema), async (req, res, next) => {
  try {
    const updatedICA = await updateIntermediateCA(req.params.id, req.body);
    
    // Log audit
    await logUpdateIntermediateCA(
      updatedICA.id,
      req.user.id,
      req.ip,
      { updates: Object.keys(req.body) }
    );
    
    res.json({
      success: true,
      data: updatedICA,
      message: 'Intermediate CA updated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/intermediate-cas/:id/revoke
 * @desc    Revoke an Intermediate CA
 * @access  Private
 */
router.post('/:id/revoke', authenticate, validateBody(intermediateCARevocationSchema), async (req, res, next) => {
  try {
    const { root_passphrase, reason } = req.body;
    
    const result = await revokeIntermediateCA(req.params.id, root_passphrase, reason);
    
    // Log audit
    await logRevokeIntermediateCA(
      result.id,
      req.user.id,
      req.ip,
      {
        name: result.name,
        reason,
        certificates_revoked: result.certificates_revoked
      }
    );
    
    res.json({
      success: true,
      data: result,
      message: 'Intermediate CA revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/intermediate-cas/:id/certificate
 * @desc    Download Intermediate CA certificate
 * @access  Private
 */
router.get('/:id/certificate', authenticate, async (req, res, next) => {
  try {
    const certPem = await getIntermediateCACertificate(req.params.id);
    
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="ica-${req.params.id}.crt"`);
    res.send(certPem);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/intermediate-cas/:id/chain
 * @desc    Download full chain PEM (ICA cert + Root cert)
 * @access  Private
 */
router.get('/:id/chain', authenticate, async (req, res, next) => {
  try {
    const chainPem = await getIntermediateCAChain(req.params.id);
    
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="ica-${req.params.id}-chain.pem"`);
    res.send(chainPem);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/intermediate-cas/:id/verify-passphrase
 * @desc    Verify Intermediate CA passphrase
 * @access  Private
 */
router.post('/:id/verify-passphrase', authenticate, validateBody(passphraseSchema), async (req, res, next) => {
  try {
    const { passphrase } = req.body;
    
    const isValid = await verifyIntermediateCAPassphrase(req.params.id, passphrase);
    
    res.json({
      success: true,
      data: { valid: isValid }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/intermediate-cas/:id/status
 * @desc    Get Intermediate CA status information
 * @access  Private
 */
router.get('/:id/status', authenticate, async (req, res, next) => {
  try {
    const status = await getIntermediateCAStatus(req.params.id);
    
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
