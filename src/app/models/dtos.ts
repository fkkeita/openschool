/**
 * DTO Student - Compatible Spring Boot REST API
 * Correspond à l'entité Student côté backend
 */
export interface StudentDto {
    id?: number;
    firstName: string;
    lastName: string;
    dateOfBirth: string; // Format: YYYY-MM-DD
    email?: string;
    phone?: string;
    address?: string;
    classId?: number;
    className?: string;
    status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
    enrollmentDate: string;
    parentName?: string;
    parentPhone?: string;
    parentEmail?: string;
    averageGrade?: number;
    attendanceRate?: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO Class - Compatible Spring Boot REST API
 */
export interface ClassDto {
    id?: number;
    name: string;
    level: string;
    cycle: string;
    capacity: number;
    currentStudents?: number;
    mainTeacherId?: number;
    mainTeacherName?: string;
    academicYear?: string;
    status: 'ACTIVE' | 'ARCHIVED';
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO Subject (Matière) - Compatible Spring Boot REST API
 */
export interface SubjectDto {
    id?: number;
    name: string;
    code: string;
    coefficient: number;
    cycle: string;
    description?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO Attendance - Compatible Spring Boot REST API
 */
export interface AttendanceDto {
    id?: number;
    studentId: number;
    studentName?: string;
    classId?: number;
    date: string; // Format: YYYY-MM-DD
    status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
    arrivalTime?: string; // Format: HH:mm:ss
    method: 'MANUAL' | 'BADGE' | 'QR_CODE';
    notes?: string;
    recordedBy?: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO Grade (Note) - Compatible Spring Boot REST API
 */
export interface GradeDto {
    id?: number;
    studentId: number;
    studentName?: string;
    subjectId: number;
    subjectName?: string;
    classId?: number;
    value: number; // Note sur 20
    coefficient?: number;
    examDate: string;
    trimester: number; // 1, 2, 3
    academicYear: string;
    status: 'DRAFT' | 'VALIDATED' | 'LOCKED';
    teacherId?: number;
    notes?: string;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO Payment - Compatible Spring Boot REST API
 */
export interface PaymentDto {
    id?: number;
    studentId: number;
    studentName?: string;
    amount: number;
    paymentDate: string;
    paymentMethod: 'CASH' | 'CHECK' | 'BANK_TRANSFER' | 'CARD';
    reference?: string;
    description?: string;
    status: 'PENDING' | 'COMPLETED' | 'CANCELLED';
    academicYear: string;
    receivedBy?: number;
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO User - Compatible Spring Boot REST API
 */
export interface UserDto {
    id?: number;
    email: string;
    firstName: string;
    lastName: string;
    role: 'ADMIN' | 'TEACHER' | 'ACCOUNTANT' | 'SECRETARY' | 'PARENT' | 'DIRECTOR';
    phone?: string;
    status: 'ACTIVE' | 'INACTIVE';
    createdAt?: string;
    updatedAt?: string;
}

/**
 * DTO pour l'authentification (Login Request)
 */
export interface LoginRequestDto {
    email: string;
    password: string;
}

/**
 * DTO pour la réponse d'authentification
 * TODO Backend: Ajouter JWT token
 */
export interface LoginResponseDto {
    token?: string; // JWT token (à ajouter côté backend)
    user: UserDto;
    expiresIn?: number;
}

/**
 * DTO DashboardStats - Compatible Spring Boot REST API
 */
export interface DashboardStatsDto {
    totalStudents: number;
    presentToday: number;
    absentToday: number;
    lateToday: number;
    attendanceRate: number;
    unpaidAmount: number;
    pendingGrades: number;
}


