const { getPocketBase } = require('../config/database');
const { CERT_STATUS, REPORT_TYPES, AUDIT_ACTIONS } = require('../config/constants');

/**
 * Report generation service
 */

/**
 * Generate a compliance report
 * @param {Object} params - Report parameters
 * @param {string} params.report_type - Type of report (monthly, quarterly, annual, on_demand)
 * @param {Date} params.period_start - Start date of the period
 * @param {Date} params.period_end - End date of the period
 * @param {string} params.userId - User generating the report
 * @returns {Promise<Object>} Generated report
 */
async function generateReport({ report_type, period_start, period_end, userId }) {
  try {
    const pb = getPocketBase();
    
    console.log(`Generating ${report_type} report from ${period_start} to ${period_end}...`);
    
    // Get all certificates
    const allCertificates = await pb.collection('certificates').getFullList();
    
    // Get certificates issued in the period
    const issuedInPeriod = allCertificates.filter(cert => {
      const issuedAt = new Date(cert.issued_at);
      return issuedAt >= period_start && issuedAt <= period_end;
    });
    
    // Get certificates revoked in the period
    const revokedInPeriod = allCertificates.filter(cert => {
      if (!cert.revoked_at) return false;
      const revokedAt = new Date(cert.revoked_at);
      return revokedAt >= period_start && revokedAt <= period_end;
    });
    
    // Get certificates expired in the period
    const expiredInPeriod = allCertificates.filter(cert => {
      const notAfter = new Date(cert.not_after);
      return notAfter >= period_start && notAfter <= period_end && cert.status === CERT_STATUS.EXPIRED;
    });
    
    // Current status counts
    const activeCertificates = allCertificates.filter(cert => cert.status === CERT_STATUS.ACTIVE);
    const expiredCertificates = allCertificates.filter(cert => cert.status === CERT_STATUS.EXPIRED);
    const revokedCertificates = allCertificates.filter(cert => cert.status === CERT_STATUS.REVOKED);
    
    // Certificates expiring soon (within 30 days from period_end)
    const thirtyDaysFromEnd = new Date(period_end);
    thirtyDaysFromEnd.setDate(thirtyDaysFromEnd.getDate() + 30);
    
    const expiringSoon = activeCertificates.filter(cert => {
      const notAfter = new Date(cert.not_after);
      return notAfter <= thirtyDaysFromEnd && notAfter > period_end;
    });
    
    // Get audit logs for the period
    const auditLogs = await pb.collection('audit_logs').getFullList({
      filter: `timestamp >= "${period_start.toISOString()}" && timestamp <= "${period_end.toISOString()}"`
    });
    
    // Analyze audit logs
    const auditStats = {
      total_actions: auditLogs.length,
      by_action: {},
      by_user: {}
    };
    
    auditLogs.forEach(log => {
      auditStats.by_action[log.action] = (auditStats.by_action[log.action] || 0) + 1;
      if (log.user) {
        auditStats.by_user[log.user] = (auditStats.by_user[log.user] || 0) + 1;
      }
    });
    
    // Certificate requests in the period
    const requests = await pb.collection('certificate_requests').getFullList({
      filter: `requested_at >= "${period_start.toISOString()}" && requested_at <= "${period_end.toISOString()}"`
    });
    
    const requestStats = {
      total: requests.length,
      pending: requests.filter(r => r.status === 'pending').length,
      approved: requests.filter(r => r.status === 'approved').length,
      rejected: requests.filter(r => r.status === 'rejected').length,
      issued: requests.filter(r => r.status === 'issued').length
    };
    
    // Revocation reasons breakdown
    const revocationReasons = {};
    revokedCertificates.forEach(cert => {
      const reason = cert.revocation_reason || 'unspecified';
      revocationReasons[reason] = (revocationReasons[reason] || 0) + 1;
    });
    
    // Certificate validity distribution
    const validityDistribution = {
      '0-90 days': 0,
      '91-180 days': 0,
      '181-365 days': 0,
      '366-730 days': 0,
      '730+ days': 0
    };
    
    issuedInPeriod.forEach(cert => {
      const notBefore = new Date(cert.not_before);
      const notAfter = new Date(cert.not_after);
      const validityDays = Math.floor((notAfter - notBefore) / (1000 * 60 * 60 * 24));
      
      if (validityDays <= 90) {
        validityDistribution['0-90 days']++;
      } else if (validityDays <= 180) {
        validityDistribution['91-180 days']++;
      } else if (validityDays <= 365) {
        validityDistribution['181-365 days']++;
      } else if (validityDays <= 730) {
        validityDistribution['366-730 days']++;
      } else {
        validityDistribution['730+ days']++;
      }
    });
    
    // Build report data
    const reportData = {
      period: {
        start: period_start.toISOString(),
        end: period_end.toISOString(),
        type: report_type
      },
      summary: {
        total_certificates: allCertificates.length,
        active_certificates: activeCertificates.length,
        expired_certificates: expiredCertificates.length,
        revoked_certificates: revokedCertificates.length,
        expiring_soon: expiringSoon.length
      },
      period_activity: {
        certificates_issued: issuedInPeriod.length,
        certificates_revoked: revokedInPeriod.length,
        certificates_expired: expiredInPeriod.length,
        requests_submitted: requestStats.total
      },
      request_statistics: requestStats,
      revocation_reasons: revocationReasons,
      validity_distribution: validityDistribution,
      audit_statistics: auditStats,
      expiring_certificates: expiringSoon.map(cert => ({
        serial_number: cert.serial_number,
        common_name: cert.common_name,
        not_after: cert.not_after,
        days_until_expiry: Math.floor((new Date(cert.not_after) - new Date()) / (1000 * 60 * 60 * 24))
      })),
      compliance_notes: generateComplianceNotes({
        activeCertificates: activeCertificates.length,
        expiringSoon: expiringSoon.length,
        revokedInPeriod: revokedInPeriod.length
      })
    };
    
    // Save report to database
    const report = await pb.collection('compliance_reports').create({
      report_type,
      period_start: period_start.toISOString(),
      period_end: period_end.toISOString(),
      total_certificates: allCertificates.length,
      active_certificates: activeCertificates.length,
      expired_certificates: expiredCertificates.length,
      revoked_certificates: revokedCertificates.length,
      expiring_soon: expiringSoon.length,
      report_data: reportData,
      generated_by: userId,
      generated_at: new Date().toISOString()
    });
    
    console.log(`Report ${report.id} generated successfully`);
    
    return report;
  } catch (error) {
    console.error('Failed to generate report:', error);
    throw new Error(`Failed to generate report: ${error.message}`);
  }
}

