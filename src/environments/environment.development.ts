/**
 * Configuration Environnement - Development
 * 
 * TODO Backend: Changer apiBaseUrl quand le backend Spring Boot sera déployé
 * Ex: http://localhost:8080 pour développement local
 * Ex: https://api.ecole-excellence.fr pour production
 */
export const environment = {
    production: false,
    apiBaseUrl: '/api', // TODO: Remplacer par l'URL du backend Spring Boot
    appName: 'École Excellence',
    appVersion: '1.0.0'
};
