const path = require('path');

// Storage paths
const STORAGE_PATH = process.env.STORAGE_PATH || './storage';

module.exports = {
  // Server
  PORT: process.env.PORT || 3001,
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // PocketBase
  POCKETBASE_URL: process.env.POCKETBASE_URL || 'http://localhost:8090',
  
  // Storage paths
  STORAGE_PATH,
  CA_PATH: path.join(STORAGE_PATH, 'ca'),
  CERTIFICATES_PATH: path.join(STORAGE_PATH, 'certificates'),
  PRIVATE_KEYS_PATH: path.join(STORAGE_PATH, 'private_keys'),
  CRL_PATH: path.join(STORAGE_PATH, 'crl'),
  
  // Certificate defaults
  DEFAULT_KEY_SIZE: 2048,
  DEFAULT_VALIDITY_DAYS: 365,
  CA_VALIDITY_YEARS: 10,
  
  // Certificate status
  CERT_STATUS: {
    ACTIVE: 'active',
    EXPIRED: 'expired',
    REVOKED: 'revoked'
  },
  
  // Request status
  REQUEST_STATUS: {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected',
    ISSUED: 'issued'
  },
  
  // Revocation reasons
  REVOCATION_REASONS: {
    UNSPECIFIED: 'unspecified',
    KEY_COMPROMISE: 'keyCompromise',
    CA_COMPROMISE: 'caCompromise',
    AFFILIATION_CHANGED: 'affiliationChanged',
    SUPERSEDED: 'superseded',
    CESSATION_OF_OPERATION: 'cessationOfOperation'
  },
  
  // Audit actions
  AUDIT_ACTIONS: {
    CREATE_REQUEST: 'create_request',
    APPROVE_REQUEST: 'approve_request',
    REJECT_REQUEST: 'reject_request',
    ISSUE_CERTIFICATE: 'issue_certificate',
    REVOKE_CERTIFICATE: 'revoke_certificate',
    RENEW_CERTIFICATE: 'renew_certificate',
    DOWNLOAD_CERTIFICATE: 'download_certificate',
    VIEW_CERTIFICATE: 'view_certificate',
    INITIALIZE_CA: 'initialize_ca',
    UPDATE_CA_CONFIG: 'update_ca_config'
  },
  
  // Entity types
  ENTITY_TYPES: {
    CERTIFICATE_REQUEST: 'certificate_request',
    CERTIFICATE: 'certificate',
    CA_CONFIG: 'ca_config'
  },
  
  // Report types
  REPORT_TYPES: {
    MONTHLY: 'monthly',
    QUARTERLY: 'quarterly',
    ANNUAL: 'annual',
    ON_DEMAND: 'on_demand'
  },
  
  // Security
  MAX_PASSPHRASE_ATTEMPTS: 3,
  RATE_LIMIT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  RATE_LIMIT_MAX_REQUESTS: 1000 // Increased for development
};
