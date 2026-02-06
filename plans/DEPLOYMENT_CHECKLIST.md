# SimpleCertManager - Deployment Checklist

This checklist ensures a smooth deployment of SimpleCertManager to production.

## Pre-Deployment Checklist

### 1. Environment Configuration ✅

- [ ] Copy `.env.example` to `.env` and configure all variables
- [ ] Set `GITHUB_REPOSITORY_OWNER` to your GitHub username
- [ ] Set `IMAGE_TAG` (default: `latest`)
- [ ] Configure `REACT_APP_API_URL` for production domain
- [ ] Configure `REACT_APP_POCKETBASE_URL` for production domain
- [ ] Verify `NODE_ENV=production` for backend
- [ ] Review SSL/TLS certificate paths if using HTTPS

### 2. GitHub Container Registry Setup ✅

- [ ] Enable GitHub Actions in repository settings
- [ ] Verify GitHub Actions have package write permissions
- [ ] (Optional) Configure GitHub secrets:
  - `REACT_APP_API_URL` - Production API URL
  - `REACT_APP_POCKETBASE_URL` - Production PocketBase URL
- [ ] Push code to trigger initial image builds
- [ ] Verify images are published to ghcr.io

### 3. Server Requirements ✅

- [ ] Docker Engine 20.10+ installed
- [ ] Docker Compose 2.0+ installed
- [ ] Minimum 2GB RAM available
- [ ] Minimum 10GB disk space available
- [ ] Ports available: 80, 443, 3001, 8090
- [ ] (Optional) SSL/TLS certificates prepared

### 4. Security Review ✅

- [ ] Verify CA passphrase is NEVER stored in environment variables
- [ ] Confirm private keys will be stored with restricted permissions
- [ ] Review firewall rules (allow only necessary ports)
- [ ] Plan for CA passphrase secure storage (password manager, HSM, etc.)
- [ ] Review audit log retention policy
- [ ] Confirm HTTPS is enabled for production
- [ ] Verify rate limiting is configured

## Deployment Steps

### Option A: Docker Compose (Recommended)

#### Step 1: Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker (if not installed)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose (if not installed)
sudo apt install docker-compose-plugin -y

# Verify installation
docker --version
docker compose version
```

#### Step 2: Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-username/SimpleCertManager.git
cd SimpleCertManager

# Or pull latest changes
git pull origin main
```

#### Step 3: Configure Environment

```bash
# Copy environment file
cp .env.example .env

# Edit with your settings
nano .env

# Set required variables:
# - GITHUB_REPOSITORY_OWNER=your-username
# - IMAGE_TAG=latest
# - REACT_APP_API_URL=https://your-domain.com/api
# - REACT_APP_POCKETBASE_URL=https://your-domain.com/pb
```

#### Step 4: Deploy

```bash
# Pull latest images from GitHub Container Registry
docker compose -f docker-compose.prod.yml pull

# Start services
docker compose -f docker-compose.prod.yml up -d

# Verify services are running
docker compose -f docker-compose.prod.yml ps

# Check logs
docker compose -f docker-compose.prod.yml logs -f
```

#### Step 5: Initial Configuration

```bash
# Access PocketBase Admin UI
# Navigate to: http://your-domain:8090/_/

# 1. Create admin account
# 2. Set up collections (see pocketbase/pb_migrations/README.md)
# 3. Create initial users

# Access SimpleCertManager UI
# Navigate to: http://your-domain

# 1. Log in with PocketBase credentials
# 2. Navigate to Settings > CA Configuration
# 3. Initialize CA with strong passphrase
# 4. IMPORTANT: Store passphrase securely!
```

### Option B: Manual Docker Deployment

```bash
# Pull images
docker pull ghcr.io/your-username/simplecert-pocketbase:latest
docker pull ghcr.io/your-username/simplecert-backend:latest
docker pull ghcr.io/your-username/simplecert-frontend:latest

# Create network
docker network create simplecert-network

# Create volumes
docker volume create pocketbase_data
docker volume create backend_storage

# Run PocketBase
docker run -d \
  --name simplecert-pocketbase \
  --network simplecert-network \
  -p 8090:8090 \
  -v pocketbase_data:/pb_data \
  --restart always \
  ghcr.io/your-username/simplecert-pocketbase:latest

# Run Backend
docker run -d \
  --name simplecert-backend \
  --network simplecert-network \
  -p 3001:3001 \
  -e NODE_ENV=production \
  -e POCKETBASE_URL=http://simplecert-pocketbase:8090 \
  -v backend_storage:/app/storage \
  --restart always \
  ghcr.io/your-username/simplecert-backend:latest

# Run Frontend
docker run -d \
  --name simplecert-frontend \
  --network simplecert-network \
  -p 80:80 \
  --restart always \
  ghcr.io/your-username/simplecert-frontend:latest
```

## Post-Deployment Verification

### 1. Health Checks ✅

```bash
# Check container status
docker compose -f docker-compose.prod.yml ps

# Check health of each service
docker inspect --format='{{.State.Health.Status}}' simplecert-pocketbase
docker inspect --format='{{.State.Health.Status}}' simplecert-backend
docker inspect --format='{{.State.Health.Status}}' simplecert-frontend

# Test backend health endpoint
curl http://localhost:3001/health

# Test frontend
curl http://localhost/
```

### 2. Functional Tests ✅

