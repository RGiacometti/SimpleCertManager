const { getPocketBase } = require('../config/database');
const { AUDIT_ACTIONS, ENTITY_TYPES } = require('../config/constants');

/**
 * Audit logging service
 * Records all important actions in the system
 */

/**
 * Log an audit event
 * @param {Object} params - Audit log parameters
 * @param {string} params.action - Action performed (from AUDIT_ACTIONS)
 * @param {string} params.entityType - Type of entity (from ENTITY_TYPES)
 * @param {string} params.entityId - ID of the entity
 * @param {string} params.userId - ID of the user performing the action
 * @param {Object} params.details - Additional details about the action
 * @param {string} params.ipAddress - IP address of the user
 * @returns {Promise<Object>} Created audit log record
 */
async function logAudit({ action, entityType, entityId, userId, details = {}, ipAddress = null }) {
  try {
    const pb = getPocketBase();
    
    // Validate action
    const validActions = Object.values(AUDIT_ACTIONS);
    if (!validActions.includes(action)) {
      throw new Error(`Invalid audit action: ${action}`);
    }
    
    // Validate entity type
    const validEntityTypes = Object.values(ENTITY_TYPES);
    if (!validEntityTypes.includes(entityType)) {
      throw new Error(`Invalid entity type: ${entityType}`);
    }
    
    // Create audit log entry
    const auditLog = await pb.collection('audit_logs').create({
      action,
      entity_type: entityType,
      entity_id: entityId,
      user: userId,
      details: details,
      ip_address: ipAddress,
      timestamp: new Date().toISOString()
    });
    
    return auditLog;
  } catch (error) {
    // Log to console if database logging fails
    console.error('Failed to create audit log:', error);
    console.error('Audit details:', { action, entityType, entityId, userId, details });
    throw error;
  }
}

/**
 * Log certificate request creation
 */
