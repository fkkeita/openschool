import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Composant racine de l'application
 * 
 * Simple container avec router-outlet
 * Tout le rendu se fait via les composants de page
 */
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: `
    <router-outlet></router-outlet>
  `,
    styles: [`
    :host {
      display: block;
      width: 100%;
      height: 100%;
    }
  `]
})
export class AppComponent {
    title = 'École Excellence - Gestion Scolaire';
}
