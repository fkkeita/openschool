import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolDataService } from '../../core/services/school-data.service';

interface ClasseData {
  id: number;
  nom: string;
  niveau: string;
  photo: string;
  stats: {
    nombreEleves: number;
    moyenneClasse: number;
    presenceRate: number;
  };
  matieres: string[];
  prochainCours: { matiere: string; heure: string } | null;
}

@Component({
  selector: 'app-teacher-portal',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './teacher-portal.component.html',
  styleUrl: './teacher-portal.component.scss'
})
export class TeacherPortalComponent implements OnInit {
  classes: ClasseData[] = [];
  selectedClasse: ClasseData | null = null;
  currentSlide = 0;
  teacherName = '';
  unreadMessages = 2;
  showNotifications = false;

  private authService = inject(AuthService);
  private schoolData = inject(SchoolDataService);

  constructor() { }

  ngOnInit(): void {
    this.loadClassesFromService();
  }

  private loadClassesFromService(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.teacherName = `${currentUser.firstName} ${currentUser.lastName}`;
    }

    // Mock data for teacher with 3 classes
    this.classes = [
      {
        id: 1,
        nom: '1ère Année A',
        niveau: '1ère Année',
        photo: '#667eea',
        stats: {
          nombreEleves: 24,
          moyenneClasse: 12.5,
          presenceRate: 92
        },
        matieres: ['Mathématiques', 'Physique'],
        prochainCours: { matiere: 'Mathématiques', heure: '08:00' }
      },
      {
        id: 2,
        nom: 'Terminale A',
        niveau: 'Terminale',
        photo: '#f59e0b',
        stats: {
          nombreEleves: 18,
          moyenneClasse: 14.2,
          presenceRate: 95
        },
        matieres: ['Mathématiques', 'Physique'],
        prochainCours: { matiere: 'Physique', heure: '10:00' }
      },
      {
        id: 3,
        nom: '2nde Année B',
        niveau: '2nde Année',
        photo: '#10b981',
        stats: {
          nombreEleves: 22,
          moyenneClasse: 11.8,
          presenceRate: 88
        },
        matieres: ['Mathématiques'],
        prochainCours: { matiere: 'Mathématiques', heure: '14:00' }
      }
    ];

    if (this.classes.length > 0) {
      this.selectedClasse = this.classes[0];
      this.currentSlide = 0;
    }
  }

  selectClasse(classe: ClasseData): void {
    this.selectedClasse = classe;
    const index = this.classes.findIndex(c => c.id === classe.id);
    if (index !== -1) {
      this.currentSlide = index;
    }
  }

  nextSlide(): void {
    if (this.currentSlide < this.classes.length - 1) {
      this.currentSlide++;
      this.selectedClasse = this.classes[this.currentSlide];
    }
  }

  prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.selectedClasse = this.classes[this.currentSlide];
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.selectedClasse = this.classes[index];
  }

  getInitials(nom: string): string {
    const parts = nom.split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
    }
    return nom.substring(0, 2).toUpperCase();
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }
}