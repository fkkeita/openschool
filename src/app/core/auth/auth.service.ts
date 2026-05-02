import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of, throwError, delay } from 'rxjs';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { UserDto, LoginRequestDto, LoginResponseDto } from '../../models/dtos';

/**
 * Service d'authentification - Architecture JWT Ready
 * 
 * TODO Backend Spring Boot:
 * - Implémenter POST /api/auth/login avec JWT
 * - Implémenter POST /api/auth/refresh pour renouveler le token
 * - Implémenter POST /api/auth/logout
 * - Implémenter sécurité Spring Security + JWT
 * 
 * Ce service est prêt pour JWT:
 * - Stockage du token dans localStorage
 * - Headers Authorization automatiques (via interceptor à créer)
 * - Gestion de l'expiration du token
 * - Refresh automatique du token
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private readonly API_URL = '/api/auth';
    private readonly TOKEN_KEY = 'auth_token';
    private readonly USER_KEY = 'current_user';

    // BehaviorSubject pour gérer l'état de connexion de manière réactive
    private currentUserSubject: BehaviorSubject<UserDto | null>;
    public currentUser$: Observable<UserDto | null>;

    private isAuthenticatedSubject: BehaviorSubject<boolean>;
    public isAuthenticated$: Observable<boolean>;

    // Mock users pour simulation
    private mockUsers: UserDto[] = [
        {
            id: 1,
            email: 'admin@ecole.fr',
            firstName: 'Admin',
            lastName: 'Principal',
            role: 'ADMIN',
            status: 'ACTIVE'
        },
        {
            id: 2,
            email: 'enseignant@ecole.fr',
            firstName: 'Jean',
            lastName: 'Professeur',
            role: 'TEACHER',
            status: 'ACTIVE'
        },
        {
            id: 3,
            email: 'parent@ecole.fr',
            firstName: 'Parent',
            lastName: 'Durand',
            role: 'PARENT',
            status: 'ACTIVE'
        }
    ];

    constructor() {
        // Récupération de l'utilisateur stocké au démarrage
        const storedUser = localStorage.getItem(this.USER_KEY);
        const user = storedUser ? JSON.parse(storedUser) : null;

        this.currentUserSubject = new BehaviorSubject<UserDto | null>(user);
        this.currentUser$ = this.currentUserSubject.asObservable();

        this.isAuthenticatedSubject = new BehaviorSubject<boolean>(!!user);
        this.isAuthenticated$ = this.isAuthenticatedSubject.asObservable();
    }

    /**
     * Connexion utilisateur
     * TODO Backend: Remplacer par HttpClient.post<LoginResponseDto>(`${this.API_URL}/login`, credentials)
     * 
     * @param credentials Email et mot de passe
     * @returns Observable avec token JWT et infos utilisateur
     */
    login(credentials: LoginRequestDto): Observable<LoginResponseDto> {
        // Simulation de connexion (accepte n'importe quel mot de passe pour la démo)
        const user = this.mockUsers.find(u => u.email === credentials.email);

        if (!user) {
            return throwError(() => new Error('Email ou mot de passe incorrect')).pipe(delay(500));
        }

        // Simulation d'une réponse backend avec JWT
        const response: LoginResponseDto = {
            token: 'mock_jwt_token_' + Date.now(), // TODO Backend: Vrai JWT
            user: user,
            expiresIn: 3600 // 1 heure
        };

        return of(response).pipe(
            delay(800), // Simulation latence réseau
            tap(res => {
                // Stockage du token et de l'utilisateur
                if (res.token) {
                    localStorage.setItem(this.TOKEN_KEY, res.token);
                }
                localStorage.setItem(this.USER_KEY, JSON.stringify(res.user));

                // Mise à jour des observables
                this.currentUserSubject.next(res.user);
                this.isAuthenticatedSubject.next(true);
            })
        );
    }

    /**
     * Déconnexion
     * TODO Backend: HttpClient.post<void>(`${this.API_URL}/logout`, {})
     */
    logout(): Observable<boolean> {
        // Nettoyage du stockage
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);

        // Mise à jour des observables
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);

        return of(true).pipe(delay(300));
    }

    /**
     * Récupère l'utilisateur connecté (valeur actuelle)
     */
    get currentUserValue(): UserDto | null {
        return this.currentUserSubject.value;
    }

    /**
     * Récupère le token JWT
     * TODO Backend: Utiliser ce token dans l'interceptor HTTP
     */
    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    /**
     * Vérifie si l'utilisateur est authentifié
     */
    isAuthenticated(): boolean {
        return this.isAuthenticatedSubject.value;
    }

    /**
     * Vérifie si l'utilisateur a un rôle spécifique
     * Utile pour les guards et directives
     */
    hasRole(role: string): boolean {
        const user = this.currentUserValue;
        return user ? user.role === role : false;
    }

    /**
     * Vérifie si l'utilisateur a l'un des rôles donnés
     */
    hasAnyRole(roles: string[]): boolean {
        const user = this.currentUserValue;
        return user ? roles.includes(user.role) : false;
    }

    /**
     * Rafraîchit le token JWT
     * TODO Backend: Implémenter POST /api/auth/refresh
     */
    refreshToken(): Observable<string> {
        // Simulation
        const newToken = 'refreshed_token_' + Date.now();
        localStorage.setItem(this.TOKEN_KEY, newToken);
        return of(newToken).pipe(delay(300));
    }
}
