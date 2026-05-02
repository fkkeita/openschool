import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { StudentDto } from '../../models/dtos';

/**
 * Service Student - Architecture REST Ready
 * 
 * TODO Backend Spring Boot:
 * - Ce service est prêt à être branché sur une API REST
 * - Les URLs sont déjà définies
 * - Il suffit de remplacer les `of(mockData)` par des appels HttpClient
 * 
 * Endpoints REST à implémenter côté backend:
 * - GET    /api/students          -> getAll()
 * - GET    /api/students/{id}     -> getById(id)
 * - POST   /api/students          -> create(student)
 * - PUT    /api/students/{id}     -> update(id, student)
 * - DELETE /api/students/{id}     -> delete(id)
 */
@Injectable({
    providedIn: 'root'
})
export class StudentService {
    // TODO Backend: Injecter environment.apiBaseUrl
    private readonly API_URL = '/api/students';

    // Données mockées pour simulation
    private mockStudents: StudentDto[] = [
        {
            id: 1,
            firstName: 'Sophie',
            lastName: 'Durand',
            dateOfBirth: '2006-03-15',
            email: 'sophie.durand@email.fr',
            phone: '0601020304',
            classId: 1,
            className: 'Terminale A',
            status: 'ACTIVE',
            enrollmentDate: '2023-09-01',
            parentName: 'M. Durand',
            parentPhone: '0601020305',
            parentEmail: 'durand.parent@email.fr',
            averageGrade: 14.5,
            attendanceRate: 95
        },
        {
            id: 2,
            firstName: 'Lucas',
            lastName: 'Martin',
            dateOfBirth: '2008-07-22',
            email: 'lucas.martin@email.fr',
            phone: '0601020306',
            classId: 2,
            className: 'Première B',
            status: 'ACTIVE',
            enrollmentDate: '2023-09-01',
            parentName: 'Mme Martin',
            parentPhone: '0601020307',
            parentEmail: 'martin.parent@email.fr',
            averageGrade: 12.8,
            attendanceRate: 92
        },
        {
            id: 3,
            firstName: 'Amadou',
            lastName: 'Koné',
            dateOfBirth: '2009-11-05',
            email: 'amadou.kone@email.fr',
            classId: 3,
            className: 'Seconde C',
            status: 'ACTIVE',
            enrollmentDate: '2023-09-01',
            parentName: 'M. Koné',
            parentPhone: '0601020308',
            averageGrade: 13.2,
            attendanceRate: 94
        },
        {
            id: 4,
            firstName: 'Léa',
            lastName: 'Bernard',
            dateOfBirth: '2007-01-18',
            classId: 1,
            className: 'Terminale A',
            status: 'ACTIVE',
            enrollmentDate: '2023-09-01',
            averageGrade: 15.1,
            attendanceRate: 97
        }
    ];

    constructor() { }

    /**
     * Récupère tous les étudiants
     * TODO Backend: Remplacer par HttpClient.get<StudentDto[]>(this.API_URL)
     */
    getAll(): Observable<StudentDto[]> {
        return of(this.mockStudents).pipe(delay(500)); // Simulation latence réseau
    }

    /**
     * Récupère un étudiant par ID
     * TODO Backend: Remplacer par HttpClient.get<StudentDto>(`${this.API_URL}/${id}`)
     */
    getById(id: number): Observable<StudentDto | undefined> {
        const student = this.mockStudents.find(s => s.id === id);
        return of(student).pipe(delay(300));
    }

    /**
     * Crée un nouvel étudiant
     * TODO Backend: Remplacer par HttpClient.post<StudentDto>(this.API_URL, student)
     */
    create(student: StudentDto): Observable<StudentDto> {
        const newStudent = {
            ...student,
            id: Math.max(...this.mockStudents.map(s => s.id || 0)) + 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        this.mockStudents.push(newStudent);
        return of(newStudent).pipe(delay(400));
    }

    /**
     * Met à jour un étudiant existant
     * TODO Backend: Remplacer par HttpClient.put<StudentDto>(`${this.API_URL}/${id}`, student)
     */
    update(id: number, student: StudentDto): Observable<StudentDto | undefined> {
        const index = this.mockStudents.findIndex(s => s.id === id);
        if (index !== -1) {
            const updated = {
                ...student,
                id,
                updatedAt: new Date().toISOString()
            };
            this.mockStudents[index] = updated;
            return of(updated).pipe(delay(400));
        }
        return of(undefined).pipe(delay(400));
    }

    /**
     * Supprime un étudiant
     * TODO Backend: Remplacer par HttpClient.delete<void>(`${this.API_URL}/${id}`)
     */
    delete(id: number): Observable<boolean> {
        const index = this.mockStudents.findIndex(s => s.id === id);
        if (index !== -1) {
            this.mockStudents.splice(index, 1);
            return of(true).pipe(delay(400));
        }
        return of(false).pipe(delay(400));
    }

    /**
     * Recherche d'étudiants par nom, classe, etc.
     * TODO Backend: Ajouter endpoint GET /api/students/search?query={query}
     */
    search(query: string): Observable<StudentDto[]> {
        const lowerQuery = query.toLowerCase();
        const filtered = this.mockStudents.filter(s =>
            s.firstName.toLowerCase().includes(lowerQuery) ||
            s.lastName.toLowerCase().includes(lowerQuery) ||
            s.className?.toLowerCase().includes(lowerQuery)
        );
        return of(filtered).pipe(delay(300));
    }
}
