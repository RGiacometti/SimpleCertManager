# SimpleCertManager

> Application web de gestion d'autorité de certification (CA) locale pour petites équipes IT

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-18-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-blue.svg)](https://reactjs.org/)

## 📋 Vue d'ensemble

SimpleCertManager est une application web complète pour gérer une autorité de certification (CA) locale. Elle permet de créer, émettre, révoquer et renouveler des certificats SSL/TLS de manière simple et sécurisée.

### Fonctionnalités principales

- ✅ **Gestion complète des certificats** : Demande, approbation, émission, révocation, renouvellement
- ✅ **Interface moderne** : React + Material-UI avec design responsive
- ✅ **Sécurité renforcée** : Passphrase CA jamais stockée, audit complet, HTTPS obligatoire
- ✅ **Rapports de conformité** : Génération automatique de rapports mensuels/trimestriels/annuels
- ✅ **Journal d'audit** : Traçabilité complète de toutes les actions
- ✅ **Gestion CRL** : Certificate Revocation List automatique
- ✅ **Déploiement Docker** : Conteneurisation complète avec docker-compose
- ✅ **CI/CD automatique** : Build et publication automatique sur GitHub Container Registry

## 🏗️ Architecture

```
┌─────────────────┐
│  React Frontend │  ← Interface utilisateur (Material-UI)
│   (Port 80)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Node.js API    │  ← Backend Express + node-forge
│   (Port 3001)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   PocketBase    │  ← Base de données + Auth
│   (Port 8090)   │
└─────────────────┘
```

### Stack technique

- **Frontend** : React 18, Material-UI 5, React Router 6
- **Backend** : Node.js 18, Express.js, node-forge (cryptographie)
- **Base de données** : PocketBase (SQLite embarqué)
- **Conteneurisation** : Docker, Docker Compose
- **CI/CD** : GitHub Actions
- **Registry** : GitHub Container Registry (ghcr.io)

## 🚀 Démarrage rapide

### Prérequis

- Docker 20.10+
- Docker Compose 2.0+
- Git

### Installation (Développement)

1. **Cloner le repository**

```bash
git clone https://github.com/your-username/SimpleCertManager.git
cd SimpleCertManager
```

2. **Configurer les variables d'environnement**

```bash
cp .env.example .env
# Éditer .env avec vos valeurs
```

3. **Démarrer l'application**

```bash
docker-compose up --build
```

4. **Accéder à l'application**

- Frontend : http://localhost
- Backend API : http://localhost:3001
- PocketBase Admin : http://localhost:8090/_/

### Installation (Production)

1. **Configurer les variables d'environnement**

```bash
export GITHUB_REPOSITORY_OWNER=your-username
export IMAGE_TAG=latest
```

2. **Démarrer avec les images du registry**

```bash
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

3. **Vérifier le statut**

```bash
docker-compose -f docker-compose.prod.yml ps
```

## 📖 Documentation

- **[Plan complet de l'application](plans/ca-management-app-plan.md)** : Architecture détaillée, schéma de base de données, endpoints API, flux de travail
- **[Configuration Docker et CI/CD](plans/docker-and-cicd-config.md)** : Dockerfiles, docker-compose, GitHub Actions, commandes

## 🔐 Sécurité

### Gestion de la passphrase CA

⚠️ **Point critique** : La passphrase de la CA est le secret le plus important de l'application.

- ❌ **Jamais stockée** sur le serveur (ni en base de données, ni en fichier, ni en variable d'environnement)
- ✅ **Fournie par l'utilisateur** à chaque opération de signature (émission, révocation)
- ✅ **Utilisée temporairement** en mémoire puis immédiatement effacée
- ✅ **Transmission sécurisée** via HTTPS uniquement

### Bonnes pratiques

1. **Mémoriser la passphrase** ou la stocker dans un gestionnaire de mots de passe sécurisé
2. **Utiliser HTTPS** en production avec des certificats valides
3. **Sauvegarder régulièrement** les volumes Docker (données PocketBase et certificats)
4. **Limiter l'accès** à l'application aux administrateurs autorisés
5. **Surveiller les logs d'audit** pour détecter les activités suspectes

## 🔧 Commandes utiles

### Développement

```bash
# Démarrer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f

# Logs d'un service spécifique
docker-compose logs -f backend

# Redémarrer un service
docker-compose restart backend

# Arrêter tous les services
docker-compose down
```

### Production

```bash
# Démarrer
docker-compose -f docker-compose.prod.yml up -d

# Mettre à jour les images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d

# Voir le statut
docker-compose -f docker-compose.prod.yml ps

# Arrêter
docker-compose -f docker-compose.prod.yml down
```

### Maintenance

```bash
# Backup du volume PocketBase
docker run --rm \
  -v simplecertmanager_pocketbase_data:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/pocketbase-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup du volume backend storage
docker run --rm \
  -v simplecertmanager_backend_storage:/data \
  -v $(pwd):/backup \
  alpine tar czf /backup/backend-storage-backup-$(date +%Y%m%d).tar.gz -C /data .

# Restaurer un backup
docker run --rm \
  -v simplecertmanager_pocketbase_data:/data \
  -v $(pwd):/backup \
  alpine tar xzf /backup/pocketbase-backup-YYYYMMDD.tar.gz -C /data
```

## 📊 Fonctionnalités détaillées

### Gestion des demandes de certificats

1. **Créer une demande** avec les informations du certificat (CN, SAN, organisation, etc.)
2. **Approuver ou rejeter** la demande
3. **Émettre le certificat** après approbation (nécessite la passphrase CA)

### Gestion des certificats

- **Visualiser** tous les certificats émis avec filtres (statut, date d'expiration, CN)
- **Télécharger** le certificat (.crt), la clé privée (.key) ou un bundle complet (.zip)
- **Révoquer** un certificat avec raison (nécessite la passphrase CA)
- **Renouveler** un certificat expirant (nécessite la passphrase CA)
- **Alertes** pour les certificats expirant dans 30 jours

### Rapports de conformité

- Génération automatique de rapports (mensuel, trimestriel, annuel, à la demande)
- Statistiques : certificats actifs, expirés, révoqués, expirant bientôt
- Export en JSON ou PDF

### Journal d'audit

- Traçabilité complète de toutes les actions
- Filtres par utilisateur, action, date, entité
- Logs immuables (ne peuvent pas être modifiés)

## 🏗️ Structure du projet

```
SimpleCertManager/
├── .github/
│   └── workflows/          # GitHub Actions (CI/CD)
│       ├── build-backend.yml
│       ├── build-frontend.yml
│       ├── build-pocketbase.yml
│       └── ci.yml
├── backend/
│   ├── src/
│   │   ├── config/         # Configuration
│   │   ├── middleware/     # Middlewares Express
│   │   ├── services/       # Services métier (CA, certificats, CRL, etc.)
│   │   ├── routes/         # Routes API
│   │   └── utils/          # Utilitaires
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Composants React
│   │   ├── pages/          # Pages de l'application
│   │   ├── services/       # Services API
│   │   ├── hooks/          # Hooks personnalisés
│   │   └── theme/          # Thème Material-UI
│   ├── nginx.conf
│   ├── Dockerfile
│   └── package.json
├── pocketbase/
│   ├── Dockerfile
│   └── pb_migrations/      # Migrations de base de données
├── plans/
│   ├── ca-management-app-plan.md
│   └── docker-and-cicd-config.md
├── docker-compose.yml      # Configuration développement
├── docker-compose.prod.yml # Configuration production
├── .env.example
└── README.md
```

## 🔄 Workflow CI/CD

### Build automatique

Lorsque vous poussez du code sur `main` ou `develop` :

1. **GitHub Actions** détecte les changements
2. **Build** des images Docker pour les services modifiés
3. **Tests** automatiques (linting, tests unitaires)
4. **Push** des images sur GitHub Container Registry
5. **Tag** automatique (latest, version, SHA)

### Déploiement

```bash
# Pull des dernières images
docker-compose -f docker-compose.prod.yml pull

# Redémarrage avec les nouvelles images
docker-compose -f docker-compose.prod.yml up -d
```

## 🌐 Endpoints API

### Authentification
- `POST /api/auth/login` - Connexion
- `POST /api/auth/logout` - Déconnexion
- `GET /api/auth/me` - Informations utilisateur

### Demandes de certificats
- `GET /api/requests` - Liste des demandes
- `POST /api/requests` - Créer une demande
- `POST /api/requests/:id/approve` - Approuver
- `POST /api/requests/:id/reject` - Rejeter

### Certificats
- `GET /api/certificates` - Liste des certificats
- `POST /api/certificates/issue/:requestId` - Émettre (+ passphrase)
- `POST /api/certificates/:id/revoke` - Révoquer (+ passphrase)
- `POST /api/certificates/:id/renew` - Renouveler (+ passphrase)
- `GET /api/certificates/:id/download` - Télécharger
- `GET /api/certificates/expiring` - Certificats expirant bientôt

### Configuration CA
- `GET /api/ca/config` - Configuration actuelle
- `POST /api/ca/initialize` - Initialiser la CA (+ passphrase)
- `GET /api/ca/certificate` - Télécharger le certificat CA
- `GET /api/ca/crl` - Télécharger la CRL

### Rapports et Audit
- `GET /api/reports` - Liste des rapports
- `POST /api/reports/generate` - Générer un rapport
- `GET /api/audit/logs` - Journal d'audit

## 🤝 Contribution

Les contributions sont les bienvenues ! Veuillez suivre ces étapes :

1. Fork le projet
2. Créer une branche (`git checkout -b feature/AmazingFeature`)
3. Commit vos changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📝 License

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 👥 Auteurs

- **Votre Nom** - *Travail initial* - [YourGitHub](https://github.com/your-username)

## 🙏 Remerciements

- [node-forge](https://github.com/digitalbazaar/forge) - Bibliothèque cryptographique JavaScript
- [PocketBase](https://pocketbase.io/) - Backend as a Service
- [Material-UI](https://mui.com/) - Composants React
- [Express.js](https://expressjs.com/) - Framework web Node.js

## 📞 Support

Pour toute question ou problème :

- 📧 Email : support@example.com
- 🐛 Issues : [GitHub Issues](https://github.com/your-username/SimpleCertManager/issues)
- 📖 Documentation : [Wiki](https://github.com/your-username/SimpleCertManager/wiki)

---

**⚠️ Avertissement** : Cette application est conçue pour des environnements de petite à moyenne taille. Pour des besoins d'entreprise critiques, envisagez des solutions professionnelles avec support HSM (Hardware Security Module).
