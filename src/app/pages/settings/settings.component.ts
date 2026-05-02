import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';

/**
 * Composant Settings - Configuration de l'application
 */
@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  selectedTab: 'general' | 'users' | 'security' | 'notifications' = 'general';

  // Settings généraux
  schoolSettings = {
    name: 'École Excellence',
    address: '123 Avenue de l\'Éducation',
    city: 'Paris',
    zipCode: '75001',
    phone: '+33 1 23 45 67 89',
    email: 'contact@ecole-excellence.fr',
    website: 'www.ecole-excellence.fr',
    academicYear: '2025-2026'
  };

  // Users mock
  users = [
    { id: 1, name: 'Admin Principal', email: 'admin@ecole.fr', role: 'ADMIN', status: 'ACTIVE' },
    { id: 2, name: 'Prof. Martin', email: 'enseignant@ecole.fr', role: 'TEACHER', status: 'ACTIVE' },
    { id: 3, name: 'Secrétaire', email: 'secretariat@ecole.fr', role: 'SECRETARY', status: 'ACTIVE' }
  ];

  // Notifications
  notificationSettings = {
    emailAlerts: true,
    smsAlerts: false,
    absenceNotifications: true,
    gradeNotifications: true,
    paymentReminders: true
  };

  saveSettings(): void {
    console.log('Sauvegarde des paramètres...');
    alert('Paramètres sauvegardés avec succès !');
  }
}
