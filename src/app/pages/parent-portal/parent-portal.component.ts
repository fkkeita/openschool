import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolDataService, Eleve } from '../../core/services/school-data.service';

/**
 * Composant Parent Portal - Portail Parents
 * Interface dédiée aux parents pour suivre la scolarité de leurs enfants
 */
interface ChildData {
  id: number;
  name: string;
  firstName: string;
  lastName: string;
  className: string;
  photo: string;
  stats: {
    averageGrade: number;
    attendanceRate: number;
    payment: {
      montantTotal: number;
      montantPaye: number;
      reste: number;
    };
  };
  recentGrades: { subject: string; value: number; date: string }[];
  recentAbsences: { date: string; reason: string; justified: boolean }[];
}

@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './parent-portal.component.html',
  styleUrl: './parent-portal.component.scss'
})
export class ParentPortalComponent implements OnInit {
  children: ChildData[] = [];
  selectedChild: ChildData | null = null;
  currentSlide = 0;
  parentName = '';
  unreadMessages = 3;
  showNotifications = false;

  private authService = inject(AuthService);
  private schoolData = inject(SchoolDataService);

  constructor() { }

  ngOnInit(): void {
    this.loadChildrenFromService();
  }

  private loadChildrenFromService(): void {
    // Récupérer le parent connecté
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      // Le nom du parent est "Parent Durand" pour le compte parent@ecole.fr
      this.parentName = `${currentUser.firstName} ${currentUser.lastName}`;
    }
    
    // Pour la démo, on utilise "Fatoumata Traoré" car c'est le parent des 3 enfants
    const parentDemo = 'Fatoumata Traoré';
    const eleves = this.schoolData.getElevesParParent(parentDemo);
    
    this.children = eleves.map((eleve, index) => {
      // Données de paiement réalistes pour chaque enfant
      const montantTotal = 200000;
      const montantPaye = [150000, 180000, 200000][index] || 150000;
      const reste = montantTotal - montantPaye;
      
      return {
        id: eleve.id,
        name: `${eleve.prenom} ${eleve.nom}`,
        firstName: eleve.prenom,
        lastName: eleve.nom,
        className: eleve.classe || 'Non assignée',
        photo: this.getAvatarColor(eleve.prenom),
        stats: {
          averageGrade: Math.round((Math.random() * 5 + 10) * 10) / 10,
          attendanceRate: Math.floor(Math.random() * 15 + 85),
          payment: {
            montantTotal,
            montantPaye,
            reste
          }
        },
        recentGrades: this.generateRecentGrades(),
        recentAbsences: this.generateRecentAbsences()
      };
    });

    if (this.children.length > 0) {
      this.selectedChild = this.children[0];
      this.currentSlide = 0;
    }
  }

  private getAvatarColor(firstName: string): string {
    const colors = ['#667eea', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'];
    const index = firstName.charCodeAt(0) % colors.length;
    return colors[index];
  }

  private generateRecentGrades(): { subject: string; value: number; date: string }[] {
    const subjects = ['Mathématiques', 'Français', 'Anglais', 'Physique', 'Histoire-Géo', 'SVT'];
    const grades: { subject: string; value: number; date: string }[] = [];
    const nb = Math.floor(Math.random() * 3) + 2;
    
    for (let i = 0; i < nb; i++) {
      grades.push({
        subject: subjects[Math.floor(Math.random() * subjects.length)],
        value: Math.round((Math.random() * 8 + 10) * 10) / 10,
        date: this.getRandomDate()
      });
    }
    return grades;
  }

  private generateRecentAbsences(): { date: string; reason: string; justified: boolean }[] {
    const reasons = ['Maladie', 'Rendez-vous médical', 'Motif familial', 'Autre'];
    const absences: { date: string; reason: string; justified: boolean }[] = [];
    const nb = Math.floor(Math.random() * 2);
    
    for (let i = 0; i < nb; i++) {
      absences.push({
        date: this.getRandomDate(),
        reason: reasons[Math.floor(Math.random() * reasons.length)],
        justified: Math.random() > 0.3
      });
    }
    return absences;
  }

  private getRandomDate(): string {
    const start = new Date(2025, 9, 1);
    const end = new Date(2026, 4, 30);
    const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
    return date.toISOString().split('T')[0];
  }

  selectChild(child: ChildData): void {
    this.selectedChild = child;
    const index = this.children.findIndex(c => c.id === child.id);
    if (index !== -1) {
      this.currentSlide = index;
    }
  }

  nextSlide(): void {
    if (this.currentSlide < this.children.length - 1) {
      this.currentSlide++;
      this.selectedChild = this.children[this.currentSlide];
    }
  }

  prevSlide(): void {
    if (this.currentSlide > 0) {
      this.currentSlide--;
      this.selectedChild = this.children[this.currentSlide];
    }
  }

  goToSlide(index: number): void {
    this.currentSlide = index;
    this.selectedChild = this.children[index];
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }
}
