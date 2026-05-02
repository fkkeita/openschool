import { Injectable } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import { AttendanceDto } from '../../models/dtos';

/**
 * Service Attendance - Architecture REST Ready
 * 
 * Endpoints REST:
 * - GET    /api/attendance
 * - GET    /api/attendance/student/{studentId}
 * - GET    /api/attendance/date/{date}
 * - POST   /api/attendance
 * - PUT    /api/attendance/{id}
 */
@Injectable({
    providedIn: 'root'
})
export class AttendanceService {
    private readonly API_URL = '/api/attendance';

    private mockAttendance: AttendanceDto[] = [
        {
            id: 1,
            studentId: 1,
            studentName: 'Sophie Durand',
            date: '2026-01-28',
            status: 'PRESENT',
            arrivalTime: '08:00:00',
            method: 'BADGE'
        },
        {
            id: 2,
            studentId: 2,
            studentName: 'Lucas Martin',
            date: '2026-01-28',
            status: 'PRESENT',
            arrivalTime: '08:05:00',
            method: 'BADGE'
        },
        {
            id: 3,
            studentId: 3,
            studentName: 'Amadou Koné',
            date: '2026-01-28',
            status: 'LATE',
            arrivalTime: '08:25:00',
            method: 'BADGE'
        }
    ];

    constructor() { }

    /**
     * TODO Backend: HttpClient.get<AttendanceDto[]>(this.API_URL)
     */
    getAll(): Observable<AttendanceDto[]> {
        return of(this.mockAttendance).pipe(delay(500));
    }

    /**
     * TODO Backend: HttpClient.get<AttendanceDto[]>(`${this.API_URL}/date/${date}`)
     */
    getByDate(date: string): Observable<AttendanceDto[]> {
        const filtered = this.mockAttendance.filter(a => a.date === date);
        return of(filtered).pipe(delay(300));
    }

    /**
     * TODO Backend: HttpClient.get<AttendanceDto[]>(`${this.API_URL}/student/${studentId}`)
     */
    getByStudentId(studentId: number): Observable<AttendanceDto[]> {
        const filtered = this.mockAttendance.filter(a => a.studentId === studentId);
        return of(filtered).pipe(delay(300));
    }

    /**
     * TODO Backend: HttpClient.post<AttendanceDto>(this.API_URL, attendance)
     */
    create(attendance: AttendanceDto): Observable<AttendanceDto> {
        const newRecord = {
            ...attendance,
            id: Math.max(...this.mockAttendance.map(a => a.id || 0)) + 1,
            createdAt: new Date().toISOString()
        };
        this.mockAttendance.push(newRecord);
        return of(newRecord).pipe(delay(400));
    }

    /**
     * TODO Backend: HttpClient.put<AttendanceDto>(`${this.API_URL}/${id}`, attendance)
     */
    update(id: number, attendance: AttendanceDto): Observable<AttendanceDto | undefined> {
        const index = this.mockAttendance.findIndex(a => a.id === id);
        if (index !== -1) {
            const updated = { ...attendance, id };
            this.mockAttendance[index] = updated;
            return of(updated).pipe(delay(400));
        }
        return of(undefined);
    }
}
