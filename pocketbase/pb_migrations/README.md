# PocketBase Migrations

This directory contains PocketBase migration files for SimpleCertManager.

## Collections

The following collections will be created:

1. **certificate_requests** - Certificate signing requests
2. **certificates** - Issued certificates
3. **ca_config** - CA configuration
4. **audit_logs** - Audit trail
5. **compliance_reports** - Compliance reports

## Manual Setup

Since PocketBase migrations are typically generated through the admin UI, you'll need to:

1. Start PocketBase: `./pocketbase serve`
2. Access the admin UI: `http://localhost:8090/_/`
3. Create an admin account
4. Create the collections manually or import the schema

## Collections Schema

### certificate_requests
- common_name (text, required)
- organization (text)
- organizational_unit (text)
- country (text, 2 chars)
- state (text)
- locality (text)
- email (email)
- san_dns (json)
- san_ip (json)
- key_size (number, default: 2048)
- validity_days (number, default: 365)
- status (select: pending, approved, rejected, issued)
- requested_by (relation to users)
- requested_at (date)
- notes (text)

### certificates
- request_id (relation to certificate_requests)
- serial_number (text, unique)
- common_name (text)
- subject (json)
- issuer (json)
- not_before (date)
- not_after (date)
- fingerprint_sha256 (text)
- certificate_pem (text)
- certificate_path (text)
- private_key_path (text)
- status (select: active, expired, revoked)
- issued_at (date)
- issued_by (relation to users)
- revoked_at (date)
- revocation_reason (select)

### ca_config
- ca_name (text)
- ca_certificate_pem (text)
- ca_private_key_encrypted (text)
- ca_serial_number (number)
- ca_not_before (date)
- ca_not_after (date)
- default_validity_days (number, default: 365)
- default_key_size (number, default: 2048)
- crl_distribution_point (text)

### audit_logs
- action (select)
- entity_type (select)
- entity_id (text)
- user (relation to users)
- details (json)
- ip_address (text)
- timestamp (date)

### compliance_reports
- report_type (select: monthly, quarterly, annual, on_demand)
- period_start (date)
- period_end (date)
- total_certificates (number)
- active_certificates (number)
- expired_certificates (number)
- revoked_certificates (number)
- expiring_soon (number)
- report_data (json)
- generated_by (relation to users)
- generated_at (date)
