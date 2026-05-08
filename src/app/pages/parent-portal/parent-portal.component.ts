import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';
import { SchoolDataService } from '../../core/services/school-data.service';

/**
 * Composant Parent Portal - Portail Parents
 * Interface dédiée aux parents pour suivre la scolarité de leurs enfants
 */
@Component({
  selector: 'app-parent-portal',
  standalone: true,
  imports: [CommonModule, SidebarComponent],
  templateUrl: './parent-portal.component.html',
  styleUrl: './parent-portal.component.scss'
})
export class ParentPortalComponent implements OnInit {
  children: any[] = [];
  selectedChild: any = null;

  private authService = inject(AuthService);
  private schoolData = inject(SchoolDataService);

  constructor() { }

  ngOnInit(): void {
    this.loadChildrenFromService();
  }

  private loadChildrenFromService(): void {
    const tousEleves = this.schoolData.tousLesEleves;
    this.children = tousEleves.map(eleve => ({
      id: eleve.id,
      name: `${eleve.prenom} ${eleve.nom}`,
      className: eleve.classe || 'Non assignée',
      stats: {
        averageGrade: 0,
        attendanceRate: 100,
        pendingPayments: 0
      },
      recentGrades: [],
      recentAbsences: []
    }));

    if (this.children.length > 0) {
      this.selectedChild = this.children[0];
    }
  }

  selectChild(child: any): void {
    this.selectedChild = child;
  }
}
