# 🏗️ Architecture du Projet - École Excellence

Documentation visuelle de l'architecture frontend Angular et backend Spring Boot (à venir).

---

## 📊 Vue d'Ensemble

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND ANGULAR 21                         │
│                  (100% Fonctionnel - Mock Data)                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓ HTTP REST
┌─────────────────────────────────────────────────────────────────┐
│                   BACKEND SPRING BOOT 3.x                       │
│                    (À Implémenter - TODO)                       │
└─────────────────────────────────────────────────────────────────┘
                              ↓ JPA
┌─────────────────────────────────────────────────────────────────┐
│                    BASE DE DONNÉES MySQL                        │
│                         (À Configurer)                          │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Architecture Frontend Angular

### Composants Principaux

```
┌──────────────┐
│ App (Root)   │  → Point d'entrée, router-outlet
└──────┬───────┘
       │
       ├── LoginComponent (Page de connexion)
       │
       ├── DashboardComponent (Tableau de bord)
       │   ├── Sidebar
       │   ├── KPI Cards
       │   ├── Alertes
       │   └── Activité récente
       │
       ├── StudentsComponent (CRUD Élèves)
       │   ├── Sidebar
       │   ├── Recherche & Filtres
       │   └── Table avec actions
       │
       ├── ClassesComponent (stub)
       ├── AttendanceComponent (stub)
       ├── GradesComponent (stub)
       ├── FinanceComponent (stub)
       ├── SettingsComponent (stub)
       └── ParentPortalComponent (stub)
```

### Services & Logique Métier

```
┌──────────────────────────────────────────┐
│           SERVICES ANGULAR               │
├──────────────────────────────────────────┤
│                                          │
│  AuthService                             │
│  ├── login()                             │
│  ├── logout()                            │
│  ├── getToken()                          │
│  └── hasRole()                           │
│                                          │
│  StudentService (CRUD)                   │
│  ├── getAll()  → GET /api/students       │
│  ├── getById() → GET /api/students/{id}  │
│  ├── create()  → POST /api/students      │
│  ├── update()  → PUT /api/students/{id}  │
│  └── delete()  → DELETE /api/students/{id}│
│                                          │
│  ClassService, AttendanceService, ...    │
│  (même pattern CRUD)                     │
└──────────────────────────────────────────┘
```

### Sécurité & Routing

```
┌─────────────────────────────────────────────┐
│            GUARDS & INTERCEPTORS            │
├─────────────────────────────────────────────┤
│                                             │
│  authGuard                                  │
│  └── Vérifie si l'utilisateur est connecté │
│                                             │
│  roleGuard                                  │
│  └── Vérifie les permissions (rôles)       │
│                                             │
│  jwtInterceptor (désactivé pour l'instant)  │
│  └── Ajoute header Authorization: Bearer   │
└─────────────────────────────────────────────┘
        ↓
┌──────────────────────────────────────┐
│          ROUTES (app.routes.ts)      │
├──────────────────────────────────────┤
│  /login          → Public            │
│  /dashboard      → authGuard         │
│  /students       → authGuard + roleGuard(ADMIN, SECRETARY) │
│  /classes        → authGuard + roleGuard(ADMIN, TEACHER)   │
│  /attendance     → authGuard + roleGuard(ADMIN, TEACHER, SECRETARY) │
│  /grades         → authGuard + roleGuard(ADMIN, TEACHER)   │
│  /finance        → authGuard + roleGuard(ADMIN, ACCOUNTANT)│
│  /settings       → authGuard + roleGuard(ADMIN)            │
│  /parent-portal  → authGuard + roleGuard(PARENT)           │
└──────────────────────────────────────┘
```

---

## 🔌 Architecture Backend Spring Boot (À Venir)

### Layers Pattern

