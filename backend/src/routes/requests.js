const express = require('express');
const { getPocketBase } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { validateBody } = require('../middleware/validator');
const { certificateRequestSchema } = require('../utils/validators');
const { REQUEST_STATUS } = require('../config/constants');
const {
  logCreateRequest,
  logApproveRequest,
  logRejectRequest
} = require('../services/auditService');

const router = express.Router();

/**
 * @route   GET /api/requests
 * @desc    Get all certificate requests
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    const { status, common_name, page = 1, limit = 50 } = req.query;
    
    // Build filter
    const filterParts = [];
    if (status) {
      filterParts.push(`status = "${status}"`);
    }
    if (common_name) {
      filterParts.push(`common_name ~ "${common_name}"`);
    }
    
    const filterQuery = filterParts.length > 0 ? filterParts.join(' && ') : '';
    
    const result = await pb.collection('certificate_requests').getList(
      parseInt(page),
      parseInt(limit),
      {
      filter: filterQuery,
      sort: '-requested_at',
      expand: 'requested_by'
      }
    );
    
    res.json({
      success: true,
      data: {
        items: result.items,
        page: result.page,
        perPage: result.perPage,
        totalItems: result.totalItems,
        totalPages: result.totalPages
      }
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/requests/:id
 * @desc    Get certificate request by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    const request = await pb.collection('certificate_requests').getOne(req.params.id, {
      expand: 'requested_by'
    });
    
    res.json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/requests
 * @desc    Create a new certificate request
 * @access  Private
 */
router.post('/', authenticate, validateBody(certificateRequestSchema), async (req, res, next) => {
  try {
    const pb = getPocketBase();
    
    const requestData = {
      ...req.body,
      requested_by: req.user.id,
      requested_at: new Date().toISOString(),
      status: REQUEST_STATUS.PENDING
    };
    
    const request = await pb.collection('certificate_requests').create(requestData);
    
    // Log audit
    await logCreateRequest(
      request.id,
      req.user.id,
      req.ip,
      { common_name: request.common_name }
    );
    
    res.status(201).json({
      success: true,
      data: request
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   PUT /api/requests/:id
 * @desc    Update a certificate request (only if pending)
 * @access  Private
 */
router.put('/:id', authenticate, validateBody(certificateRequestSchema), async (req, res, next) => {
  try {
    const pb = getPocketBase();
    
    // Get existing request
    const existingRequest = await pb.collection('certificate_requests').getOne(req.params.id);
    
    // Only allow updates if status is pending
    if (existingRequest.status !== REQUEST_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be updated'
      });
    }
    
    // Only allow the requester to update their own request
    if (existingRequest.requested_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own requests'
      });
    }
    
    const updatedRequest = await pb.collection('certificate_requests').update(
      req.params.id,
      req.body
    );
    
    res.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/requests/:id
 * @desc    Delete a certificate request (only if pending)
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    
    // Get existing request
    const existingRequest = await pb.collection('certificate_requests').getOne(req.params.id);
    
    // Only allow deletion if status is pending
    if (existingRequest.status !== REQUEST_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be deleted'
      });
    }
    
    // Only allow the requester to delete their own request
    if (existingRequest.requested_by !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'You can only delete your own requests'
      });
    }
    
    await pb.collection('certificate_requests').delete(req.params.id);
    
    res.json({
      success: true,
      message: 'Request deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/requests/:id/approve
 * @desc    Approve a certificate request
 * @access  Private
 */
router.post('/:id/approve', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    
    // Get existing request
    const existingRequest = await pb.collection('certificate_requests').getOne(req.params.id);
    
    // Only allow approval if status is pending
    if (existingRequest.status !== REQUEST_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be approved'
      });
    }
    
    const updatedRequest = await pb.collection('certificate_requests').update(
      req.params.id,
      { status: REQUEST_STATUS.APPROVED }
    );
    
    // Log audit
    await logApproveRequest(
      updatedRequest.id,
      req.user.id,
      req.ip,
      { common_name: updatedRequest.common_name }
    );
    
    res.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/requests/:id/reject
 * @desc    Reject a certificate request
 * @access  Private
 */
router.post('/:id/reject', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    const { reason } = req.body;
    
    // Get existing request
    const existingRequest = await pb.collection('certificate_requests').getOne(req.params.id);
    
    // Only allow rejection if status is pending
    if (existingRequest.status !== REQUEST_STATUS.PENDING) {
      return res.status(400).json({
        success: false,
        error: 'Only pending requests can be rejected'
      });
    }
    
    const updateData = {
      status: REQUEST_STATUS.REJECTED
    };
    
    if (reason) {
      updateData.notes = reason;
    }
    
    const updatedRequest = await pb.collection('certificate_requests').update(
      req.params.id,
      updateData
    );
    
    // Log audit
    await logRejectRequest(
      updatedRequest.id,
      req.user.id,
      req.ip,
      { common_name: updatedRequest.common_name, reason }
    );
    
    res.json({
      success: true,
      data: updatedRequest
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/requests/stats/summary
 * @desc    Get request statistics summary
 * @access  Private
 */
router.get('/stats/summary', authenticate, async (req, res, next) => {
  try {
    const pb = getPocketBase();
    
    const allRequests = await pb.collection('certificate_requests').getFullList();
    
    const stats = {
      total: allRequests.length,
      pending: allRequests.filter(r => r.status === REQUEST_STATUS.PENDING).length,
      approved: allRequests.filter(r => r.status === REQUEST_STATUS.APPROVED).length,
      rejected: allRequests.filter(r => r.status === REQUEST_STATUS.REJECTED).length,
      issued: allRequests.filter(r => r.status === REQUEST_STATUS.ISSUED).length
    };
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
