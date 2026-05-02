# ⚡ Quick Start Guide - École Excellence Angular

Guide de démarrage rapide pour lancer l'application en 5 minutes.

---

## 📦 Installation Rapide

### 1. Installer les dépendances

```bash
npm install
```

### 2. Démarrer l'application

```bash
npm start
```

L'application sera accessible sur **http://localhost:4200**

---

## 🔐 Connexion

Utilisez n'importe lequel de ces comptes (tout mot de passe est accepté en mode mock) :

| **Email** | **Rôle** | **Accès** |
|-----------|----------|-----------|
| `admin@ecole.fr` | Administrateur | Tous les modules |
| `enseignant@ecole.fr` | Enseignant | Dashboard, Classes, Notes, Assiduité |
| `parent@ecole.fr` | Parent | Portail Parents uniquement |
| `comptable@ecole.fr` | Comptable | Dashboard, Finance |
| `secretariat@ecole.fr` | Secrétariat | Élèves, Assiduité |

---

## 📂 Structure du Projet

```
src/app/
├── core/                  # Services et guards (auth, layout)
├── models/                # DTOs (interfaces TypeScript)
├── services/api/          # Services API (mock data pour l'instant)
├── pages/                 # Composants de page (login, dashboard, etc.)
├── app.routes.ts          # Configuration des routes
└── styles.scss            # Styles globaux
```

---

## 🎨 Modules Disponibles

| Module | Statut | Route | Rôles |
|--------|--------|-------|-------|
| **Login** | ✅ Complet | `/login` | Public |
| **Dashboard** | ✅ Complet | `/dashboard` | Tous sauf Parent |
| **Élèves** | ✅ Complet | `/students` | Admin, Secrétariat |
| **Classes** | ⏳ Stub | `/classes` | Admin, Enseignant |
| **Assiduité** | ⏳ Stub | `/attendance` | Admin, Enseignant, Secrétariat |
| **Notes** | ⏳ Stub | `/grades` | Admin, Enseignant |
| **Finance** | ⏳ Stub | `/finance` | Admin, Comptable |
| **Paramètres** | ⏳ Stub | `/settings` | Admin |
| **Portail Parents** | ⏳ Stub | `/parent-portal` | Parent |

---

## 🧪 Tester l'Application

### Scénario 1 : Admin

1. Se connecter avec `admin@ecole.fr`
2. Naviguer vers **Dashboard** → Voir les KPI, alertes, paiements
3. Naviguer vers **Élèves** → Voir la liste complète des élèves
4. Tester la recherche et les filtres

### Scénario 2 : Enseignant

1. Se connecter avec `enseignant@ecole.fr`
2. Accès limité : Dashboard, Classes (stub), Notes (stub), Assiduité (stub)
3. Pas d'accès à Finance ni Paramètres

### Scénario 3 : Parent

1. Se connecter avec `parent@ecole.fr`
2. Redirection automatique vers Portail Parents (stub)

---

## 🔧 Configuration

### Modifier l'URL de l'API

**Fichier : `src/environments/environment.development.ts`**

```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080', // ← Changer ici
  appName: 'École Excellence'
};
```

### Activer l'Interceptor JWT

Quand le backend est prêt, dans `src/app/app.config.ts` :

```typescript
provideHttpClient(
  withInterceptors([jwtInterceptor]) // ← Décommenter
)
```

---

## 📝 Commandes Utiles

```bash
# Démarrer en mode dev
npm start

# Build production
npm run build

# Mode watch (rebuild automatique)
npm run watch

# Linter
ng lint

# Formater le code
npx prettier --write "src/**/*.{ts,html,scss}"
```

---

## 🐛 Problèmes Courants

### ❌ Erreur : "Cannot find module '@angular/core'"

**Solution** : Installer les dépendances
```bash
npm install
```

### ❌ Port 4200 déjà utilisé

**Solution** : Utiliser un autre port
```bash
ng serve --port 4300
```

### ❌ Erreurs de compilation TypeScript

**Cause** : Les packages Angular ne sont pas encore installés  
**Solution** : Lancer `npm install` puis `npm start`

---

## 📚 Prochaines Étapes

1. ✅ **Tester l'application** avec les comptes fournis
2. ⏳ **Implémenter les modules manquants** (Classes, Attendance, Grades, etc.)
3. ⏳ **Créer le backend Spring Boot** (voir `TODO_BACKEND.md`)
4. ⏳ **Connecter Angular au backend**
5. ⏳ **Ajouter des tests unitaires**

---

## 🆘 Support

- 📖 Documentation complète : `README.md`
- 🔨 Guide backend : `TODO_BACKEND.md`
- 📧 Questions : support@ecole-excellence.fr

---

**Bon développement ! 🚀**
