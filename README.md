# Yoga Studio Management System

Application full-stack de gestion d'un studio de yoga : sessions, enseignants, inscriptions et profils utilisateurs.

## Stack technique

### Backend
- Node.js 22 LTS
- Express.js 4.x
- TypeScript 5.4+
- Prisma ORM
- PostgreSQL 16
- JWT (authentification)
- bcrypt (hachage des mots de passe)

### Frontend
- React 19
- TypeScript 5.9+
- Vite 7.x
- TailwindCSS 4.x
- React Router 6.x
- Axios

### Infrastructure
- Docker + Docker Compose
- PostgreSQL (conteneur)

---

## Prérequis

- Node.js 22 LTS ou supérieur
- Docker et Docker Compose
- npm

---

## Installation

### 1. Cloner le dépôt

```bash
git clone <url-du-repo>
cd testez-app-js
```

### 2. Installer les dépendances backend

```bash
cd backend
npm install
```

### 3. Installer les dépendances frontend

```bash
cd ../frontend
npm install
```

### 4. Configurer les variables d'environnement

Créer un fichier `.env` dans le dossier `backend/` :

```env
DATABASE_URL="postgresql://yogauser:yogapass@localhost:5433/yogastudio"
DATABASE_TEST_URL="postgresql://yogauser:yogapass@localhost:5434/yogastudio_test"
JWT_SECRET="your-secret-key-change-me-in-production"
PORT=8080
NODE_ENV=development
```

### 5. Démarrer les bases de données avec Docker

Depuis la racine du projet :

```bash
docker-compose up -d
```

Cela démarre deux conteneurs PostgreSQL :
- `yoga-studio-db` sur le port `5433` (base principale)
- `yoga-studio-db-test` sur le port `5434` (base de test)

### 6. Lancer les migrations Prisma

```bash
cd backend
npm run prisma:migrate
```

### 7. Alimenter la base de données

```bash
npm run prisma:seed
```

Cela crée :
- 1 utilisateur admin : `yoga@studio.com` / `test!1234`
- 1 utilisateur standard : `user@test.com` / `test!1234`
- 3 enseignants
- 4 sessions de yoga

---

## Lancer l'application

### Backend (Terminal 1)

```bash
cd backend
npm run dev
```

API disponible sur `http://localhost:8080`

### Frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Interface disponible sur `http://localhost:3000`

---

## Tests

### Architecture des tests

```
backend/
└── src/__tests__/
    ├── unit/                        # Tests unitaires (services)
    │   ├── auth.service.test.ts
    │   ├── teacher.service.test.ts
    │   ├── user.service.test.ts
    │   └── session.service.test.ts
    └── integration/                 # Tests d'intégration (controllers via HTTP)
        ├── auth.controller.test.ts
        ├── teacher.controller.test.ts
        ├── user.controller.test.ts
        └── session.controller.test.ts

frontend/
├── src/__tests__/
│   ├── components/                  # Tests unitaires composants
│   │   └── Navbar.test.tsx
│   ├── pages/                       # Tests unitaires pages
│   │   ├── Login.test.tsx
│   │   ├── Register.test.tsx
│   │   ├── Sessions.test.tsx
│   │   ├── SessionDetail.test.tsx
│   │   ├── SessionForm.test.tsx
│   │   └── Profile.test.tsx
│   └── services/                    # Tests unitaires services
│       └── auth.service.test.ts
└── cypress/e2e/                     # Tests E2E
    ├── login.cy.ts
    ├── register.cy.ts
    ├── sessions.cy.ts
    ├── session-detail.cy.ts
    ├── session-form.cy.ts
    └── profile.cy.ts
```

---

### Tests backend

Les tests backend utilisent **Vitest** et **Supertest**.

**Tests unitaires** — testent la logique des services de manière isolée (Prisma, bcrypt et JWT sont mockés) :

```bash
cd backend
npm test
npm run test:coverage
```

