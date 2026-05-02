import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { AttendanceService } from '../../services/api/attendance.service';
import { AttendanceDto } from '../../models/dtos';

/**
 * Composant Attendance - Gestion de l'assiduité
 * 
 * Fonctionnalités :
 * - Vue du jour avec marquage présence/absence/retard
 * - Historique des présences
 * - Statistiques par élève et par classe
 * - Filtres par date et statut
 */
@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './attendance.component.html',
  styleUrl: './attendance.component.scss'
})
export class AttendanceComponent implements OnInit {
  attendanceList: AttendanceDto[] = [];
  selectedDate: string = new Date().toISOString().split('T')[0];
  selectedStatus: string = 'all';
  searchTerm: string = '';
  isLoading: boolean = false;

  stats = {
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    total: 0
  };

  constructor(private attendanceService: AttendanceService) { }

  ngOnInit(): void {
    this.loadAttendance();
  }

  loadAttendance(): void {
    this.isLoading = true;
    this.attendanceService.getByDate(this.selectedDate).subscribe({
      next: (data) => {
        this.attendanceList = data;
        this.calculateStats();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement assiduité:', err);
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.attendanceList.length;
    this.stats.present = this.attendanceList.filter(a => a.status === 'PRESENT').length;
    this.stats.absent = this.attendanceList.filter(a => a.status === 'ABSENT').length;
    this.stats.late = this.attendanceList.filter(a => a.status === 'LATE').length;
    this.stats.excused = this.attendanceList.filter(a => a.status === 'EXCUSED').length;
  }

  get filteredAttendance(): AttendanceDto[] {
    let filtered = [...this.attendanceList];

    if (this.searchTerm) {
      filtered = filtered.filter(a =>
        a.studentName?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(a => a.status === this.selectedStatus);
    }

    return filtered;
  }

  onDateChange(): void {
    this.loadAttendance();
  }

  getStatusIcon(status: string): string {
    const icons: { [key: string]: string } = {
      'PRESENT': 'check_circle',
      'ABSENT': 'cancel',
      'LATE': 'schedule',
      'EXCUSED': 'event_busy'
    };
    return icons[status] || 'help';
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'PRESENT': 'success',
      'ABSENT': 'error',
      'LATE': 'warning',
      'EXCUSED': 'info'
    };
    return colors[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'PRESENT': 'Présent',
      'ABSENT': 'Absent',
      'LATE': 'Retard',
      'EXCUSED': 'Justifié'
    };
    return labels[status] || status;
  }
}
