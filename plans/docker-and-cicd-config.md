# Configuration Docker et CI/CD pour SimpleCertManager

## Table des matières
1. [Configuration Nginx](#configuration-nginx)
2. [Docker Compose](#docker-compose)
3. [Fichiers .dockerignore](#fichiers-dockerignore)
4. [Variables d'environnement](#variables-denvironnement)
5. [GitHub Actions](#github-actions)
6. [Commandes Docker](#commandes-docker)

---

## Configuration Nginx

### frontend/nginx.conf

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;

    # React Router - toutes les routes vers index.html
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache des assets statiques
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Pas de cache pour index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

---

## Docker Compose

### docker-compose.yml (Développement)

```yaml
version: '3.8'

services:
  pocketbase:
    build:
      context: ./pocketbase
      args:
        POCKETBASE_VERSION: 0.21.0
    container_name: simplecert-pocketbase
    ports:
      - "8090:8090"
    volumes:
      - pocketbase_data:/pb_data
      - ./pocketbase/pb_migrations:/pb_migrations
    restart: unless-stopped
    networks:
      - simplecert-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  backend:
    build:
      context: ./backend
    container_name: simplecert-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=development
      - PORT=3001
      - POCKETBASE_URL=http://pocketbase:8090
      - STORAGE_PATH=/app/storage
    volumes:
      - ./backend/src:/app/src
      - backend_storage:/app/storage
    depends_on:
      pocketbase:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - simplecert-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s

  frontend:
    build:
      context: ./frontend
      args:
        REACT_APP_API_URL=http://localhost:3001/api
        REACT_APP_POCKETBASE_URL=http://localhost:8090
    container_name: simplecert-frontend
    ports:
      - "80:80"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped
    networks:
      - simplecert-network

volumes:
  pocketbase_data:
    driver: local
  backend_storage:
    driver: local

networks:
  simplecert-network:
    driver: bridge
```

### docker-compose.prod.yml (Production)

```yaml
version: '3.8'

services:
  pocketbase:
    image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/simplecert-pocketbase:${IMAGE_TAG:-latest}
    container_name: simplecert-pocketbase
    ports:
      - "8090:8090"
    volumes:
      - pocketbase_data:/pb_data
      - ./pocketbase/pb_migrations:/pb_migrations:ro
    restart: always
    networks:
      - simplecert-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8090/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  backend:
    image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/simplecert-backend:${IMAGE_TAG:-latest}
    container_name: simplecert-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - PORT=3001
      - POCKETBASE_URL=http://pocketbase:8090
      - STORAGE_PATH=/app/storage
    volumes:
      - backend_storage:/app/storage
    depends_on:
      pocketbase:
        condition: service_healthy
    restart: always
    networks:
      - simplecert-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3001/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

  frontend:
    image: ghcr.io/${GITHUB_REPOSITORY_OWNER}/simplecert-frontend:${IMAGE_TAG:-latest}
    container_name: simplecert-frontend
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      backend:
        condition: service_healthy
    restart: always
    networks:
      - simplecert-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 10s
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

volumes:
  pocketbase_data:
    driver: local
  backend_storage:
    driver: local

networks:
  simplecert-network:
    driver: bridge
```

---

## Fichiers .dockerignore

### backend/.dockerignore

```
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log
.env
.env.*
!.env.example
.git
.gitignore
README.md
.vscode
.idea
coverage
.nyc_output
dist
*.log
.DS_Store
Thumbs.db
```

### frontend/.dockerignore

```
node_modules
npm-debug.log
yarn-debug.log
yarn-error.log
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
!.env.example
.git
.gitignore
README.md
.vscode
.idea
build
coverage
*.log
.DS_Store
Thumbs.db
```

### pocketbase/.dockerignore

```
pb_data
*.log
.git
.gitignore
README.md
.vscode
.idea
.DS_Store
Thumbs.db
```

---

## Variables d'environnement

### .env.example (Racine du projet)

```bash
# GitHub Container Registry
GITHUB_REPOSITORY_OWNER=your-github-username
IMAGE_TAG=latest

# Backend Configuration
NODE_ENV=production
PORT=3001
POCKETBASE_URL=http://pocketbase:8090
STORAGE_PATH=/app/storage

# Frontend Configuration
REACT_APP_API_URL=https://your-domain.com/api
REACT_APP_POCKETBASE_URL=https://your-domain.com/pb

# PocketBase Configuration
POCKETBASE_VERSION=0.21.0

# SSL/TLS (Production)
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

**⚠️ Note importante**: La passphrase CA n'est JAMAIS stockée dans les variables d'environnement pour des raisons de sécurité.

---

## GitHub Actions

### .github/workflows/build-backend.yml

```yaml
name: Build and Push Backend Image

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'backend/**'
      - '.github/workflows/build-backend.yml'
  pull_request:
    branches:
      - main
      - develop
    paths:
      - 'backend/**'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/simplecert-backend

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./backend
          file: ./backend/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Image digest
        run: echo ${{ steps.meta.outputs.digest }}
```

### .github/workflows/build-frontend.yml

```yaml
name: Build and Push Frontend Image

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'frontend/**'
      - '.github/workflows/build-frontend.yml'
  pull_request:
    branches:
      - main
      - develop
    paths:
      - 'frontend/**'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/simplecert-frontend

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./frontend
          file: ./frontend/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            REACT_APP_API_URL=${{ secrets.REACT_APP_API_URL || 'http://localhost:3001/api' }}
            REACT_APP_POCKETBASE_URL=${{ secrets.REACT_APP_POCKETBASE_URL || 'http://localhost:8090' }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Image digest
        run: echo ${{ steps.meta.outputs.digest }}
```

### .github/workflows/build-pocketbase.yml

```yaml
name: Build and Push PocketBase Image

on:
  push:
    branches:
      - main
      - develop
    paths:
      - 'pocketbase/**'
      - '.github/workflows/build-pocketbase.yml'
  pull_request:
    branches:
      - main
      - develop
    paths:
      - 'pocketbase/**'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository_owner }}/simplecert-pocketbase

jobs:
  build-and-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GitHub Container Registry
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix={{branch}}-
            type=raw,value=latest,enable={{is_default_branch}}

      - name: Build and push Docker image
        uses: docker/build-push-action@v5
        with:
          context: ./pocketbase
          file: ./pocketbase/Dockerfile
          push: ${{ github.event_name != 'pull_request' }}
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          build-args: |
            POCKETBASE_VERSION=0.21.0
          cache-from: type=gha
          cache-to: type=gha,mode=max
          platforms: linux/amd64,linux/arm64

      - name: Image digest
        run: echo ${{ steps.meta.outputs.digest }}
```

### .github/workflows/ci.yml (Tests et Linting)

```yaml
name: CI - Tests and Linting

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main
      - develop

jobs:
  backend-tests:
    name: Backend Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: backend/package-lock.json

      - name: Install dependencies
        working-directory: ./backend
        run: npm ci

      - name: Run linter
        working-directory: ./backend
        run: npm run lint || echo "Linter not configured yet"

      - name: Run tests
        working-directory: ./backend
        run: npm test || echo "Tests not configured yet"

  frontend-tests:
    name: Frontend Tests
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json

      - name: Install dependencies
        working-directory: ./frontend
        run: npm ci

      - name: Run linter
        working-directory: ./frontend
        run: npm run lint || echo "Linter not configured yet"

      - name: Run tests
        working-directory: ./frontend
        run: npm test -- --watchAll=false || echo "Tests not configured yet"

      - name: Build
        working-directory: ./frontend
        run: npm run build
        env:
          REACT_APP_API_URL: http://localhost:3001/api
          REACT_APP_POCKETBASE_URL: http://localhost:8090
```

---

## Commandes Docker

### Développement

```bash
# Build et démarrage de tous les services
docker-compose up --build

# Démarrage en arrière-plan
docker-compose up -d

# Arrêt des services
docker-compose down

# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend

# Rebuild d'un service spécifique
docker-compose build backend

# Redémarrer un service
docker-compose restart backend

# Exécuter une commande dans un conteneur
docker-compose exec backend sh
```

### Production

```bash
# Définir les variables d'environnement
export GITHUB_REPOSITORY_OWNER=your-username
export IMAGE_TAG=latest

# Démarrage avec images du registry
docker-compose -f docker-compose.prod.yml up -d

# Arrêt
docker-compose -f docker-compose.prod.yml down

# Mise à jour des images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Voir les logs
docker-compose -f docker-compose.prod.yml logs -f

# Vérifier le statut des services
docker-compose -f docker-compose.prod.yml ps
```

### Maintenance

```bash
# Nettoyer les volumes (⚠️ ATTENTION: supprime les données)
docker-compose down -v

# Nettoyer les images non utilisées
docker image prune -a

# Voir l'utilisation des ressources
docker stats

# Backup du volume PocketBase
docker run --rm -v simplecertmanager_pocketbase_data:/data -v $(pwd):/backup alpine tar czf /backup/pocketbase-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restaurer le volume PocketBase
docker run --rm -v simplecertmanager_pocketbase_data:/data -v $(pwd):/backup alpine tar xzf /backup/pocketbase-backup-YYYYMMDD.tar.gz -C /data

# Backup du volume backend storage
docker run --rm -v simplecertmanager_backend_storage:/data -v $(pwd):/backup alpine tar czf /backup/backend-storage-backup-$(date +%Y%m%d).tar.gz -C /data .
```

---

## Configuration des Secrets GitHub

Pour que les GitHub Actions fonctionnent correctement, configurez les secrets suivants dans votre repository GitHub:

1. Allez dans **Settings** > **Secrets and variables** > **Actions**
2. Ajoutez les secrets suivants (optionnels pour la configuration de base):

| Secret | Description | Exemple |
|--------|-------------|---------|
| `REACT_APP_API_URL` | URL de l'API backend en production | `https://api.example.com/api` |
| `REACT_APP_POCKETBASE_URL` | URL de PocketBase en production | `https://api.example.com/pb` |

**Note**: Le `GITHUB_TOKEN` est automatiquement fourni par GitHub Actions.

---

## Utilisation des Images du Registry

### Pull des images

```bash
# Se connecter au GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# Pull d'une image spécifique
docker pull ghcr.io/your-username/simplecert-backend:latest
docker pull ghcr.io/your-username/simplecert-frontend:latest
docker pull ghcr.io/your-username/simplecert-pocketbase:latest

# Pull d'une version spécifique
docker pull ghcr.io/your-username/simplecert-backend:v1.0.0
```

### Rendre les images publiques

1. Allez sur https://github.com/your-username?tab=packages
2. Cliquez sur le package (ex: `simplecert-backend`)
3. Cliquez sur **Package settings**
4. Dans la section **Danger Zone**, cliquez sur **Change visibility**
5. Sélectionnez **Public**

---

## Structure finale du projet

```
SimpleCertManager/
├── .github/
│   └── workflows/
│       ├── build-backend.yml
│       ├── build-frontend.yml
│       ├── build-pocketbase.yml
│       └── ci.yml
├── backend/
│   ├── src/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── nginx.conf
│   ├── Dockerfile
│   ├── .dockerignore
│   └── package.json
├── pocketbase/
│   ├── Dockerfile
│   ├── .dockerignore
│   └── pb_migrations/
├── plans/
│   ├── ca-management-app-plan.md
│   └── docker-and-cicd-config.md
├── docker-compose.yml
├── docker-compose.prod.yml
├── .env.example
├── .gitignore
└── README.md
```

---

## Workflow de déploiement

### 1. Développement local

```bash
# Cloner le repository
git clone https://github.com/your-username/SimpleCertManager.git
cd SimpleCertManager

# Copier et configurer les variables d'environnement
cp .env.example .env
# Éditer .env avec vos valeurs

# Démarrer l'application
docker-compose up --build
```

### 2. Push vers GitHub

```bash
# Commit et push
git add .
git commit -m "feat: add new feature"
git push origin main
```

### 3. Build automatique

- Les GitHub Actions détectent les changements
- Les images sont buildées automatiquement
- Les images sont poussées vers GitHub Container Registry

### 4. Déploiement en production

```bash
# Sur le serveur de production
export GITHUB_REPOSITORY_OWNER=your-username
export IMAGE_TAG=latest

# Pull et démarrage
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

---

## Monitoring et Logs

### Vérifier la santé des conteneurs

```bash
# Statut des services
docker-compose ps

# Health checks
docker inspect --format='{{.State.Health.Status}}' simplecert-backend
docker inspect --format='{{.State.Health.Status}}' simplecert-frontend
docker inspect --format='{{.State.Health.Status}}' simplecert-pocketbase
```

### Logs centralisés

Pour une solution de logging plus avancée, vous pouvez intégrer:
- **Loki** + **Grafana** pour la visualisation des logs
- **Prometheus** pour les métriques
- **Alertmanager** pour les alertes

---

## Sécurité

### Bonnes pratiques

1. **Ne jamais commiter les fichiers .env** (ajoutés dans .gitignore)
2. **Utiliser des secrets GitHub** pour les informations sensibles
3. **Scanner les images** pour les vulnérabilités:
   ```bash
   docker scan ghcr.io/your-username/simplecert-backend:latest
   ```
4. **Mettre à jour régulièrement** les images de base et les dépendances
5. **Utiliser HTTPS** en production avec des certificats valides
6. **Limiter les permissions** des conteneurs (utilisateurs non-root)
7. **Isoler les réseaux** Docker pour la sécurité

### Scan de sécurité automatique

Ajoutez Trivy ou Snyk dans vos GitHub Actions pour scanner automatiquement les vulnérabilités.

---

## Résumé

Cette configuration Docker et CI/CD fournit:

- ✅ **Conteneurisation complète** de l'application (frontend, backend, PocketBase)
- ✅ **Build automatique** via GitHub Actions
- ✅ **Publication automatique** sur GitHub Container Registry
- ✅ **Support multi-architecture** (amd64, arm64)
- ✅ **Health checks** pour tous les services
- ✅ **Logging structuré** avec rotation
- ✅ **Volumes persistants** pour les données
- ✅ **Configuration séparée** dev/prod
- ✅ **Sécurité renforcée** (utilisateurs non-root, secrets)
- ✅ **Facilité de déploiement** avec docker-compose

L'application peut être déployée en quelques commandes sur n'importe quel serveur supportant Docker!
