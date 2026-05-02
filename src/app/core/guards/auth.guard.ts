import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Guard d'authentification - Functional Guard (Angular 21)
 * 
 * Protège les routes qui nécessitent une authentification
 * Redirige vers /login si l'utilisateur n'est pas connecté
 * 
 * Usage dans les routes:
 * { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] }
 */
export const authGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (authService.isAuthenticated()) {
        return true;
    }

    // Redirection vers login avec l'URL de retour
    router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
    return false;
};

/**
 * Guard basé sur les rôles - Functional Guard
 * 
 * Protège les routes selon le rôle de l'utilisateur
 * 
 * Usage:
 * { 
 *   path: 'admin', 
 *   component: AdminComponent, 
 *   canActivate: [roleGuard],
 *   data: { roles: ['ADMIN'] }
 * }
 */
export const roleGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.isAuthenticated()) {
        router.navigate(['/login']);
        return false;
    }

    // Récupération des rôles autorisés depuis les données de la route
    const allowedRoles = route.data['roles'] as string[];

    if (!allowedRoles || allowedRoles.length === 0) {
        return true; // Pas de restriction de rôle
    }

    // Vérification si l'utilisateur a l'un des rôles autorisés
    if (authService.hasAnyRole(allowedRoles)) {
        return true;
    }

    // Redirection vers page non autorisée
    router.navigate(['/unauthorized']);
    return false;
};