```
┌──────────────────────────────────────────────────┐
│               CONTROLLER LAYER                   │
│  StudentController, AuthController, ...          │
│  (Endpoints REST : @GetMapping, @PostMapping)    │
└───────────────┬──────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────────┐
│               SERVICE LAYER                      │
│  StudentService, AuthService, ...                │
│  (Logique métier, validation, transactions)      │
└───────────────┬──────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────────┐
│             REPOSITORY LAYER                     │
│  StudentRepository, ClassRepository, ...         │
│  (JPA / Spring Data - accès base de données)     │
└───────────────┬──────────────────────────────────┘
                ↓
┌──────────────────────────────────────────────────┐
│              DATABASE (MySQL)                    │
│  Tables: students, classes, attendance, ...      │
└──────────────────────────────────────────────────┘
```

### Spring Security + JWT Flow

```
┌────────────────────────────────────────────────────────┐
│  1. User sends credentials                            │
│     POST /api/auth/login                              │
│     { email, password }                               │
└─────────────────┬──────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│  2. Spring Security validates credentials               │
│     AuthenticationManager                               │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│  3. Generate JWT Token                                  │
│     JwtTokenProvider.generateToken()                    │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│  4. Return token to client                              │
│     { token, user, expiresIn }                          │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│  5. Client stores token (localStorage)                  │
│     Angular: AuthService.login()                        │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│  6. Subsequent requests include token                   │
│     GET /api/students                                   │
│     Header: Authorization: Bearer {token}               │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│  7. JwtAuthenticationFilter validates token             │
│     Extracts user from token                            │
│     Sets SecurityContext                                │
└─────────────────┬───────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────────────────────┐
│  8. Access granted to protected resource                │
│     Return: List<StudentDto>                            │
└─────────────────────────────────────────────────────────┘
```

---

## 📦 Modèle de Données (DTOs)

### Principales Entités

```
┌─────────────────┐       ┌─────────────────┐
│    Student      │───────│     Class       │
│                 │ N : 1 │                 │
│ - id            │       │ - id            │
│ - firstName     │       │ - name          │
│ - lastName      │       │ - level         │
│ - dateOfBirth   │       │ - capacity      │
│ - email         │       │ - mainTeacher   │
│ - classId       │       └─────────────────┘
│ - status        │               ↑
│ - enrollmentDate│               │ 1 : N
└─────────────────┘       ┌─────────────────┐
        │                 │    Subject      │
        │ 1 : N           │  (Matières)     │
        │                 │                 │
┌─────────────────┐       │ - id            │
│   Attendance    │       │ - name          │
│                 │       │ - code          │
│ - id            │       │ - coefficient   │
│ - studentId     │       └─────────────────┘
│ - date          │               ↑
│ - status        │               │ N : M
│ - arrivalTime   │               │
│ - method        │       ┌─────────────────┐
└─────────────────┘       │     Grade       │
        │                 │                 │
        │                 │ - id            │
        │ 1 : N           │ - studentId     │
┌─────────────────┐       │ - subjectId     │
│    Payment      │       │ - value         │
│                 │       │ - coefficient   │
│ - id            │       │ - examDate      │
│ - studentId     │       │ - status        │
│ - amount        │       └─────────────────┘
│ - paymentDate   │
│ - method        │
│ - status        │
└─────────────────┘
```

---

## 🔄 Workflow Complet (Frontend → Backend)

### Exemple : Créer un Élève