/**
 * Generate compliance notes based on report data
 * @param {Object} data - Report data
 * @returns {Array<string>} Compliance notes
 */
function generateComplianceNotes(data) {
  const notes = [];
  
  if (data.expiringSoon > 0) {
    notes.push(`⚠️ ${data.expiringSoon} certificate(s) expiring within 30 days - renewal recommended`);
  }
  
  if (data.activeCertificates === 0) {
    notes.push('ℹ️ No active certificates in the system');
  }
  
  if (data.revokedInPeriod > 5) {
    notes.push(`⚠️ High number of revocations (${data.revokedInPeriod}) in this period - review security practices`);
  }
  
  if (data.activeCertificates > 0 && data.expiringSoon === 0) {
    notes.push('✅ All certificates have sufficient validity period');
  }
  
  return notes;
}

/**
 * Get report by ID
 * @param {string} reportId - Report ID
 * @returns {Promise<Object>} Report
 */
async function getReport(reportId) {
  try {
    const pb = getPocketBase();
    const report = await pb.collection('compliance_reports').getOne(reportId, {
      expand: 'generated_by'
    });
    return report;
  } catch (error) {
    console.error('Failed to get report:', error);
    throw error;
  }
}

/**
 * Get all reports with filters
 * @param {Object} filters - Filter parameters
 * @returns {Promise<Object>} Paginated reports
 */
