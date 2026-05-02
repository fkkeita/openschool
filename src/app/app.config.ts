import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptors } from '@angular/common/http';

import { routes } from './app.routes';
// import { jwtInterceptor } from './core/interceptors/jwt.interceptor'; // TODO: Activer quand backend prêt

/**
 * Configuration principale de l'application Angular
 * 
 * Providers:
 * - Router avec les routes définies
 * - Animations Material
 * - HttpClient pour les appels API
 * - Interceptors JWT (à activer plus tard)
 */
export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideAnimationsAsync(),
        provideHttpClient(
            // TODO Backend: Décommenter quand le backend est prêt
            // withInterceptors([jwtInterceptor])
        )
    ]
};