```
┌────────────────────────────────────────────────────────────┐
│  1. USER INPUT (Frontend Angular)                         │
│     Formulaire: Nouvel Élève                              │
│     → Remplir firstName, lastName, dateOfBirth, ...       │
└────────────────┬───────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────┐
│  2. COMPONENT (students.component.ts)                      │
│     onSubmit() {                                          │
│       this.studentService.create(studentDto)              │
│     }                                                      │
└────────────────┬───────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────┐
│  3. SERVICE (student.service.ts)                           │
│     create(dto): Observable<StudentDto> {                  │
│       return this.http.post<StudentDto>(                  │
│         '/api/students',                                   │
│         dto                                                │
│       )                                                    │
│     }                                                      │
└────────────────┬───────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────┐
│  4. HTTP REQUEST                                           │
│     POST http://localhost:8080/api/students                │
│     Headers: {                                             │
│       Content-Type: application/json,                      │
│       Authorization: Bearer {JWT_TOKEN}                    │
│     }                                                      │
│     Body: { firstName: "John", ... }                       │
└────────────────┬───────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────┐
│  5. BACKEND SPRING BOOT                                    │
│                                                            │
│     JwtAuthenticationFilter                                │
│     ├── Validate JWT                                       │
│     └── Set SecurityContext                                │
│                                                            │
│     StudentController                                      │
│     ├── @PostMapping                                       │
│     ├── @Valid @RequestBody StudentDto                     │
│     └── studentService.create(dto)                         │
│                                                            │
│     StudentService                                         │
│     ├── Validate business rules                            │
│     ├── mapper.toEntity(dto)                               │
│     └── repository.save(entity)                            │
│                                                            │
│     StudentRepository (JPA)                                │
│     └── INSERT INTO students ...                           │
└────────────────┬───────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────┐
│  6. HTTP RESPONSE                                          │
│     Status: 201 Created                                    │
│     Body: {                                                │
│       id: 5,                                               │
│       firstName: "John",                                   │
│       ...                                                  │
│       createdAt: "2026-01-05T10:30:00"                     │
│     }                                                      │
└────────────────┬───────────────────────────────────────────┘
                 ↓
┌────────────────────────────────────────────────────────────┐
│  7. FRONTEND (Angular) - Observable Subscribe              │
│     .subscribe({                                           │
│       next: (data) => {                                    │
│         // Update UI                                       │
│         // Show success message                            │
│         // Refresh list                                    │
│       },                                                   │
│       error: (err) => {                                    │
│         // Show error message                              │
│       }                                                    │
│     })                                                     │
└────────────────────────────────────────────────────────────┘
```

---

## 🔐 Gestion de la Sécurité

### Rôles & Permissions

```
┌──────────────────────────────────────────────────────────┐
│                        ROLES                             │
├──────────────────────────────────────────────────────────┤
│  ADMIN        → Accès complet (tous les modules)         │
│  TEACHER      → Dashboard, Classes, Notes, Assiduité     │
│  ACCOUNTANT   → Dashboard, Finance                       │
│  SECRETARY    → Élèves, Assiduité                        │
│  DIRECTOR     → Dashboard (lecture seule)                │
│  PARENT       → Portail Parents uniquement               │
└──────────────────────────────────────────────────────────┘

MATRICE D'ACCÈS:
                 Dashboard Students Classes Grades Attendance Finance Settings
ADMIN               ✓         ✓        ✓       ✓        ✓        ✓        ✓
TEACHER             ✓         ✗        ✓       ✓        ✓        ✗        ✗
ACCOUNTANT          ✓         ✗        ✗       ✗        ✗        ✓        ✗
SECRETARY           ✓         ✓        ✗       ✗        ✓        ✗        ✗
DIRECTOR            ✓         ✗        ✗       ✗        ✗        ✗        ✗
PARENT              ✗         ✗        ✗       ✗        ✗        ✗        ✗  (→ Portail)
```

---

## 📈 État du Projet

### Modules Complétés

| Module | Frontend | Backend | Integration |
|--------|----------|---------|-------------|
| Login | ✅ 100% | ⏳ 0% | ⏳ 0% |
| Dashboard | ✅ 100% | ⏳ 0% | ⏳ 0% |
| Students | ✅ 100% | ⏳ 0% | ⏳ 0% |
| Classes | ⏳ 20% | ⏳ 0% | ⏳ 0% |
| Attendance | ⏳ 20% | ⏳ 0% | ⏳ 0% |
| Grades | ⏳ 20% | ⏳ 0% | ⏳ 0% |
| Finance | ⏳ 20% | ⏳ 0% | ⏳ 0% |
| Settings | ⏳ 20% | ⏳ 0% | ⏳ 0% |
| Parent Portal | ⏳ 20% | ⏳ 0% | ⏳ 0% |

### Légende
- ✅ Complet et fonctionnel
- ⏳ En cours / À implémenter
- ❌ Bloqué

---

**Documentation technique complète - v1.0.0**
