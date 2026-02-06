# SimpleCertManager

A simple Certificate Authority (CA) management application for small IT teams (10-50 SSL/TLS certificates).

## 🎯 Overview

SimpleCertManager provides a web-based interface to manage a local Certificate Authority, allowing you to:
- Initialize and configure a CA
- Create and manage certificate signing requests
- Issue, revoke, and renew certificates
- Generate Certificate Revocation Lists (CRL)
- Track all operations with comprehensive audit logs
- Generate compliance reports

## 🏗️ Architecture

- **Frontend**: React + Material-UI (MUI)
- **Backend**: Node.js + Express.js
- **Database**: PocketBase
- **Certificate Management**: node-forge (pure JavaScript)
- **Authentication**: PocketBase Auth
- **Deployment**: Docker + Docker Compose

## 🔒 Security Features

- **CA Passphrase**: NEVER stored - must be provided for each signing operation
- **Private Keys**: Encrypted and stored with restricted permissions
- **Audit Trail**: Complete logging of all operations
- **HTTPS**: Enforced in production
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Strict validation with Joi

## 📋 Prerequisites

- Docker and Docker Compose
- Git
- Node.js 18+ (for local development)

## 🚀 Quick Start

### Using Docker Compose (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/SimpleCertManager.git
   cd SimpleCertManager
   ```

2. **Configure environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - PocketBase Admin: http://localhost:8090/_/

### Local Development

#### Backend
```bash
cd backend
npm install
cp .env.example .env
npm start
```

#### Frontend
```bash
cd frontend
npm install
cp .env.example .env
npm start
```

#### PocketBase
```bash
cd pocketbase
# Download PocketBase from https://pocketbase.io/docs/
./pocketbase serve
```

## 📚 Documentation

- [Implementation Plan](plans/ca-management-app-plan.md) - Detailed application architecture and features
- [Docker & CI/CD Configuration](plans/docker-and-cicd-config.md) - Docker setup and GitHub Actions
- [Implementation Status](IMPLEMENTATION_STATUS.md) - Current progress and next steps
- [PocketBase Migrations](pocketbase/pb_migrations/README.md) - Database schema

## 🗂️ Project Structure

```
SimpleCertManager/
├── backend/                 # Node.js + Express API
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── services/       # Business logic
│   │   ├── routes/         # API routes
│   │   ├── utils/          # Utility functions
│   │   └── app.js          # Main application
│   ├── storage/            # Certificate storage
│   ├── Dockerfile
│   └── package.json
├── frontend/               # React + MUI application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── services/       # API clients
│   │   ├── context/        # React contexts
│   │   ├── theme/          # MUI theme
│   │   └── App.jsx         # Main app
│   ├── public/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── pocketbase/             # PocketBase database
│   ├── pb_migrations/      # Database migrations
│   └── Dockerfile
├── .github/
│   └── workflows/          # GitHub Actions
├── plans/                  # Documentation
├── docker-compose.yml      # Development setup
├── docker-compose.prod.yml # Production setup
└── README.md
```

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
PORT=3001
NODE_ENV=development
POCKETBASE_URL=http://localhost:8090
STORAGE_PATH=./storage
```

#### Frontend (.env)
```env
REACT_APP_API_URL=http://localhost:3001/api
REACT_APP_POCKETBASE_URL=http://localhost:8090
```

**⚠️ Important**: The CA passphrase is NEVER stored in environment variables for security reasons.

## 📦 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Certificate Requests
- `GET /api/requests` - List all requests
- `POST /api/requests` - Create new request
- `POST /api/requests/:id/approve` - Approve request
- `POST /api/requests/:id/reject` - Reject request

### Certificates
- `GET /api/certificates` - List all certificates
- `POST /api/certificates/issue/:requestId` - Issue certificate (requires passphrase)
- `POST /api/certificates/:id/revoke` - Revoke certificate (requires passphrase)
- `GET /api/certificates/:id/download` - Download certificate

### CA Configuration
- `GET /api/ca/config` - Get CA configuration
- `POST /api/ca/initialize` - Initialize CA (requires passphrase)
- `GET /api/ca/certificate` - Download CA certificate
- `GET /api/ca/crl` - Download CRL

### Reports & Audit
- `GET /api/reports` - List reports
- `POST /api/reports/generate` - Generate report
- `GET /api/audit/logs` - View audit logs

## 🧪 Testing

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 🚢 Deployment

### Production with Docker Compose

1. **Set environment variables**
   ```bash
   export GITHUB_REPOSITORY_OWNER=your-username
   export IMAGE_TAG=latest
   ```

2. **Deploy**
   ```bash
   docker-compose -f docker-compose.prod.yml up -d
   ```

### GitHub Container Registry

Images are automatically built and published to GitHub Container Registry via GitHub Actions:
- `ghcr.io/your-username/simplecert-backend:latest`
- `ghcr.io/your-username/simplecert-frontend:latest`
- `ghcr.io/your-username/simplecert-pocketbase:latest`

### CI/CD Pipelines

The project includes automated CI/CD workflows:
- **build-backend.yml** - Builds and pushes backend Docker image
- **build-frontend.yml** - Builds and pushes frontend Docker image
- **build-pocketbase.yml** - Builds and pushes PocketBase Docker image
- **ci.yml** - Runs tests and linting on push/PR

All workflows are triggered on push to `main` or `develop` branches, and on pull requests.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Quick Start for Contributors

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following our coding standards
4. Run tests and linting:
   ```bash
   # Backend
   cd backend
   npm test
   npm run lint
   
   # Frontend
   cd frontend
   npm test
   npm run lint
   ```
5. Commit your changes (`git commit -m 'feat: add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

### Commit Convention

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `refactor:` - Code refactoring
- `test:` - Test additions or changes
- `ci:` - CI/CD changes
- `perf:` - Performance improvements

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Security Notice

**Critical Security Requirements:**
1. The CA passphrase must NEVER be stored anywhere
2. Users must provide the passphrase for each signing operation
3. Private keys are encrypted and stored with restricted permissions
4. All operations are logged in the audit trail
5. Use HTTPS in production environments

## 🆘 Support

For issues, questions, or contributions, please open an issue on GitHub.

## 📊 Implementation Status

**Current Phase**: Phase 5 - Tests and Deployment
**Overall Progress**: ~95% (Phases 1-4 complete, Phase 5 in progress)

See [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md) for detailed progress tracking.

### Completed Features

✅ **Phase 1**: Base Configuration
- Docker setup (backend, frontend, PocketBase)
- Environment configuration
- Project structure

✅ **Phase 2**: Backend Core
- CA management with node-forge
- Certificate operations (issue, revoke, renew)
- CRL generation and management
- Audit logging
- Report generation
- Complete REST API

✅ **Phase 3**: Frontend Core
- React + Material-UI interface
- Certificate management UI
- Request management
- CA configuration
- Dashboard and reports

✅ **Phase 4**: Advanced Features
- CRL distribution
- Comprehensive reporting
- Audit log visualization

🚧 **Phase 5**: Tests and Deployment (In Progress)
- ✅ GitHub Actions CI/CD
- ✅ Docker configuration
- ✅ Documentation
- ⏳ Unit tests (optional)
- ⏳ Integration tests (optional)

---

**Built with ❤️ for secure certificate management**
