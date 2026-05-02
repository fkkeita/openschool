import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../auth/auth.service';

/**
 * HTTP Interceptor pour JWT - Functional Interceptor (Angular 21)
 * 
 * TODO Backend: Activer une fois que le backend Spring Boot est prêt
 * 
 * Ajoute automatiquement le header Authorization avec le token JWT
 * à toutes les requêtes HTTP vers l'API
 * 
 * Pour activer, décommenter dans app.config.ts:
 * provideHttpClient(
 *   withInterceptors([jwtInterceptor])
 * )
 */
export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getToken();

    // Si on a un token ET que la requête va vers notre API
    if (token && req.url.startsWith('/api/')) {
        // Clone la requête et ajoute le header Authorization
        const clonedReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}` // Format standard JWT
            }
        });
        return next(clonedReq);
    }

    // Pas de token ou requête externe: on laisse passer telle quelle
    return next(req);
};

/**
 * HTTP Interceptor pour la gestion des erreurs
 * 
 * Gère les erreurs HTTP courantes (401, 403, 500, etc.)
 */
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);

    return next(req);
    // TODO: Ajouter gestion d'erreurs sophistiquée
    // .pipe(
    //   catchError((error: HttpErrorResponse) => {
    //     if (error.status === 401) {
    //       // Token expiré ou invalide -> déconnexion
    //       authService.logout();
    //       window.location.href = '/login';
    //     }
    //     return throwError(() => error);
    //   })
    // );
};
