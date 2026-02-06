const Joi = require('joi');
const { AppError } = require('./errorHandler');

/**
 * Validate request body against Joi schema
 */
function validateBody(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new AppError(
        `Validation error: ${errors.map(e => e.message).join(', ')}`,
        400
      ));
    }
    
    req.body = value;
    next();
  };
}

/**
 * Validate request query parameters against Joi schema
 */
function validateQuery(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new AppError(
        `Validation error: ${errors.map(e => e.message).join(', ')}`,
        400
      ));
    }
    
    req.query = value;
    next();
  };
}

/**
 * Validate request params against Joi schema
 */
function validateParams(schema) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params, {
      abortEarly: false,
      stripUnknown: true
    });
    
    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return next(new AppError(
        `Validation error: ${errors.map(e => e.message).join(', ')}`,
        400
      ));
    }
    
    req.params = value;
    next();
  };
}

// Common validation schemas
const schemas = {
  id: Joi.object({
    id: Joi.string().required()
  }),
  
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    perPage: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().optional(),
    filter: Joi.string().optional()
  }),
  
  certificateRequest: Joi.object({
    common_name: Joi.string().required().max(255),
    organization: Joi.string().optional().max(255),
    organizational_unit: Joi.string().optional().max(255),
    country: Joi.string().length(2).uppercase().optional(),
    state: Joi.string().optional().max(255),
    locality: Joi.string().optional().max(255),
    email: Joi.string().email().optional(),
    san_dns: Joi.array().items(Joi.string()).optional(),
    san_ip: Joi.array().items(Joi.string().ip()).optional(),
    key_size: Joi.number().valid(2048, 4096).default(2048),
    validity_days: Joi.number().integer().min(1).max(3650).default(365),
    notes: Joi.string().optional().max(1000)
  }),
  
  passphrase: Joi.object({
    passphrase: Joi.string().required().min(8)
  }),
  
  revokeCertificate: Joi.object({
    passphrase: Joi.string().required().min(8),
    reason: Joi.string().valid(
      'unspecified',
      'keyCompromise',
      'caCompromise',
      'affiliationChanged',
      'superseded',
      'cessationOfOperation'
    ).default('unspecified')
  }),
  
  caInitialize: Joi.object({
    ca_name: Joi.string().required().max(255),
    organization: Joi.string().required().max(255),
    country: Joi.string().length(2).uppercase().required(),
    state: Joi.string().optional().max(255),
    locality: Joi.string().optional().max(255),
    passphrase: Joi.string().required().min(12),
    key_size: Joi.number().valid(2048, 4096).default(4096),
    validity_years: Joi.number().integer().min(1).max(30).default(10)
  }),
  
  generateReport: Joi.object({
    report_type: Joi.string().valid('monthly', 'quarterly', 'annual', 'on_demand').required(),
    period_start: Joi.date().iso().optional(),
    period_end: Joi.date().iso().optional()
  })
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  schemas
};
