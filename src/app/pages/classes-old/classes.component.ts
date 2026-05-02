import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { ClassService } from '../../services/api/class.service';
import { ClassDto, SubjectDto } from '../../models/dtos';

/**
 * Composant Classes - Gestion des classes et matières
 * 
 * Fonctionnalités :
 * - Liste des classes avec informations (niveau, capacité, enseignant)
 * - Gestion des matières par cycle
 * - Affichage des statistiques (taux de remplissage)
 */
@Component({
  selector: 'app-classes',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './classes.component.html',
  styleUrl: './classes.component.scss'
})
export class ClassesComponent implements OnInit {
  classes: ClassDto[] = [];
  subjects: SubjectDto[] = [];

  selectedTab: 'classes' | 'subjects' = 'classes';
  selectedCycle: string = 'all';
  searchTerm: string = '';
  isLoading: boolean = false;

  // Mock subjects data
  mockSubjects: SubjectDto[] = [
    { id: 1, name: 'Mathématiques', code: 'MATH', coefficient: 5, cycle: 'Lycée', status: 'ACTIVE' },
    { id: 2, name: 'Français', code: 'FR', coefficient: 4, cycle: 'Lycée', status: 'ACTIVE' },
    { id: 3, name: 'Physique-Chimie', code: 'PC', coefficient: 4, cycle: 'Lycée', status: 'ACTIVE' },
    { id: 4, name: 'SVT', code: 'SVT', coefficient: 3, cycle: 'Lycée', status: 'ACTIVE' },
    { id: 5, name: 'Histoire-Géo', code: 'HG', coefficient: 3, cycle: 'Lycée', status: 'ACTIVE' },
    { id: 6, name: 'Anglais', code: 'ANG', coefficient: 3, cycle: 'Lycée', status: 'ACTIVE' },
    { id: 7, name: 'Philosophie', code: 'PHILO', coefficient: 4, cycle: 'Lycée', status: 'ACTIVE' },
    { id: 8, name: 'EPS', code: 'EPS', coefficient: 2, cycle: 'Lycée', status: 'ACTIVE' }
  ];

  constructor(private classService: ClassService) { }

  ngOnInit(): void {
    this.loadClasses();
    this.subjects = this.mockSubjects;
  }

  loadClasses(): void {
    this.isLoading = true;
    this.classService.getAll().subscribe({
      next: (data) => {
        this.classes = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement classes:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredClasses(): ClassDto[] {
    let filtered = [...this.classes];

    if (this.searchTerm) {
      filtered = filtered.filter(c =>
        c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        c.level.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedCycle !== 'all') {
      filtered = filtered.filter(c => c.cycle === this.selectedCycle);
    }

    return filtered;
  }

  get filteredSubjects(): SubjectDto[] {
    if (!this.searchTerm) return this.subjects;

    return this.subjects.filter(s =>
      s.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      s.code.toLowerCase().includes(this.searchTerm.toLowerCase())
    );
  }

  calculateFillRate(classDto: ClassDto): number {
    if (!classDto.currentStudents || !classDto.capacity) return 0;
    return Math.round((classDto.currentStudents / classDto.capacity) * 100);
  }

  getFillRateColor(rate: number): string {
    if (rate >= 90) return 'success';
    if (rate >= 70) return 'warning';
    return 'info';
  }
}
