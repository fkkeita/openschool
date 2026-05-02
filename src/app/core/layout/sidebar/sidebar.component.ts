import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../auth/auth.service';
import { UserDto } from '../../../models/dtos';

/**
 * Composant Sidebar - Conversion de sidebar.tsx
 * 
 * Menu latéral de navigation avec:
 * - Logo de l'école
 * - Menu filtré par rôle utilisateur
 * - Informations utilisateur
 * - Bouton de déconnexion
 * 
 * Conversion React → Angular:
 * - Props → @Input() (non utilisé ici, routing direct)
 * - filteredItems calculé via getter
 */
interface MenuItem {
    id: string;
    label: string;
    icon: string;
    route: string;
    roles: string[];
}

@Component({
    selector: 'app-sidebar',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './sidebar.component.html',
    styleUrl: './sidebar.component.scss'
})
export class SidebarComponent implements OnInit {
    currentUser: UserDto | null = null;

    // Menu items avec routes et icônes Material Icons
    menuItems: MenuItem[] = [
        {
            id: 'dashboard',
            label: 'Tableau de Bord',
            icon: 'dashboard',
            route: '/dashboard',
            roles: ['ADMIN', 'TEACHER', 'ACCOUNTANT', 'SECRETARY', 'DIRECTOR']
        },
        {
            id: 'students',
            label: 'Élèves',
            icon: 'people',
            route: '/students',
            roles: ['ADMIN', 'SECRETARY']
        },
        {
            id: 'teachers',
            label: 'Enseignants',
            icon: 'school',
            route: '/teachers',
            roles: ['ADMIN', 'DIRECTOR']
        },
        {
            id: 'cahier-de-texte',
            label: 'Cahier de Texte',
            icon: 'history_edu',
            route: '/cahier-de-texte',
            roles: ['ADMIN', 'DIRECTOR']
        },
        {
            id: 'timetable',
            label: 'Emploi du temps',
            icon: 'calendar_today',
            route: '/timetable',
            roles: ['ADMIN', 'DIRECTOR']
        },
        {
            id: 'matieres',
            label: 'Matières',
            icon: 'menu_book',
            route: '/matieres',
            roles: ['ADMIN', 'DIRECTOR']
        },
        {
            id: 'classes',
            label: 'Classes',
            icon: 'school',
            route: '/classes',
            roles: ['ADMIN', 'TEACHER']
        },
        {
            id: 'grades',
            label: 'Notes',
            icon: 'assignment',
            route: '/grades',
            roles: ['ADMIN', 'TEACHER']
        },
        {
            id: 'attendance',
            label: 'Assiduité',
            icon: 'fact_check',
            route: '/attendance',
            roles: ['ADMIN', 'TEACHER', 'SECRETARY']
        },
        {
            id: 'finance',
            label: 'Finance',
            icon: 'account_balance_wallet',
            route: '/finance',
            roles: ['ADMIN', 'ACCOUNTANT']
        },
        {
            id: 'settings',
            label: 'Paramètres',
            icon: 'settings',
            route: '/settings',
            roles: ['ADMIN']
        }
    ];

    constructor(
        private authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Souscription à l'utilisateur connecté
        this.authService.currentUser$.subscribe(user => {
            this.currentUser = user;
        });
    }

    /**
     * Filtre les items du menu selon le rôle de l'utilisateur
     * Équivalent de filteredItems en React
     */
    get filteredMenuItems(): MenuItem[] {
        if (!this.currentUser) {
            return [];
        }
        return this.menuItems.filter(item =>
            item.roles.includes(this.currentUser!.role)
        );
    }

    /**
     * Déconnexion de l'utilisateur
     */
    logout(): void {
        this.authService.logout().subscribe(() => {
            this.router.navigate(['/login']);
        });
    }

    /**
     * Obtient les initiales de l'utilisateur pour l'avatar
     */
    getUserInitials(): string {
        if (!this.currentUser) return '';
        const first = this.currentUser.firstName.charAt(0);
        const last = this.currentUser.lastName.charAt(0);
        return (first + last).toUpperCase();
    }
}
