# 🎓 École Excellence - Application de Gestion Scolaire

## 📋 Vue d'ensemble

Application **Angular 21** complète de gestion scolaire, convertie depuis React + TypeScript. L'application est **100% fonctionnelle côté frontend**, avec une architecture prête pour être connectée à un backend **Spring Boot** + **JWT**.

**Statut**: ✅ Frontend complet et fonctionnel | ⏳ Backend à implémenter

---

## 🏗️ Architecture

### Structure du Projet (SPRING BOOT READY)

```
src/app/
├── core/
│   ├── auth/
│   │   └── auth.service.ts              # Service d'authentification (JWT ready)
│   ├── guards/
│   │   └── auth.guard.ts                # Guards Angular (auth + roles)
│   ├── interceptors/
│   │   └── jwt.interceptor.ts           # Interceptor HTTP pour JWT
│   └── layout/
│       └── sidebar/                     # Menu latéral de navigation
│
├── models/
│   └── dtos.ts                          # DTOs compatibles Spring Boot
│
├── services/
│   └── api/
│       ├── student.service.ts           # Service Élèves (REST ready)
│       ├── class.service.ts             # Service Classes
│       └── attendance.service.ts        # Service Assiduité
│
├── pages/
│   ├── login/                           # Page de connexion
│   ├── dashboard/                       # Tableau de bord
│   ├── students/                        # Gestion élèves
│   ├── classes/                         # Classes & matières
│   ├── attendance/                      # Assiduité
│   ├── grades/                          # Notes
│   ├── finance/                         # Finance
│   ├── settings/                        # Paramètres
│   ├── parent-portal/                   # Portail parents
│   └── unauthorized/                    # Page accès refusé
│
├── app.routes.ts                        # Configuration routing
├── app.config.ts                        # Configuration application
└── app.component.ts                     # Composant racine
```

---

## ✨ Fonctionnalités Principales

### 🔐 Authentification & Sécurité

- ✅ Service `AuthService` avec gestion de session (localStorage)
- ✅ Guards de route (`authGuard`, `roleGuard`)
- ✅ Interceptor HTTP prêt pour JWT (à activer)
- ✅ 6 rôles utilisateurs : ADMIN, TEACHER, ACCOUNTANT, SECRETARY, DIRECTOR, PARENT
- ✅ Permissions granulaires par route

### 📊 Modules Implémentés

1. **Login** ✅ Complet
   - Sélection du rôle utilisateur
   - Email & mot de passe
   - Toggle affichage mot de passe
   - Gestion d'erreurs

2. **Dashboard** ✅ Complet
   - KPI cards (élèves, présence, finances)
   - Alertes et notifications
   - Activité récente
   - Derniers paiements

3. **Students** ✅ Complet
   - Liste des élèves avec recherche
   - Filtres par classe
   - Calcul d'âge automatique
   - Actions (voir, éditer, imprimer)
   - Pagination

4. **Autres modules** ⏳ Stubs créés (à implémenter)
   - Classes & Matières
   - Assiduité
   - Notes
   - Finance
   - Paramètres
   - Portail Parents

---

## 🔌 Préparation Backend Spring Boot

### DTOs TypeScript ↔ Java

Tous les DTOs sont **parfaitement compatibles** avec les entités Spring Boot :

**TypeScript (Frontend)**:
```typescript
export interface StudentDto {
  id?: number;
  firstName: string;
  lastName: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
  email?: string;
  classId?: number;
  status: 'ACTIVE' | 'INACTIVE';
  // ...
}
```

**Java (Backend - à implémenter)**:
```java
@Entity
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String firstName;
    private String lastName;
    private LocalDate dateOfBirth;
    private String email;
    private Long classId;
    
    @Enumerated(EnumType.STRING)
    private StudentStatus status;
    // ...
}
```

### Endpoints REST Déjà Définis

Les services Angular sont prêts avec les URLs :