**Tests d'intégration** — envoient de vraies requêtes HTTP contre l'application Express (les services sont mockés) :

```bash
cd backend
npm test
npm run test:coverage
```

**Tous les tests backend** :

```bash
cd backend
npm test
```

---

### Tests frontend

Les tests frontend utilisent **Vitest** et **Testing Library**.

**Tests unitaires et de composants** :

```bash
cd frontend
npm test
```

---

### Tests E2E

Les tests E2E utilisent **Cypress**. Ils nécessitent que l'application soit en cours d'exécution (backend + frontend).

**Démarrer l'application avant de lancer les E2E** :

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Terminal 3 (base de données)
- ouvrir docker desktop
docker-compose up -d
```

**Ouvrir l'interface Cypress (mode interactif)** :

```bash
cd frontend
npm run cypress:open
```

**Lancer les tests E2E en ligne de commande** :

```bash
cd frontend
npm run cypress:run
```

---

### Rapports de couverture

Les seuils de couverture sont fixés à **80 % minimum** pour chaque indicateur (instructions, branches, fonctions, lignes), aussi bien pour le backend que le frontend.

**Rapport de couverture backend** :

```bash
cd backend
npm run test:coverage
```

**Rapport de couverture frontend** :

```bash
cd frontend
npm run test:coverage
```

Le rapport HTML est généré dans le dossier `coverage/` de chaque partie. Ouvrir `coverage/index.html` dans un navigateur pour visualiser le rapport détaillé.


---

## Identifiants par défaut

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | `yoga@studio.com` | `test!1234` |
| Utilisateur | `user@test.com` | `test!1234` |

---

## Endpoints API

### Authentification (public)
- `POST /api/auth/register` — inscription
- `POST /api/auth/login` — connexion, retourne un JWT

### Sessions (protégé)
- `GET /api/session` — liste des sessions
- `GET /api/session/:id` — détail d'une session
- `POST /api/session` — créer une session (admin)
- `PUT /api/session/:id` — modifier une session (admin)
- `DELETE /api/session/:id` — supprimer une session (admin)
- `POST /api/session/:id/participate/:userId` — rejoindre une session
- `DELETE /api/session/:id/participate/:userId` — quitter une session

### Enseignants (protégé)
- `GET /api/teacher` — liste des enseignants
- `GET /api/teacher/:id` — détail d'un enseignant

### Utilisateurs (protégé)
- `GET /api/user/:id` — profil utilisateur
- `DELETE /api/user/:id` — supprimer son compte
- `POST /api/user/promote-admin` — se promouvoir admin (développement uniquement)

---

## Scripts disponibles

### Backend

```bash
npm run dev              # Serveur de développement (nodemon)
npm run build            # Compilation TypeScript
npm start                # Serveur de production
npm test                 # Lancer tous les tests
npm run test:coverage    # Rapport de couverture
npm run prisma:migrate   # Lancer les migrations
npm run prisma:seed      # Alimenter la base de données
npm run prisma:studio    # Ouvrir Prisma Studio
```

### Frontend

```bash
npm run dev              # Serveur de développement Vite
npm run build            # Build de production
npm run preview          # Prévisualiser le build
npm test                 # Lancer les tests unitaires
npm run test:coverage    # Rapport de couverture
npm run cypress:open     # Ouvrir Cypress (mode interactif)
npm run cypress:run      # Lancer les tests E2E en CLI
```

---

## Dépannage

### La base de données ne démarre pas

```bash
# Vérifier l'état des conteneurs
docker ps

# Redémarrer les conteneurs
docker-compose restart

# Consulter les logs
docker-compose logs postgres
```

### Port déjà utilisé

```bash
# Vérifier quel processus utilise le port 8080
lsof -i :8080

# Tuer le processus
kill -9 <PID>
```

### Problèmes Prisma

```bash
# Régénérer le client Prisma
npx prisma generate

# Réinitialiser la base (supprime toutes les données)
npx prisma migrate reset
```
