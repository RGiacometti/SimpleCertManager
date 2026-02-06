const express = require('express');
const { authenticate } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validator');
const { reportGenerationSchema } = require('../utils/validators');
const {
  generateReport,
  getReport,
  getReports,
  deleteReport,
  generateMonthlyReport,
  generateQuarterlyReport,
  generateAnnualReport,
  exportReportJSON,
  getReportStatistics
} = require('../services/reportService');

const router = express.Router();

/**
 * @route   GET /api/reports
 * @desc    Get all reports
 * @access  Private
 */
router.get('/', authenticate, async (req, res, next) => {
  try {
    const { report_type, start_date, end_date, page, limit } = req.query;
    
    const filters = {
      report_type,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 50
    };
    
    const result = await getReports(filters);
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/reports/stats
 * @desc    Get report statistics
 * @access  Private
 */
router.get('/stats', authenticate, async (req, res, next) => {
  try {
    const stats = await getReportStatistics();
    
    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/reports/:id
 * @desc    Get report by ID
 * @access  Private
 */
router.get('/:id', authenticate, async (req, res, next) => {
  try {
    const report = await getReport(req.params.id);
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/reports/generate
 * @desc    Generate a new report
 * @access  Private
 */
router.post('/generate', authenticate, validateRequest(reportGenerationSchema), async (req, res, next) => {
  try {
    const { report_type, period_start, period_end } = req.body;
    
    const report = await generateReport({
      report_type,
      period_start: new Date(period_start),
      period_end: new Date(period_end),
      userId: req.user.id
    });
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Report generated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/reports/generate/monthly
 * @desc    Generate monthly report
 * @access  Private
 */
router.post('/generate/monthly', authenticate, async (req, res, next) => {
  try {
    const { year, month } = req.body;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        error: 'Year and month are required'
      });
    }
    
    const report = await generateMonthlyReport(
      parseInt(year),
      parseInt(month),
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Monthly report generated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/reports/generate/quarterly
 * @desc    Generate quarterly report
 * @access  Private
 */
router.post('/generate/quarterly', authenticate, async (req, res, next) => {
  try {
    const { year, quarter } = req.body;
    
    if (!year || !quarter) {
      return res.status(400).json({
        success: false,
        error: 'Year and quarter are required'
      });
    }
    
    if (quarter < 1 || quarter > 4) {
      return res.status(400).json({
        success: false,
        error: 'Quarter must be between 1 and 4'
      });
    }
    
    const report = await generateQuarterlyReport(
      parseInt(year),
      parseInt(quarter),
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Quarterly report generated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   POST /api/reports/generate/annual
 * @desc    Generate annual report
 * @access  Private
 */
router.post('/generate/annual', authenticate, async (req, res, next) => {
  try {
    const { year } = req.body;
    
    if (!year) {
      return res.status(400).json({
        success: false,
        error: 'Year is required'
      });
    }
    
    const report = await generateAnnualReport(
      parseInt(year),
      req.user.id
    );
    
    res.status(201).json({
      success: true,
      data: report,
      message: 'Annual report generated successfully'
    });
  } catch (error) {
    next(error);
  }
});

/**
 * @route   GET /api/reports/:id/download
 * @desc    Download report as JSON
 * @access  Private
 */
router.get('/:id/download', authenticate, async (req, res, next) => {
  try {
    const report = await getReport(req.params.id);
    const jsonData = await exportReportJSON(req.params.id);
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="report-${report.id}.json"`);
    res.send(jsonData);
  } catch (error) {
    next(error);
  }
});

/**
 * @route   DELETE /api/reports/:id
 * @desc    Delete a report
 * @access  Private
 */
router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    await deleteReport(req.params.id);
    
    res.json({
      success: true,
      message: 'Report deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
