const Joi = require('joi');

/**
 * Custom validators for certificate management
 */

/**
 * Validate certificate request data
 */
const certificateRequestSchema = Joi.object({
  common_name: Joi.string()
    .min(1)
    .max(64)
    .required()
    .messages({
      'string.empty': 'Common name is required',
      'string.max': 'Common name must not exceed 64 characters'
    }),
  
  organization: Joi.string()
    .min(1)
    .max(64)
    .required()
    .messages({
      'string.empty': 'Organization is required',
      'string.max': 'Organization must not exceed 64 characters'
    }),
  
  organizational_unit: Joi.string()
    .max(64)
    .allow('', null)
    .optional(),
  
  country: Joi.string()
    .length(2)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Country code must be exactly 2 characters',
      'string.empty': 'Country is required'
    }),
  
  state: Joi.string()
    .max(128)
    .allow('', null)
    .optional(),
  
  locality: Joi.string()
    .max(128)
    .allow('', null)
    .optional(),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email address',
      'string.empty': 'Email is required'
    }),
  
  san_dns: Joi.array()
    .items(Joi.string().hostname())
    .default([])
    .messages({
      'array.base': 'SAN DNS must be an array of hostnames'
    }),
  
  san_ip: Joi.array()
    .items(Joi.string().ip({ version: ['ipv4', 'ipv6'] }))
    .default([])
    .messages({
      'array.base': 'SAN IP must be an array of IP addresses'
    }),
  
  key_size: Joi.number()
    .valid(2048, 4096)
    .default(2048)
    .messages({
      'any.only': 'Key size must be 2048 or 4096'
    }),
  
  validity_days: Joi.number()
    .integer()
    .min(1)
    .max(825) // Maximum 825 days per CA/Browser Forum baseline requirements
    .default(365)
    .messages({
      'number.min': 'Validity days must be at least 1',
      'number.max': 'Validity days must not exceed 825 days'
    }),
  
  notes: Joi.string()
    .max(1000)
    .allow('', null)
    .optional(),
  
  issuing_ca_id: Joi.string()
    .allow('', null)
    .optional()
});

/**
 * Validate CA initialization data
 */
const caInitializationSchema = Joi.object({
  ca_name: Joi.string()
    .min(1)
    .max(64)
    .required()
    .messages({
      'string.empty': 'CA name is required',
      'string.max': 'CA name must not exceed 64 characters'
    }),
  
  organization: Joi.string()
    .min(1)
    .max(64)
    .required()
    .messages({
      'string.empty': 'Organization is required'
    }),
  
  organizational_unit: Joi.string()
    .max(64)
    .allow('', null)
    .optional(),
  
  country: Joi.string()
    .length(2)
    .uppercase()
    .required()
    .messages({
      'string.length': 'Country code must be exactly 2 characters'
    }),
  
  state: Joi.string()
    .max(128)
    .allow('', null)
    .optional(),
  
  locality: Joi.string()
    .max(128)
    .allow('', null)
    .optional(),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email address'
    }),
  
  passphrase: Joi.string()
    .min(12)
    .required()
    .messages({
      'string.min': 'Passphrase must be at least 12 characters',
      'string.empty': 'Passphrase is required'
    }),
  
  key_size: Joi.number()
    .valid(2048, 4096)
    .default(4096)
    .messages({
      'any.only': 'Key size must be 2048 or 4096'
    }),
  
  validity_years: Joi.number()
    .integer()
    .min(1)
    .max(20)
    .default(10)
    .messages({
      'number.min': 'Validity years must be at least 1',
      'number.max': 'Validity years must not exceed 20'
    }),
  
  default_validity_days: Joi.number()
    .integer()
    .min(1)
    .max(825)
    .default(365),
  
  default_key_size: Joi.number()
    .valid(2048, 4096)
    .default(2048),
  
  crl_distribution_point: Joi.string()
    .uri()
    .allow('', null)
    .optional()
});

/**
 * Validate passphrase
 */
const passphraseSchema = Joi.object({
  passphrase: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Passphrase is required'
    })
});

/**
 * Validate certificate revocation data
 */
const revocationSchema = Joi.object({
  passphrase: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Passphrase is required'
    }),
  
  reason: Joi.string()
    .valid(
      'unspecified',
      'keyCompromise',
      'caCompromise',
      'affiliationChanged',
      'superseded',
      'cessationOfOperation'
    )
    .default('unspecified')
    .messages({
      'any.only': 'Invalid revocation reason'
    }),
  
  notes: Joi.string()
    .max(1000)
    .allow('', null)
    .optional()
});

