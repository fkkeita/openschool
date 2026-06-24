import { Routes } from '@angular/router';
import { authGuard, roleGuard } from './core/guards/auth.guard';

/**
 * Configuration du routing principal
 * 
 * Architecture:
 * - /login: Page de connexion (publique)
 * - /dashboard: Tableau de bord (authentifié)
 * - /students: Gestion élèves (roles: ADMIN, SECRETARY)
 * - /classes: Gestion classes (roles: ADMIN, TEACHER)
 * - /attendance: Assiduité (roles: ADMIN, TEACHER, SECRETARY)
 * - /grades: Notes (roles: ADMIN, TEACHER)
 * - /finance: Finance (roles: ADMIN, ACCOUNTANT)
 * - /settings: Paramètres (role: ADMIN)
 * - /parent-portal: Portail parents (role: PARENT)
 * - /unauthorized: Page non autorisé
 * 
 * TODO: Ajouter les composants quand ils seront créés
 */
export const routes: Routes = [
    {
        path: '',
        redirectTo: '/dashboard',
        pathMatch: 'full'
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard.component').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'students',
        loadComponent: () => import('./pages/students/students.component').then(m => m.StudentsComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'SECRETARY'] }
    },
    {
        path: 'teachers',
        loadComponent: () => import('./pages/teachers/teachers.component').then(m => m.TeachersComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'DIRECTOR'] }
    },
    {
        path: 'cahier-de-texte',
        loadComponent: () => import('./pages/teachers/cahier-de-texte/cahier-de-texte.component').then(m => m.CahierDeTexteComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'DIRECTOR'] }
    },
    {
        path: 'timetable',
        loadComponent: () => import('./pages/timetable/timetable.component').then(m => m.TimetableComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'DIRECTOR'] }
    },
    {
        path: 'matieres',
        loadComponent: () => import('./pages/matieres/matieres.component').then(m => m.MatieresComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'DIRECTOR'] }
    },
    {
        path: 'classes',
        loadComponent: () => import('./pages/classes/classes.component').then(m => m.ClassesComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'TEACHER'] }
    },
    {
        path: 'attendance',
        loadComponent: () => import('./pages/attendance/attendance.component').then(m => m.AttendanceComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'TEACHER', 'SECRETARY'] }
    },
    {
        path: 'grades',
        loadComponent: () => import('./pages/notes/notes.component').then(m => m.NotesComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'TEACHER'] }
    },
    {
        path: 'finance',
        loadComponent: () => import('./pages/finance/finance.component').then(m => m.FinanceComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN', 'ACCOUNTANT'] }
    },
    {
        path: 'settings',
        loadComponent: () => import('./pages/settings/settings.component').then(m => m.SettingsComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['ADMIN'] }
    },
    {
        path: 'parent-portal',
        loadComponent: () => import('./pages/parent-portal/parent-portal.component').then(m => m.ParentPortalComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['PARENT'] }
    },
    {
        path: 'teacher-portal',
        loadComponent: () => import('./pages/teacher-portal/teacher-portal.component').then(m => m.TeacherPortalComponent),
        canActivate: [authGuard, roleGuard],
        data: { roles: ['TEACHER'] }
    },
    {
        path: 'unauthorized',
        loadComponent: () => import('./pages/unauthorized/unauthorized.component').then(m => m.UnauthorizedComponent)
    },
    {
        path: '**',
        redirectTo: '/dashboard'
    }
];
