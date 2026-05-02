import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { ClassDto } from '../../models/dtos';

/**
 * Service Classes - Architecture REST Ready
 * 
 * Endpoints REST à implémenter:
 * - GET    /api/classes
 * - GET    /api/classes/{id}
 * - POST   /api/classes
 * - PUT    /api/classes/{id}
 * - DELETE /api/classes/{id}
 */
@Injectable({
    providedIn: 'root'
})
export class ClassService {
    private readonly API_URL = '/api/classes';

    private mockClasses: ClassDto[] = [
        {
            id: 1,
            name: 'Terminale A',
            level: 'Terminale',
            cycle: 'Lycée',
            capacity: 35,
            currentStudents: 32,
            mainTeacherName: 'M. Dubois',
            status: 'ACTIVE',
            academicYear: '2025-2026'
        },
        {
            id: 2,
            name: 'Première B',
            level: 'Première',
            cycle: 'Lycée',
            capacity: 35,
            currentStudents: 28,
            mainTeacherName: 'Mme Martin',
            status: 'ACTIVE',
            academicYear: '2025-2026'
        },
        {
            id: 3,
            name: 'Seconde C',
            level: 'Seconde',
            cycle: 'Lycée',
            capacity: 35,
            currentStudents: 30,
            mainTeacherName: 'M. Lefebvre',
            status: 'ACTIVE',
            academicYear: '2025-2026'
        }
    ];

    constructor() { }

    /**
     * TODO Backend: HttpClient.get<ClassDto[]>(this.API_URL)
     */
    getAll(): Observable<ClassDto[]> {
        return of(this.mockClasses).pipe(delay(500));
    }

    /**
     * TODO Backend: HttpClient.get<ClassDto>(`${this.API_URL}/${id}`)
     */
    getById(id: number): Observable<ClassDto | undefined> {
        return of(this.mockClasses.find(c => c.id === id)).pipe(delay(300));
    }

    /**
     * TODO Backend: HttpClient.post<ClassDto>(this.API_URL, classDto)
     */
    create(classDto: ClassDto): Observable<ClassDto> {
        const newClass = {
            ...classDto,
            id: Math.max(...this.mockClasses.map(c => c.id || 0)) + 1,
            currentStudents: 0,
            createdAt: new Date().toISOString()
        };
        this.mockClasses.push(newClass);
        return of(newClass).pipe(delay(400));
    }

    /**
     * TODO Backend: HttpClient.put<ClassDto>(`${this.API_URL}/${id}`, classDto)
     */
    update(id: number, classDto: ClassDto): Observable<ClassDto | undefined> {
        const index = this.mockClasses.findIndex(c => c.id === id);
        if (index !== -1) {
            const updated = { ...classDto, id };
            this.mockClasses[index] = updated;
            return of(updated).pipe(delay(400));
        }
        return of(undefined);
    }

    /**
     * TODO Backend: HttpClient.delete<void>(`${this.API_URL}/${id}`)
     */
    delete(id: number): Observable<boolean> {
        const index = this.mockClasses.findIndex(c => c.id === id);
        if (index !== -1) {
            this.mockClasses.splice(index, 1);
            return of(true).pipe(delay(400));
        }
        return of(false);
    }
}
