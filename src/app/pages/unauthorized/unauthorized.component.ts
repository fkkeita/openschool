import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

/**
 * Page Unauthorized - Accès non autorisé
 * Affichée quand l'utilisateur n'a pas les permissions nécessaires
 */
@Component({
    selector: 'app-unauthorized',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="error-page">
      <div class="error-content">
        <span class="material-icons error-icon">block</span>
        <h1>Accès Non Autorisé</h1>
        <p>Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        <button (click)="goBack()" class="btn">
          <span class="material-icons">arrow_back</span>
          Retour
        </button>
      </div>
    </div>
  `,
    styles: [`
    .error-page {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: var(--color-bg-secondary);
      padding: var(--spacing-xl);
    }

    .error-content {
      text-align: center;
      max-width: 500px;

      .error-icon {
        font-size: 80px;
        color: var(--color-error);
        margin-bottom: var(--spacing-lg);
      }

      h1 {
        font-size: var(--font-size-3xl);
        margin-bottom: var(--spacing-md);
      }

      p {
        color: var(--color-text-secondary);
        margin-bottom: var(--spacing-xl);
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-sm);
        background-color: var(--color-primary);
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: var(--radius-md);
        border: none;
        cursor: pointer;
        font-weight: 500;
        transition: background-color var(--transition-fast);

        &:hover {
          background-color: var(--color-primary-dark);
        }
      }
    }
  `]
})
export class UnauthorizedComponent {
    constructor(private router: Router) { }

    goBack(): void {
        this.router.navigate(['/dashboard']);
    }
}