async function getReports(filters = {}) {
  try {
    const pb = getPocketBase();
    const {
      report_type,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = filters;
    
    // Build filter query
    const filterParts = [];
    
    if (report_type) {
      filterParts.push(`report_type = "${report_type}"`);
    }
    
    if (start_date) {
      filterParts.push(`generated_at >= "${start_date.toISOString()}"`);
    }
    
    if (end_date) {
      filterParts.push(`generated_at <= "${end_date.toISOString()}"`);
    }
    
    const filterQuery = filterParts.length > 0 ? filterParts.join(' && ') : '';
    
    const result = await pb.collection('compliance_reports').getList(page, limit, {
      filter: filterQuery,
      sort: '-generated_at',
      expand: 'generated_by'
    });
    
    return {
      items: result.items,
      page: result.page,
      perPage: result.perPage,
      totalItems: result.totalItems,
      totalPages: result.totalPages
    };
  } catch (error) {
    console.error('Failed to get reports:', error);
    throw error;
  }
}

/**
 * Delete a report
 * @param {string} reportId - Report ID
 * @returns {Promise<boolean>} Success status
 */
async function deleteReport(reportId) {
  try {
    const pb = getPocketBase();
    await pb.collection('compliance_reports').delete(reportId);
    return true;
  } catch (error) {
    console.error('Failed to delete report:', error);
    throw error;
  }
}

/**
 * Generate monthly report
 * @param {number} year - Year
 * @param {number} month - Month (1-12)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Generated report
 */
async function generateMonthlyReport(year, month, userId) {
  const period_start = new Date(year, month - 1, 1);
  const period_end = new Date(year, month, 0, 23, 59, 59, 999);
  
  return generateReport({
    report_type: REPORT_TYPES.MONTHLY,
    period_start,
    period_end,
    userId
  });
}

/**
 * Generate quarterly report
 * @param {number} year - Year
 * @param {number} quarter - Quarter (1-4)
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Generated report
 */
async function generateQuarterlyReport(year, quarter, userId) {
  const startMonth = (quarter - 1) * 3;
  const period_start = new Date(year, startMonth, 1);
  const period_end = new Date(year, startMonth + 3, 0, 23, 59, 59, 999);
  
  return generateReport({
    report_type: REPORT_TYPES.QUARTERLY,
    period_start,
    period_end,
    userId
  });
}

/**
 * Generate annual report
 * @param {number} year - Year
 * @param {string} userId - User ID
 * @returns {Promise<Object>} Generated report
 */
async function generateAnnualReport(year, userId) {
  const period_start = new Date(year, 0, 1);
  const period_end = new Date(year, 11, 31, 23, 59, 59, 999);
  
  return generateReport({
    report_type: REPORT_TYPES.ANNUAL,
    period_start,
    period_end,
    userId
  });
}

/**
 * Export report as JSON
 * @param {string} reportId - Report ID
 * @returns {Promise<string>} JSON string
 */
async function exportReportJSON(reportId) {
  try {
    const report = await getReport(reportId);
    return JSON.stringify(report, null, 2);
  } catch (error) {
    console.error('Failed to export report as JSON:', error);
    throw error;
  }
}

/**
 * Get report summary statistics
 * @returns {Promise<Object>} Report statistics
 */
async function getReportStatistics() {
  try {
    const pb = getPocketBase();
    
    const allReports = await pb.collection('compliance_reports').getFullList();
    
    const stats = {
      total: allReports.length,
      by_type: {
        monthly: 0,
        quarterly: 0,
        annual: 0,
        on_demand: 0
      },
      latest_report: null
    };
    
    allReports.forEach(report => {
      stats.by_type[report.report_type]++;
    });
    
    if (allReports.length > 0) {
      // Sort by generated_at descending
      allReports.sort((a, b) => new Date(b.generated_at) - new Date(a.generated_at));
      stats.latest_report = {
        id: allReports[0].id,
        type: allReports[0].report_type,
        generated_at: allReports[0].generated_at
      };
    }
    
    return stats;
  } catch (error) {
    console.error('Failed to get report statistics:', error);
    throw error;
  }
}

module.exports = {
  generateReport,
  getReport,
  getReports,
  deleteReport,
  generateMonthlyReport,
  generateQuarterlyReport,
  generateAnnualReport,
  exportReportJSON,
  getReportStatistics
};
