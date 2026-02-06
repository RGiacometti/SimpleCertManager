# Contributing to SimpleCertManager

Thank you for your interest in contributing to SimpleCertManager! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [How to Contribute](#how-to-contribute)
- [Coding Standards](#coding-standards)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Testing](#testing)
- [Security](#security)

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/your-username/SimpleCertManager.git
   cd SimpleCertManager
   ```
3. **Add upstream remote**:
   ```bash
   git remote add upstream https://github.com/original-owner/SimpleCertManager.git
   ```

## Development Setup

### Prerequisites

- Docker and Docker Compose
- Node.js 18+ (for local development)
- Git

### Local Development

1. **Copy environment files**:
   ```bash
   cp .env.example .env
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```

2. **Start the development environment**:
   ```bash
   docker-compose up --build
   ```

3. **Access the application**:
   - Frontend: http://localhost
   - Backend API: http://localhost:3001
   - PocketBase Admin: http://localhost:8090/_/

### Running Without Docker

#### Backend
```bash
cd backend
npm install
npm run dev
```

#### Frontend
```bash
cd frontend
npm install
npm start
```

#### PocketBase
Download PocketBase from https://pocketbase.io/docs/ and run:
```bash
cd pocketbase
./pocketbase serve
```

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/your-username/SimpleCertManager/issues)
2. If not, create a new issue with:
   - Clear title and description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details (OS, Docker version, etc.)
   - Screenshots if applicable

### Suggesting Features

1. Check existing [Issues](https://github.com/your-username/SimpleCertManager/issues) for similar suggestions
2. Create a new issue with:
   - Clear description of the feature
   - Use cases and benefits
   - Possible implementation approach

### Contributing Code

1. **Create a feature branch**:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards

3. **Test your changes**:
   ```bash
   # Backend tests
   cd backend
   npm test
   npm run lint

   # Frontend tests
   cd frontend
   npm test
   npm run lint
   ```

4. **Commit your changes** following commit guidelines

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## Coding Standards

### JavaScript/Node.js (Backend)

- Use ES6+ features
- Follow ESLint configuration
- Use meaningful variable and function names
- Add JSDoc comments for functions
- Keep functions small and focused
- Handle errors properly

Example:
```javascript
/**
 * Generate a new certificate
 * @param {Object} request - Certificate request data
 * @param {string} passphrase - CA passphrase
 * @returns {Promise<Object>} Generated certificate
 */
async function generateCertificate(request, passphrase) {
  // Implementation
}
```

### React/JavaScript (Frontend)

- Use functional components with hooks
- Follow ESLint configuration
- Use meaningful component and variable names
- Keep components small and reusable
- Use Material-UI components consistently
- Handle loading and error states

Example:
```jsx
/**
 * Certificate list component
 */
function CertificateList({ certificates, onSelect }) {
  // Implementation
}
```

### File Organization

- **Backend**: Group by feature (services, routes, utils)
- **Frontend**: Group by type (components, pages, services)
- Keep related files together
- Use index files for cleaner imports

## Commit Guidelines

Follow [Conventional Commits](https://www.conventionalcommits.org/):

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `perf`: Performance improvements
- `ci`: CI/CD changes

### Examples

```bash
feat(backend): add certificate renewal endpoint

Implement automatic certificate renewal with validation
of expiration dates and CA passphrase verification.

Closes #123
```

```bash
fix(frontend): correct date formatting in certificate list

The certificate expiration dates were showing in UTC
instead of local time. Updated to use date-fns format.
```

```bash
docs: update installation instructions

Add Docker Compose setup steps and troubleshooting section.
```

## Pull Request Process

1. **Update documentation** if needed
2. **Add tests** for new features
3. **Ensure all tests pass**:
   ```bash
   npm test
   npm run lint
   ```
4. **Update IMPLEMENTATION_STATUS.md** if applicable
5. **Create PR** with:
   - Clear title following commit convention
   - Description of changes
   - Related issue numbers
   - Screenshots for UI changes

### PR Review Process

- At least one maintainer approval required
- All CI checks must pass
- No merge conflicts
- Code follows project standards

## Testing

### Backend Tests

```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run lint            # Run linter
npm run lint:fix        # Fix linting issues
```

### Frontend Tests

```bash
cd frontend
npm test                    # Run tests in watch mode
npm run test:coverage       # Run with coverage
npm run lint                # Run linter
npm run lint:fix            # Fix linting issues
```

### Integration Tests

Test the full stack with Docker:
```bash
docker-compose up --build
# Run manual tests or automated E2E tests
```

## Security

### Security Best Practices

1. **Never commit sensitive data**:
   - No passwords, API keys, or secrets
   - No CA passphrases
   - Use `.env` files (already in `.gitignore`)

2. **CA Passphrase Handling**:
   - NEVER store the CA passphrase
   - Always require user input for signing operations
   - Clear passphrase from memory after use

3. **Input Validation**:
   - Validate all user inputs
   - Use Joi schemas for API validation
   - Sanitize data before storage

4. **Dependencies**:
   - Keep dependencies up to date
   - Review security advisories
   - Use `npm audit` regularly

### Reporting Security Issues

**DO NOT** create public issues for security vulnerabilities.

Instead, email security concerns to: [security@example.com]

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

## Project Structure

```
SimpleCertManager/
├── backend/              # Node.js + Express API
│   ├── src/
│   │   ├── config/      # Configuration
│   │   ├── middleware/  # Express middleware
│   │   ├── routes/      # API routes
│   │   ├── services/    # Business logic
│   │   └── utils/       # Utilities
│   └── storage/         # Certificate storage
├── frontend/            # React + MUI
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API clients
│   │   └── context/     # React contexts
│   └── public/
├── pocketbase/          # PocketBase database
├── .github/workflows/   # CI/CD pipelines
└── plans/               # Documentation
```

## Resources

- [Project Documentation](README.md)
- [Implementation Plan](plans/ca-management-app-plan.md)
- [Docker Configuration](plans/docker-and-cicd-config.md)
- [Implementation Status](IMPLEMENTATION_STATUS.md)
- [PocketBase Documentation](https://pocketbase.io/docs/)
- [node-forge Documentation](https://github.com/digitalbazaar/forge)

## Questions?

- Check existing [Issues](https://github.com/your-username/SimpleCertManager/issues)
- Create a new issue with the `question` label
- Join our community discussions

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to SimpleCertManager! 🎉
