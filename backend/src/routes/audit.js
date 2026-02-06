const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateQuery } = require('../middleware/validator');
const { auditFilterSchema } = require('../utils/validators');
const {
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
  getRecentAuditLogs,
  getAuditStatistics
} = require('../services/auditService');

const router = express.Router();

/**
 * @route   GET /api/audit/logs
 * @desc    Get audit logs with filters
 * @access  Private
 */
router.get('/logs', authenticate, async (req, res, next) => {
  try {
    const {
      action,
      entity_type,
      user_id,
      start_date,
      end_date,
      page,
      limit
    } = req.query;
    
    const filters = {
      action,
      entityType: entity_type,
      userId: user_id,
      startDate: start_date ? new Date(start_date) : undefined,
      endDate: end_date ? new Date(end_date) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    };
    
    const result = await getAuditLogs(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/audit/logs/recent
 * @desc    Get recent audit logs
 * @access  Private
 */
router.get('/logs/recent', authenticate, async (req, res, next) => {
  try {
    const { limit = 20 } = req.query;
    
    const logs = await getRecentAuditLogs(parseInt(limit));
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/audit/logs/:id
 * @desc    Get audit log by ID
 * @access  Private
 */
router.get('/logs/:id', authenticate, async (req, res, next) => {
  try {
    const log = await getAuditLogById(req.params.id);
    
    res.json({
      success: true,
      data: log
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/audit/entity/:entityType/:entityId
 * @desc    Get audit logs for a specific entity
 * @access  Private
 */
router.get('/entity/:entityType/:entityId', authenticate, async (req, res, next) => {
  try {
    const { entityType, entityId } = req.params;
    const { limit = 50 } = req.query;
    
    const logs = await getEntityAuditLogs(entityType, entityId, parseInt(limit));
    
    res.json({
      success: true,
      data: logs
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/audit/statistics
 * @desc    Get audit statistics for a period
 * @access  Private
 */
router.get('/statistics', authenticate, async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;
    
    if (!start_date || !end_date) {
      return res.status(400).json({
        success: false,
        error: 'start_date and end_date are required'
      });
    }
    
    const stats = await getAuditStatistics(
      new Date(start_date),
      new Date(end_date)
    );
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/audit/actions
 * @desc    Get list of available audit actions
 * @access  Private
 */
router.get('/actions', authenticate, async (req, res, next) => {
  try {
    const { AUDIT_ACTIONS } = require('../config/constants');
    
    res.json({
      success: true,
      data: Object.values(AUDIT_ACTIONS)
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/audit/entity-types
 * @desc    Get list of available entity types
 * @access  Private
 */
router.get('/entity-types', authenticate, async (req, res, next) => {
  try {
    const { ENTITY_TYPES } = require('../config/constants');
    
    res.json({
      success: true,
      data: Object.values(ENTITY_TYPES)
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
