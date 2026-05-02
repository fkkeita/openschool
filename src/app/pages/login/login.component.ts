import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

/**
 * Composant Login - Conversion de login-screen.tsx
 * 
 * Interface de connexion avec:
 * - Sélection du rôle utilisateur
 * - Email & mot de passe
 * - Toggle affichage mot de passe
 * - Gestion des erreurs
 * 
 * États React → Angular:
 * - useState → propriétés de classe
 * - onLogin prop → méthode login()
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.scss'
})
export class LoginComponent {
    // États du formulaire (équivalents useState React)
    email: string = '';
    password: string = '';
    showPassword: boolean = false;
    selectedRole: string = 'ADMIN';

    // États UI
    isLoading: boolean = false;
    errorMessage: string = '';

    // Roles disponibles
    roles = [
        { value: 'ADMIN', label: 'Administrateur Principal' },
        { value: 'TEACHER', label: 'Enseignant' },
        { value: 'ACCOUNTANT', label: 'Comptable / Caissier' },
        { value: 'SECRETARY', label: 'Secrétariat / Surveillant' },
        { value: 'DIRECTOR', label: 'Direction' },
        { value: 'PARENT', label: 'Parent (Espace en ligne)' }
    ];

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    /**
     * Gestion de la soumission du formulaire
     * Équivalent de handleSubmit en React
     */
    onSubmit(): void {
        // Reset de l'erreur
        this.errorMessage = '';

        // Validation simple
        if (!this.email || !this.password) {
            this.errorMessage = 'Veuillez remplir tous les champs';
            return;
        }

        this.isLoading = true;

        // Appel au service d'authentification
        this.authService.login({
            email: this.email,
            password: this.password
        }).subscribe({
            next: (response) => {
                this.isLoading = false;

                // Redirection selon le rôle
                if (response.user.role === 'PARENT') {
                    this.router.navigate(['/parent-portal']);
                } else {
                    this.router.navigate(['/dashboard']);
                }
            },
            error: (error) => {
                this.isLoading = false;
                this.errorMessage = error.message || 'Une erreur est survenue';
            }
        });
    }

    /**
     * Toggle affichage du mot de passe
     */
    togglePasswordVisibility(): void {
        this.showPassword = !this.showPassword;
    }
}
