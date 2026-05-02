import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { AuthService } from '../../core/auth/auth.service';

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

  constructor(private authService: AuthService) { }

  ngOnInit(): void {
    // Mock data pour les enfants
    this.children = [
      {
        id: 1,
        name: 'Sophie Durand',
        className: 'Terminale A',
        photo: 'assets/avatar1.png',
        stats: {
          averageGrade: 14.5,
          attendanceRate: 95,
          pendingPayments: 0
        },
        recentGrades: [
          { subject: 'Mathématiques', value: 16.5, date: '2026-01-15' },
          { subject: 'Français', value: 14, date: '2026-01-18' },
          { subject: 'Physique', value: 15, date: '2026-01-12' }
        ],
        recentAbsences: [
          { date: '2026-01-10', reason: 'Maladie', justified: true }
        ]
      }
    ];

    if (this.children.length > 0) {
      this.selectedChild = this.children[0];
    }
  }

  selectChild(child: any): void {
    this.selectedChild = child;
  }
}