| Service | Endpoint | Méthode | Description |
|---------|----------|---------|-------------|
| StudentService | `/api/students` | GET | Récupérer tous les élèves |
| StudentService | `/api/students/{id}` | GET | Récupérer un élève |
| StudentService | `/api/students` | POST | Créer un élève |
| StudentService | `/api/students/{id}` | PUT | Modifier un élève |
| StudentService | `/api/students/{id}` | DELETE | Supprimer un élève |
| ClassService | `/api/classes` | GET | Récupérer toutes les classes |
| AttendanceService | `/api/attendance` | GET | Récupérer présences |
| AuthService | `/api/auth/login` | POST | Authentification |
| AuthService | `/api/auth/logout` | POST | Déconnexion |
| AuthService | `/api/auth/refresh` | POST | Rafraîchir le token |

### TODO Backend Spring Boot

**1. Créer l'API REST**
```bash
# Contrôleurs Spring Boot à créer :
- StudentController
- ClassController
- AttendanceController
- GradeController
- PaymentController
- AuthController
```

**2. Configurer JWT avec Spring Security**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    // TODO: Configuration JWT + Spring Security
    // TODO: Autoriser CORS pour Angular (localhost:4200)
}
```

**3. Activer l'Interceptor JWT côté Angular**

Dans `app.config.ts`, décommenter :
```typescript
provideHttpClient(
  withInterceptors([jwtInterceptor]) // ← Activer
)
```

**4. Configurer l'URL de l'API**

Dans `environment.development.ts` :
```typescript
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:8080' // ← URL de votre backend Spring Boot
};
```

---

## 🚀 Installation & Démarrage

### Prérequis

- **Node.js** version 18+
- **npm** version 9+
- **Angular CLI** version 19+

### 1. Installation des dépendances

```bash
npm install
```

### 2. Lancer l'application en développement

```bash
npm start
# ou
ng serve
```

L'application sera accessible sur **http://localhost:4200**

### 3. Connexion

**Comptes de test** (accepte n'importe quel mot de passe pour la démo) :

| Email | Rôle |
|-------|------|
| `admin@ecole.fr` | Administrateur |
| `enseignant@ecole.fr` | Enseignant |
| `parent@ecole.fr` | Parent |

### 4. Build pour production

```bash
npm run build
```

Les fichiers seront générés dans `dist/openschool-angular/`

---

## 🎨 Design System

### Couleurs

```css
--color-primary: #3b5998;           /* Bleu institutionnel */
--color-success: #10b981;           /* Vert (succès) */
--color-warning: #f59e0b;           /* Orange (alerte) */
--color-error: #ef4444;             /* Rouge (erreur) */
--color-info: #3b82f6;              /* Bleu (information) */
```

### Technologies UI

- ❌ **PAS de Tailwind** (converti en SCSS pur)
- ❌ **PAS de Bootstrap**
- ✅ **SCSS natif** avec variables CSS
- ✅ **Material Icons** (Google Fonts)
- ✅ **Google Font Inter** pour la typographie
- ✅ **Angular Material** (léger - uniquement boutons, inputs, dialogs)

### Composants Réutilisables

- `<app-sidebar>` : Menu latéral de navigation
- Boutons : `.btn`, `.btn-primary`, `.btn-outline`
- Cards : `.card`, `.stat-card`, `.dashboard-card`
- Table : `.students-table` avec styles hover et responsive

---

## 📁 Fichiers Importants

### Configuration

| Fichier | Description |
|---------|-------------|
| `angular.json` | Configuration Angular CLI |
| `package.json` | Dépendances npm |
| `tsconfig.json` | Configuration TypeScript |
| `src/app/app.routes.ts` | Configuration des routes |
| `src/app/app.config.ts` | Providers Angular |
| `src/environments/environment.ts` | Configuration environnement prod |
| `src/environments/environment.development.ts` | Configuration environnement dev |

### Styles

| Fichier | Description |
|---------|-------------|
| `src/styles.scss` | Styles globaux + design system |
| `src/index.html` | HTML d'entrée (fonts, icons) |

### Services Principaux

| Service | Fichier | Description |
|---------|---------|-------------|
| AuthService | `core/auth/auth.service.ts` | Authentification JWT ready |
| StudentService | `services/api/student.service.ts` | CRUD Élèves |
| ClassService | `services/api/class.service.ts` | CRUD Classes |
| AttendanceService | `services/api/attendance.service.ts` | Gestion assiduité |

---

## 🧩 Conversion React → Angular

### Correspondances des Concepts

| React | Angular |
|-------|---------|
| `useState()` | Propriétés de classe |
| `props` | `@Input()` / `@Output()` |
| `useEffect()` | `ngOnInit()`, `ngOnChanges()` |
| `.map()` | `*ngFor` |
| `condition &&` | `*ngIf` |
| Tailwind classes | SCSS pur avec variables |
| `import Component` | `imports: [Component]` (standalone) |

### Exemple de Conversion

**React** :
```tsx
const [email, setEmail] = useState('');