- [ ] Access frontend UI successfully
- [ ] Log in with PocketBase credentials
- [ ] Navigate to all pages (Dashboard, Certificates, Requests, Reports, Audit, Settings)
- [ ] Initialize CA (if not already done)
- [ ] Create a test certificate request
- [ ] Approve and issue a test certificate
- [ ] Download certificate files
- [ ] View audit logs
- [ ] Generate a test report
- [ ] Revoke test certificate
- [ ] Download CRL

### 3. Security Verification ✅

- [ ] Verify HTTPS is working (if configured)
- [ ] Test that CA passphrase is required for signing operations
- [ ] Confirm private keys are not accessible via API
- [ ] Verify audit logs are recording all operations
- [ ] Test rate limiting on API endpoints
- [ ] Confirm authentication is required for protected endpoints
- [ ] Verify CRL is publicly accessible at `/api/ca/crl`

### 4. Performance Check ✅

```bash
# Check resource usage
docker stats

# Check disk usage
docker system df

# Check logs for errors
docker compose -f docker-compose.prod.yml logs --tail=100
```

## Backup and Maintenance

### Backup Procedures

#### Backup PocketBase Data
```bash
# Create backup
docker run --rm \
  -v simplecertmanager_pocketbase_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/pocketbase-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# Restore backup
docker run --rm \
  -v simplecertmanager_pocketbase_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/pocketbase-backup-YYYYMMDD-HHMMSS.tar.gz -C /data
```

#### Backup Backend Storage (Certificates)
```bash
# Create backup
docker run --rm \
  -v simplecertmanager_backend_storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backend-storage-backup-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# Restore backup
docker run --rm \
  -v simplecertmanager_backend_storage:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/backend-storage-backup-YYYYMMDD-HHMMSS.tar.gz -C /data
```

### Update Procedures

```bash
# Pull latest images
docker compose -f docker-compose.prod.yml pull

# Recreate containers with new images
docker compose -f docker-compose.prod.yml up -d

# Remove old images
docker image prune -a
```

### Monitoring

```bash
# View logs
docker compose -f docker-compose.prod.yml logs -f

# View logs for specific service
docker compose -f docker-compose.prod.yml logs -f backend

# Check resource usage
docker stats

# Check disk usage
df -h
docker system df
```

## Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check logs
docker compose -f docker-compose.prod.yml logs

# Check container status
docker compose -f docker-compose.prod.yml ps

# Restart services
docker compose -f docker-compose.prod.yml restart
```

#### Cannot Connect to Backend
```bash
# Verify backend is running
docker compose -f docker-compose.prod.yml ps backend

# Check backend logs
docker compose -f docker-compose.prod.yml logs backend

# Test backend health
curl http://localhost:3001/health

# Verify network connectivity
docker network inspect simplecert-network
```

#### PocketBase Issues
```bash
# Check PocketBase logs
docker compose -f docker-compose.prod.yml logs pocketbase

# Access PocketBase admin
# Navigate to: http://your-domain:8090/_/

# Verify collections are created
# Check user authentication
```

#### Certificate Operations Failing
```bash
# Check backend logs for errors
docker compose -f docker-compose.prod.yml logs backend | grep ERROR

# Verify storage permissions
docker compose -f docker-compose.prod.yml exec backend ls -la /app/storage

# Check CA initialization status
curl http://localhost:3001/api/ca/status
```

## Rollback Procedures

### Rollback to Previous Version

```bash
# Stop current deployment
docker compose -f docker-compose.prod.yml down

# Pull specific version
export IMAGE_TAG=previous-version
docker compose -f docker-compose.prod.yml pull

# Start with previous version
docker compose -f docker-compose.prod.yml up -d

# Verify rollback
docker compose -f docker-compose.prod.yml ps
```

### Emergency Shutdown

```bash
# Stop all services
docker compose -f docker-compose.prod.yml down

# Stop and remove everything (including volumes - CAUTION!)
docker compose -f docker-compose.prod.yml down -v
```

## Production Best Practices

### Security
- [ ] Use HTTPS in production
- [ ] Store CA passphrase in secure password manager or HSM
- [ ] Regularly update Docker images
- [ ] Monitor security advisories
- [ ] Implement firewall rules
- [ ] Use strong passwords for PocketBase admin
- [ ] Regular security audits

### Monitoring
- [ ] Set up log aggregation (ELK, Loki)
- [ ] Configure metrics collection (Prometheus)
- [ ] Set up alerting (Alertmanager)
- [ ] Monitor disk space
- [ ] Monitor certificate expiration
- [ ] Track API performance

### Backup
- [ ] Automated daily backups
- [ ] Off-site backup storage
- [ ] Regular backup testing
- [ ] Document restore procedures
- [ ] Backup retention policy (30 days recommended)

### Maintenance
- [ ] Regular updates (monthly)
- [ ] Log rotation
- [ ] Disk cleanup
- [ ] Performance monitoring
- [ ] Security patches

## Support

- **Documentation**: [`README.md`](README.md)
- **Contributing**: [`CONTRIBUTING.md`](CONTRIBUTING.md)
- **Issues**: [GitHub Issues](https://github.com/your-username/SimpleCertManager/issues)
- **License**: [`LICENSE`](LICENSE)

---

**Deployment Date**: _________________  
**Deployed By**: _________________  
**Version**: _________________  
**Notes**: _________________