/**
 * Validate report generation parameters
 */
const reportGenerationSchema = Joi.object({
  report_type: Joi.string()
    .valid('monthly', 'quarterly', 'annual', 'on_demand')
    .required()
    .messages({
      'any.only': 'Invalid report type'
    }),
  
  period_start: Joi.date()
    .iso()
    .required()
    .messages({
      'date.base': 'Invalid start date'
    }),
  
  period_end: Joi.date()
    .iso()
    .min(Joi.ref('period_start'))
    .required()
    .messages({
      'date.base': 'Invalid end date',
      'date.min': 'End date must be after start date'
    })
});

/**
 * Validate CA configuration update
 */
const caConfigUpdateSchema = Joi.object({
  default_validity_days: Joi.number()
    .integer()
    .min(1)
    .max(825)
    .optional(),
  
  default_key_size: Joi.number()
    .valid(2048, 4096)
    .optional(),
  
  crl_distribution_point: Joi.string()
    .uri()
    .allow('', null)
    .optional()
}).min(1); // At least one field must be provided

/**
 * Validate audit log filters
 */
const auditFilterSchema = Joi.object({
  action: Joi.string()
    .valid(
      'create_request',
      'approve_request',
      'reject_request',
      'issue_certificate',
      'revoke_certificate',
      'renew_certificate',
      'download_certificate',
      'view_certificate',
      'initialize_ca',
      'update_ca_config',
      'create_intermediate_ca',
      'revoke_intermediate_ca',
      'update_intermediate_ca'
    )
    .optional(),
  
  entity_type: Joi.string()
    .valid('certificate_request', 'certificate', 'ca_config', 'intermediate_ca')
    .optional(),
  
  user_id: Joi.string()
    .optional(),
  
  start_date: Joi.date()
    .iso()
    .optional(),
  
  end_date: Joi.date()
    .iso()
    .min(Joi.ref('start_date'))
    .optional(),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
});

/**
 * Validate pagination parameters
 */
const paginationSchema = Joi.object({
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50),
  
  sort: Joi.string()
    .valid('created', '-created', 'updated', '-updated', 'common_name', '-common_name')
    .default('-created')
});

/**
 * Validate certificate filters
 */
const certificateFilterSchema = Joi.object({
  status: Joi.string()
    .valid('active', 'expired', 'revoked')
    .optional(),
  
  common_name: Joi.string()
    .optional(),
  
  expiring_days: Joi.number()
    .integer()
    .min(1)
    .max(365)
    .optional(),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
});

/**
 * Validate request filters
 */
const requestFilterSchema = Joi.object({
  status: Joi.string()
    .valid('pending', 'approved', 'rejected', 'issued')
    .optional(),
  
  common_name: Joi.string()
    .optional(),
  
  requested_by: Joi.string()
    .optional(),
  
  page: Joi.number()
    .integer()
    .min(1)
    .default(1),
  
  limit: Joi.number()
    .integer()
    .min(1)
    .max(100)
    .default(50)
});

/**
 * Helper function to validate data against a schema
 * @param {Object} schema - Joi schema
 * @param {Object} data - Data to validate
 * @returns {Object} Validated data
 * @throws {Error} Validation error
 */
function validate(schema, data) {
  const { error, value } = schema.validate(data, {
    abortEarly: false,
    stripUnknown: true
  });
  
  if (error) {
    const messages = error.details.map(detail => detail.message).join(', ');
    throw new Error(`Validation error: ${messages}`);
  }
  
  return value;
}

/**
 * Validate hostname
 * @param {string} hostname - Hostname to validate
 * @returns {boolean} True if valid
 */
function isValidHostname(hostname) {
  const hostnameRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)*[a-zA-Z0-9][a-zA-Z0-9-_]+\.[a-zA-Z]{2,11}?$/;
  return hostnameRegex.test(hostname) || hostname === 'localhost';
}

/**
 * Validate IP address
 * @param {string} ip - IP address to validate
 * @returns {boolean} True if valid
 */
function isValidIP(ip) {
  const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  const ipv6Regex = /^(?:[A-F0-9]{1,4}:){7}[A-F0-9]{1,4}$/i;
  return ipv4Regex.test(ip) || ipv6Regex.test(ip);
}

/**
 * Sanitize filename to prevent path traversal
 * @param {string} filename - Filename to sanitize
 * @returns {string} Sanitized filename
 */
function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Validate Intermediate CA creation data
 */
const intermediateCACreationSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'ICA name is required',
      'string.max': 'ICA name must not exceed 255 characters'
    }),
  
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .optional(),
  
  common_name: Joi.string()
    .min(1)
    .max(255)
    .required()
    .messages({
      'string.empty': 'Common name is required',
      'string.max': 'Common name must not exceed 255 characters'
    }),
  
  organization: Joi.string()
    .max(255)
    .allow('', null)
    .optional(),
  
  organizational_unit: Joi.string()
    .max(255)
    .allow('', null)
    .optional(),
  
  country: Joi.string()
    .length(2)
    .uppercase()
    .allow('', null)
    .optional()
    .messages({
      'string.length': 'Country code must be exactly 2 characters'
    }),
  
  state: Joi.string()
    .max(255)
    .allow('', null)
    .optional(),
  
  locality: Joi.string()
    .max(255)
    .allow('', null)
    .optional(),
  
  email: Joi.string()
    .email()
    .allow('', null)
    .optional(),
  
  key_size: Joi.number()
    .valid(2048, 4096)
    .default(4096)
    .messages({
      'any.only': 'Key size must be 2048 or 4096'
    }),
  
  validity_years: Joi.number()
    .integer()
    .min(1)
    .max(10)
    .default(5)
    .messages({
      'number.min': 'Validity years must be at least 1',
      'number.max': 'Validity years must not exceed 10'
    }),
  
  max_validity_days: Joi.number()
    .integer()
    .min(1)
    .max(825)
    .default(397)
    .messages({
      'number.min': 'Max validity days must be at least 1',
      'number.max': 'Max validity days must not exceed 825'
    }),
  
  default_validity_days: Joi.number()
    .integer()
    .min(1)
    .max(825)
    .default(365)
    .messages({
      'number.min': 'Default validity days must be at least 1',
      'number.max': 'Default validity days must not exceed 825'
    }),
  
  default_key_size: Joi.number()
    .valid(2048, 4096)
    .default(2048),
  
  crl_distribution_point: Joi.string()
    .uri()
    .allow('', null)
    .optional(),
  
  root_passphrase: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Root CA passphrase is required'
    }),
  
  ica_passphrase: Joi.string()
    .min(12)
    .required()
    .messages({
      'string.min': 'ICA passphrase must be at least 12 characters',
      'string.empty': 'ICA passphrase is required'
    }),
  
  ica_passphrase_confirm: Joi.string()
    .valid(Joi.ref('ica_passphrase'))
    .required()
    .messages({
      'any.only': 'ICA passphrase confirmation must match',
      'string.empty': 'ICA passphrase confirmation is required'
    })
});

/**
 * Validate Intermediate CA update data
 */
const intermediateCAUpdateSchema = Joi.object({
  name: Joi.string()
    .min(1)
    .max(255)
    .optional(),
  
  description: Joi.string()
    .max(1000)
    .allow('', null)
    .optional(),
  
  default_validity_days: Joi.number()
    .integer()
    .min(1)
    .max(825)
    .optional(),
  
  default_key_size: Joi.number()
    .valid(2048, 4096)
    .optional(),
  
  crl_distribution_point: Joi.string()
    .uri()
    .allow('', null)
    .optional()
}).min(1); // At least one field must be provided

/**
 * Validate Intermediate CA revocation data
 */
const intermediateCARevocationSchema = Joi.object({
  root_passphrase: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Root CA passphrase is required'
    }),
  
  reason: Joi.string()
    .valid(
      'unspecified',
      'keyCompromise',
      'caCompromise',
      'affiliationChanged',
      'superseded',
      'cessationOfOperation'
    )
    .default('unspecified')
    .messages({
      'any.only': 'Invalid revocation reason'
    })
});

/**
 * Validate passphrase with optional issuing CA ID
 */
const issuancePassphraseSchema = Joi.object({
  passphrase: Joi.string()
    .min(1)
    .required()
    .messages({
      'string.empty': 'Passphrase is required'
    }),
  
  issuing_ca_id: Joi.string()
    .allow('', null)
    .optional()
});

module.exports = {
  // Schemas
  certificateRequestSchema,
  caInitializationSchema,
  passphraseSchema,
  revocationSchema,
  reportGenerationSchema,
  caConfigUpdateSchema,
  auditFilterSchema,
  paginationSchema,
  certificateFilterSchema,
  requestFilterSchema,
  intermediateCACreationSchema,
  intermediateCAUpdateSchema,
  intermediateCARevocationSchema,
  issuancePassphraseSchema,
  
  // Validation functions
  validate,
  isValidHostname,
  isValidIP,
  sanitizeFilename
};
