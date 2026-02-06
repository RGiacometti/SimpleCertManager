const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { passphraseSchema, revocationSchema } = require('../utils/validators');
const {
  issueCertificate,
  revokeCertificate,
  renewCertificate,
  getCertificate,
  getCertificates,
  getExpiringCertificates,
  downloadCertificate,
  downloadPrivateKey,
  downloadCertificateBundle,
  getCertificateStatistics
} = require('../services/certificateService');
const {
  logIssueCertificate,
  logRevokeCertificate,
  logRenewCertificate,
  logDownloadCertificate,
  logViewCertificate
} = require('../services/auditService');

const router = express.Router();

/**
 * @route   GET /api/certificates
 * @desc    Get all certificates
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { status, common_name, expiring_days, page, limit } = req.query;
    
    const result = await getCertificates({
      status,
      common_name,
      expiring_days: expiring_days ? parseInt(expiring_days) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    });
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/expiring
 * @desc    Get certificates expiring soon
 * @access  Private
 */
router.get('/expiring', authenticate, async (req, res, next) => {
  try {
    const { days = 30 } = req.query;
    
    const certificates = await getExpiringCertificates(parseInt(days));
    
    res.json({
      success: true,
      data: certificates
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/stats
 * @desc    Get certificate statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await getCertificateStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/:id
 * @desc    Get certificate by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const certificate = await getCertificate(req.params.id);
    
    // Log view
    await logViewCertificate(
      certificate.id,
      req.user.id,
      req.ip,
      { serial_number: certificate.serial_number }
    );
    
    res.json({
      success: true,
      data: certificate
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/certificates/issue/:requestId
 * @desc    Issue a certificate from an approved request
 * @access  Private
 */
router.post('/issue/:requestId', authenticate, validateRequest(passphraseSchema), async (req, res, next) => {
  try {
    const { passphrase } = req.body;
    
    const certificate = await issueCertificate(req.params.requestId, passphrase);
    
    // Log issuance
    await logIssueCertificate(
      certificate.id,
      req.user.id,
      req.ip,
      {
        serial_number: certificate.serial_number,
        common_name: certificate.common_name,
        request_id: req.params.requestId
      }
    );
    
    res.status(201).json({
      success: true,
      data: certificate,
      message: 'Certificate issued successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/certificates/:id/revoke
 * @desc    Revoke a certificate
 * @access  Private
 */
router.post('/:id/revoke', authenticate, validateRequest(revocationSchema), async (req, res, next) => {
  try {
    const { passphrase, reason, notes } = req.body;
    
    const certificate = await revokeCertificate(req.params.id, passphrase, reason);
    
    // Log revocation
    await logRevokeCertificate(
      certificate.id,
      req.user.id,
      req.ip,
      {
        serial_number: certificate.serial_number,
        common_name: certificate.common_name,
        reason,
        notes
      }
    );
    
    res.json({
      success: true,
      data: certificate,
      message: 'Certificate revoked successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/certificates/:id/renew
 * @desc    Renew a certificate
 * @access  Private
 */
router.post('/:id/renew', authenticate, validateRequest(passphraseSchema), async (req, res, next) => {
  try {
    const { passphrase, validity_days } = req.body;
    
    const newCertificate = await renewCertificate(
      req.params.id,
      passphrase,
      validity_days ? parseInt(validity_days) : null
    );
    
    // Log renewal
    await logRenewCertificate(
      newCertificate.id,
      req.user.id,
      req.ip,
      {
        old_certificate_id: req.params.id,
        new_serial_number: newCertificate.serial_number,
        common_name: newCertificate.common_name
      }
    );
    
    res.status(201).json({
      success: true,
      data: newCertificate,
      message: 'Certificate renewed successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/:id/download
 * @desc    Download certificate file (.crt)
 * @access  Private
 */
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const certificate = await getCertificate(req.params.id);
    const certPem = await downloadCertificate(req.params.id);
    
    // Log download
    await logDownloadCertificate(
      certificate.id,
      req.user.id,
      req.ip,
      { serial_number: certificate.serial_number, type: 'certificate' }
    );
    
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.serial_number}.crt"`);
    res.send(certPem);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/:id/download-key
 * @desc    Download private key file (.key)
 * @access  Private
 */
router.get('/:id/download-key', authenticate, async (req, res, next) => {
  try {
    const certificate = await getCertificate(req.params.id);
    const keyPem = await downloadPrivateKey(req.params.id);
    
    // Log download
    await logDownloadCertificate(
      certificate.id,
      req.user.id,
      req.ip,
      { serial_number: certificate.serial_number, type: 'private_key' }
    );
    
    res.setHeader('Content-Type', 'application/x-pem-file');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.serial_number}.key"`);
    res.send(keyPem);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/certificates/:id/download-bundle
 * @desc    Download certificate bundle (.zip)
 * @access  Private
 */
router.get('/:id/download-bundle', authenticate, async (req, res, next) => {
  try {
    const certificate = await getCertificate(req.params.id);
    const bundle = await downloadCertificateBundle(req.params.id);
    
    // Log download
    await logDownloadCertificate(
      certificate.id,
      req.user.id,
      req.ip,
      { serial_number: certificate.serial_number, type: 'bundle' }
    );
    
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${certificate.serial_number}-bundle.zip"`);
    res.send(bundle);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