<input 
  value={email}
  onChange={(e) => setEmail(e.target.value)} 
/>
```

**Angular** :
```typescript
email: string = '';

<input [(ngModel)]="email" />
```

---

## 📝 Checklist de Développement

### Frontend Angular ✅

- [x] Architecture Angular 21 Standalone
- [x] DTOs compatibles Spring Boot
- [x] Services mockés (REST ready)
- [x] AuthService + Guards
- [x] Interceptor JWT (prêt, désactivé)
- [x] Routing avec lazy loading
- [x] Login complet fonctionnel
- [x] Dashboard complet fonctionnel
- [x] Module Students complet fonctionnel
- [x] Sidebar + layout
- [x] Design system SCSS
- [x] Responsive design

### Backend Spring Boot ⏳ À Implémenter

- [ ] Initialiser projet Spring Boot
- [ ] Configurer Spring Security + JWT
- [ ] Créer entities JPA (Student, Class, etc.)
- [ ] Créer repositories JPA
- [ ] Créer services business
- [ ] Créer controllers REST
- [ ] Configurer CORS
- [ ] Tests unitaires
- [ ] Tests d'intégration

### Intégration Frontend ↔ Backend ⏳

- [ ] Activer interceptor JWT
- [ ] Configurer apiBaseUrl
- [ ] Remplacer `of()` mockés par appels HTTP
- [ ] Tester endpoints
- [ ] Gestion d'erreurs HTTP
- [ ] Refresh token automatique

---

## 🔧 Scripts NPM

```bash
npm start           # Démarre le serveur de développement
npm run build       # Build pour production
npm run watch       # Build en mode watch
npm test            # Lance les tests (à configurer)
```

---

## 📚 Documentation Complémentaire

### Pour les Développeurs Angular

- 📘 [Guide officiel Angular](https://angular.dev)
- 📘 [Angular Material](https://material.angular.io)
- 📘 [RxJS](https://rxjs.dev)

### Pour les Développeurs Spring Boot

- 📘 [Spring Boot Documentation](https://spring.io/projects/spring-boot)
- 📘 [Spring Security + JWT](https://spring.io/guides/tutorials/spring-boot-oauth2/)
- 📘 [Spring Data JPA](https://spring.io/projects/spring-data-jpa)

---

## 🎯 Prochaines Étapes

1. **Implémenter les modules manquants** (Classes, Attendance, Grades, Finance, Settings, Parent Portal)
2. **Créer le backend Spring Boot** avec les endpoints REST
3. **Configurer Spring Security + JWT**
4. **Activer l'interceptor HTTP** côté Angular
5. **Tester l'intégration complète**
6. **Ajouter des graphiques** (ng2-charts ou ngx-charts)
7. **Améliorer la gestion d'erreurs**
8. **Ajouter des tests unitaires** (Jasmine + Karma)

---

## 👥 Support & Contribution

- 📧 Email : support@ecole-excellence.fr
- 🐛 Issues : Créer une issue GitHub
- 📖 Wiki : Documentation détaillée (à venir)

---

## 📄 Licence

© 2026 École Excellence - Tous droits réservés.

---

**Version** : 1.0.0  
**Date** : Janvier 2026  
**Statut** : 🚧 Frontend Complete | Backend À Implémenter  
**Framework** : Angular 21 (Standalone Components)  
**Backend Prévu** : Spring Boot 3.x + JWT + JPA
