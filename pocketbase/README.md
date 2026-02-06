# PocketBase Configuration for SimpleCertManager

This directory contains the PocketBase configuration and database schema for SimpleCertManager.

## Quick Start - Import Schema

The easiest way to set up the database is to import the pre-configured schema:

### Method 1: Using PocketBase Admin UI (Recommended)

1. **Start PocketBase**:
   ```bash
   cd pocketbase
   ./pocketbase serve
   ```

2. **Access Admin UI**:
   - Open http://localhost:8090/_/
   - Create an admin account on first access

3. **Import Schema**:
   - Go to **Settings** > **Import collections**
   - Click **Load from JSON file**
   - Select `pb_schema.json` from this directory
   - Click **Review** to preview changes
   - Click **Confirm** to import

### Method 2: Using PocketBase CLI

```bash
cd pocketbase
./pocketbase import pb_schema.json
```

## Database Schema

The schema includes 5 collections:

### 1. **certificate_requests** - Certificate Signing Requests
Stores user requests for new certificates.

**Key Fields:**
- Common Name, Organization, Country, etc.
- Subject Alternative Names (DNS & IP)
- Key size (2048/4096) and validity days (max 825)
- Status: pending → approved/rejected → issued

### 2. **certificates** - Issued Certificates
Stores all issued certificates with their metadata.

**Key Fields:**
- Serial number (unique)
- Certificate PEM and file paths
- Validity dates (not_before, not_after)
- SHA-256 fingerprint
- Status: active, expired, revoked
- Revocation information

### 3. **ca_config** - CA Configuration
Stores the Certificate Authority configuration (single record).

**Key Fields:**
- CA name and certificate
- Encrypted private key (stored on disk)
- Serial number counter
- Default settings (validity, key size)
- CRL distribution point

**⚠️ CRITICAL:** The CA passphrase is NEVER stored. It must be provided by the user for each signing operation.

### 4. **audit_logs** - Audit Trail
Immutable log of all operations for compliance.

**Key Fields:**
- Action type (create, approve, issue, revoke, etc.)
- Entity type and ID
- User, IP address, timestamp
- Additional details (JSON)

### 5. **compliance_reports** - Compliance Reports
Generated reports for compliance tracking.

**Key Fields:**
- Report type (monthly, quarterly, annual, on_demand)
- Period dates
- Statistics (total, active, expired, revoked, expiring soon)
- Detailed report data (JSON)

## Access Rules

All collections require authentication:
- **List/View**: `@request.auth.id != ''`
- **Create**: `@request.auth.id != ''`
- **Update**: Varies by collection (see schema)
- **Delete**: Restricted for most collections

**Special Rules:**
- `audit_logs`: Immutable (no update/delete)
- `certificates`: Cannot be deleted (only revoked)
- `ca_config`: Cannot be deleted
- `certificate_requests`: Can only be modified/deleted when status is 'pending'

## Indexes

All collections have optimized indexes for common queries:
- Status fields
- Date fields (for expiration checks)
- User relations
- Serial numbers and fingerprints

## Security Features

✅ **Authentication Required**: All operations require a valid user session
✅ **Immutable Audit Logs**: Complete traceability
✅ **No Passphrase Storage**: CA passphrase never persisted
✅ **Restricted Deletions**: Prevents accidental data loss
✅ **Encrypted Private Keys**: CA private key stored encrypted

## Backup & Restore

### Backup

```bash
# Backup entire database
tar -czf pocketbase-backup-$(date +%Y%m%d).tar.gz pb_data/

# Or use PocketBase export
./pocketbase export backup.zip
```

### Restore

```bash
# Restore from tar
tar -xzf pocketbase-backup-YYYYMMDD.tar.gz

# Or use PocketBase import
./pocketbase import backup.zip
```

## Manual Collection Creation

If you prefer to create collections manually instead of importing:

1. Access PocketBase Admin UI
2. Go to **Collections** > **New collection**
3. Create each collection with fields as defined in `pb_schema.json`
4. Configure indexes and access rules
5. Test with sample data

## Environment Variables

Configure PocketBase in your `.env` file:

```env
POCKETBASE_URL=http://localhost:8090
```

For production, use HTTPS:

```env
POCKETBASE_URL=https://your-domain.com/pb
```

## First Time Setup

After importing the schema:

1. **Create Admin User**: First access to http://localhost:8090/_/ will prompt for admin creation
2. **Create Application Users**: Go to **Users** collection and create users for the application
3. **Initialize CA**: Use the SimpleCertManager frontend to initialize the Certificate Authority
4. **Test**: Create a test certificate request to verify everything works

## Troubleshooting

### Schema Import Fails

- Ensure PocketBase is running
- Check that `pb_schema.json` is valid JSON
- Try importing via CLI instead of UI

### Collections Not Visible

- Refresh the Admin UI
- Check PocketBase logs for errors
- Verify file permissions on `pb_data/` directory

### Authentication Issues

- Ensure users are created in the `_pb_users_auth_` collection
- Check that access rules are properly configured
- Verify JWT tokens are being sent correctly

## Additional Resources

- [PocketBase Documentation](https://pocketbase.io/docs/)
- [SimpleCertManager Documentation](../README.md)
- [API Documentation](../plans/ca-management-app-plan.md)

## Support

For issues related to:
- **PocketBase**: Check [PocketBase GitHub](https://github.com/pocketbase/pocketbase)
- **SimpleCertManager**: Open an issue in the project repository
