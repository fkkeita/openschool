import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { StudentService } from '../../services/api/student.service';
import { AttendanceService } from '../../services/api/attendance.service';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardStatsDto } from '../../models/dtos';

/**
 * Composant Dashboard - Conversion de dashboard.tsx
 * 
 * Tableau de bord principal avec:
 * - Statistiques clés (KPI cards)
 * - Graphiques (à implémenter avec librairie charts)
 * - Alertes et notifications
 * - Activité récente
 * 
 * Conversion React → Angular:
 * - Composants de graphiques Recharts → À remplacer par ng2-charts ou ngx-charts
 * - Mock data → Services Angular avec Observables
 */
interface DashboardAlert {
    id: number;
    type: 'absence' | 'payment' | 'grade';
    message: string;
    count: number;
    severity: 'error' | 'warning' | 'info';
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, SidebarComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
    // États pour le dashboard
    stats: DashboardStatsDto = {
        totalStudents: 524,
        presentToday: 482,
        absentToday: 15,
        lateToday: 27,
        attendanceRate: 92,
        unpaidAmount: 8230,
        pendingGrades: 12
    };

    alerts: DashboardAlert[] = [
        {
            id: 1,
            type: 'absence',
            message: 'Élèves absents aujourd\'hui',
            count: 15,
            severity: 'error'
        },
        {
            id: 2,
            type: 'payment',
            message: 'Paiements en retard à traiter',
            count: 3,
            severity: 'warning'
        },
        {
            id: 3,
            type: 'grade',
            message: 'Notes en attente de validation',
            count: 12,
            severity: 'info'
        }
    ];

    latestPayments = [
        { name: 'Durand Sophie', amount: 350 },
        { name: 'Koné Amadou', amount: 200 },
        { name: 'Martin Lucas', amount: 400 }
    ];

    recentActivity = [
        {
            type: 'absence',
            message: 'Absence : Jean Dupont',
            time: '08:30',
            status: 'Retard'
        },
        {
            type: 'grade',
            message: 'Note : Math - Classe 4B',
            time: '10:15',
            status: 'Ajoutée'
        },
        {
            type: 'payment',
            message: 'Paiement : Léa Bernard - 150,00 €',
            time: '14:20',
            status: 'Enregistré'
        }
    ];

    isLoading: boolean = true;

    constructor(
        private studentService: StudentService,
        private attendanceService: AttendanceService,
        private router: Router,
        private authService: AuthService
    ) { }

    ngOnInit(): void {
        this.redirectByRole();
        this.loadDashboardData();
    }

    private redirectByRole(): void {
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
            if (currentUser.role === 'TEACHER') {
                this.router.navigate(['/teacher-portal']);
                return;
            }
            if (currentUser.role === 'PARENT') {
                this.router.navigate(['/parent-portal']);
                return;
            }
        }
    }

    /**
     * Charge les données du dashboard depuis les services
     * TODO Backend: Créer un endpoint /api/dashboard/stats
     */
    loadDashboardData(): void {
        this.isLoading = true;

        // Simulation de chargement de données
        // En production, appeler le service dashboard
        setTimeout(() => {
            this.isLoading = false;
        }, 1000);

        // Exemple d'appel à un service (optionnel)
        // this.studentService.getAll().subscribe(students => {
        //   this.stats.totalStudents = students.length;
        // });
    }

    /**
     * Obtient la classe CSS pour l'icône de statut
     */
    getActivityIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'absence': 'person_off',
            'grade': 'assignment',
            'payment': 'payment'
        };
        return icons[type] || 'info';
    }

    /**
     * Obtient la classe CSS pour la couleur de l'icône
     */
    getActivityColor(type: string): string {
        const colors: { [key: string]: string } = {
            'absence': 'error',
            'grade': 'info',
            'payment': 'success'
        };
        return colors[type] || 'info';
    }
}