async function logCreateRequest(requestId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.CREATE_REQUEST,
    entityType: ENTITY_TYPES.CERTIFICATE_REQUEST,
    entityId: requestId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log certificate request approval
 */
async function logApproveRequest(requestId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.APPROVE_REQUEST,
    entityType: ENTITY_TYPES.CERTIFICATE_REQUEST,
    entityId: requestId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log certificate request rejection
 */
async function logRejectRequest(requestId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.REJECT_REQUEST,
    entityType: ENTITY_TYPES.CERTIFICATE_REQUEST,
    entityId: requestId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log certificate issuance
 */
async function logIssueCertificate(certificateId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.ISSUE_CERTIFICATE,
    entityType: ENTITY_TYPES.CERTIFICATE,
    entityId: certificateId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log certificate revocation
 */
async function logRevokeCertificate(certificateId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.REVOKE_CERTIFICATE,
    entityType: ENTITY_TYPES.CERTIFICATE,
    entityId: certificateId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log certificate renewal
 */
async function logRenewCertificate(certificateId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.RENEW_CERTIFICATE,
    entityType: ENTITY_TYPES.CERTIFICATE,
    entityId: certificateId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log certificate download
 */
async function logDownloadCertificate(certificateId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.DOWNLOAD_CERTIFICATE,
    entityType: ENTITY_TYPES.CERTIFICATE,
    entityId: certificateId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log certificate view
 */
async function logViewCertificate(certificateId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.VIEW_CERTIFICATE,
    entityType: ENTITY_TYPES.CERTIFICATE,
    entityId: certificateId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Log CA initialization
 */
async function logInitializeCA(userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.INITIALIZE_CA,
    entityType: ENTITY_TYPES.CA_CONFIG,
    entityId: 'ca_init',
    userId,
    ipAddress,
    details
  });
}

/**
 * Log CA configuration update
 */
async function logUpdateCAConfig(configId, userId, ipAddress, details = {}) {
  return logAudit({
    action: AUDIT_ACTIONS.UPDATE_CA_CONFIG,
    entityType: ENTITY_TYPES.CA_CONFIG,
    entityId: configId,
    userId,
    ipAddress,
    details
  });
}

/**
 * Get audit logs with filters
 * @param {Object} filters - Filter parameters
 * @param {string} filters.action - Filter by action
 * @param {string} filters.entityType - Filter by entity type
 * @param {string} filters.userId - Filter by user
 * @param {Date} filters.startDate - Filter by start date
 * @param {Date} filters.endDate - Filter by end date
 * @param {number} filters.page - Page number
 * @param {number} filters.limit - Items per page
 * @returns {Promise<Object>} Paginated audit logs
 */
async function getAuditLogs(filters = {}) {
  try {
    const pb = getPocketBase();
    const {
      action,
      entityType,
      userId,
      startDate,
      endDate,
      page = 1,
      limit = 50
    } = filters;
    
    // Build filter query
    const filterParts = [];
    
    if (action) {
      filterParts.push(`action = "${action}"`);
    }
    
    if (entityType) {
      filterParts.push(`entity_type = "${entityType}"`);
    }
    
    if (userId) {
      filterParts.push(`user = "${userId}"`);
    }
    
    if (startDate) {
      filterParts.push(`timestamp >= "${startDate.toISOString()}"`);
    }
    
    if (endDate) {
      filterParts.push(`timestamp <= "${endDate.toISOString()}"`);
    }
    
    const filterQuery = filterParts.length > 0 ? filterParts.join(' && ') : '';
    
    // Fetch audit logs
    const result = await pb.collection('audit_logs').getList(page, limit, {
      filter: filterQuery,
      sort: '-timestamp',
      expand: 'user'
    });
    
    return {
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    throw error;
  }
}

/**
 * Get audit log by ID
 * @param {string} id - Audit log ID
 * @returns {Promise<Object>} Audit log record
 */
async function getAuditLogById(id) {
  try {
    const pb = getPocketBase();
    const auditLog = await pb.collection('audit_logs').getOne(id, {
      expand: 'user'
    });
    return auditLog;
  } catch (error) {
    console.error('Failed to fetch audit log:', error);
    throw error;
  }
}

/**
 * Get audit logs for a specific entity
 * @param {string} entityType - Entity type
 * @param {string} entityId - Entity ID
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of audit logs
 */
async function getEntityAuditLogs(entityType, entityId, limit = 50) {
  try {
    const pb = getPocketBase();
    
    const result = await pb.collection('audit_logs').getList(1, limit, {
      filter: `entity_type = "${entityType}" && entity_id = "${entityId}"`,
      sort: '-timestamp',
      expand: 'user'
    });
    
    return result.items;
  } catch (error) {
    console.error('Failed to fetch entity audit logs:', error);
    throw error;
  }
}

/**
 * Get recent audit logs
 * @param {number} limit - Maximum number of logs to return
 * @returns {Promise<Array>} Array of recent audit logs
 */
async function getRecentAuditLogs(limit = 20) {
  try {
    const pb = getPocketBase();
    
    const result = await pb.collection('audit_logs').getList(1, limit, {
      sort: '-timestamp',
      expand: 'user'
    });
    
    return result.items;
  } catch (error) {
    console.error('Failed to fetch recent audit logs:', error);
    throw error;
  }
}

/**
 * Get audit statistics
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @returns {Promise<Object>} Audit statistics
 */
async function getAuditStatistics(startDate, endDate) {
  try {
    const pb = getPocketBase();
    
    const filterQuery = `timestamp >= "${startDate.toISOString()}" && timestamp <= "${endDate.toISOString()}"`;
    
    // Get all logs in the period
    const result = await pb.collection('audit_logs').getFullList({
      filter: filterQuery
    });
    
    // Calculate statistics
    const stats = {
      total: result.length,
      byAction: {},
      byEntityType: {},
      byUser: {}
    };
    
    result.forEach(log => {
      // Count by action
      stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
      
      // Count by entity type
      stats.byEntityType[log.entity_type] = (stats.byEntityType[log.entity_type] || 0) + 1;
      
      // Count by user
      if (log.user) {
        stats.byUser[log.user] = (stats.byUser[log.user] || 0) + 1;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Failed to calculate audit statistics:', error);
    throw error;
  }
}

module.exports = {
  logAudit,
  logCreateRequest,
  logApproveRequest,
  logRejectRequest,
  logIssueCertificate,
  logRevokeCertificate,
  logRenewCertificate,
  logDownloadCertificate,
  logViewCertificate,
  logInitializeCA,
  logUpdateCAConfig,
  getAuditLogs,
  getAuditLogById,
  getEntityAuditLogs,
  getRecentAuditLogs,
  getAuditStatistics
};
