import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SidebarComponent } from '../../core/layout/sidebar/sidebar.component';
import { PaymentDto } from '../../models/dtos';

/**
 * Composant Finance - Gestion des paiements
 */
@Component({
  selector: 'app-finance',
  standalone: true,
  imports: [CommonModule, FormsModule, SidebarComponent],
  templateUrl: './finance.component.html',
  styleUrl: './finance.component.scss'
})
export class FinanceComponent {
  payments: PaymentDto[] = [
    {
      id: 1,
      studentId: 1,
      studentName: 'Sophie Durand',
      amount: 350,
      paymentDate: '2026-01-15',
      paymentMethod: 'BANK_TRANSFER',
      status: 'COMPLETED',
      academicYear: '2025-2026'
    },
    {
      id: 2,
      studentId: 2,
      studentName: 'Lucas Martin',
      amount: 200,
      paymentDate: '2026-01-10',
      paymentMethod: 'CASH',
      status: 'COMPLETED',
      academicYear: '2025-2026'
    },
    {
      id: 3,
      studentId: 3,
      studentName: 'Amadou Koné',
      amount: 400,
      paymentDate: '2026-01-20',
      paymentMethod: 'CHECK',
      status: 'PENDING',
      academicYear: '2025-2026'
    }
  ];

  selectedStatus: string = 'all';
  selectedMethod: string = 'all';
  searchTerm: string = '';

  stats = {
    totalReceived: 0,
    pending: 0,
    thisMonth: 0
  };

  constructor() {
    this.calculateStats();
  }

  calculateStats(): void {
    this.stats.totalReceived = this.payments
      .filter(p => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + p.amount, 0);

    this.stats.pending = this.payments
      .filter(p => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);

    const thisMonth = new Date().getMonth();
    this.stats.thisMonth = this.payments
      .filter(p => new Date(p.paymentDate).getMonth() === thisMonth)
      .reduce((sum, p) => sum + p.amount, 0);
  }

  get filteredPayments(): PaymentDto[] {
    let filtered = [...this.payments];

    if (this.searchTerm) {
      filtered = filtered.filter(p =>
        p.studentName?.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(p => p.status === this.selectedStatus);
    }

    if (this.selectedMethod !== 'all') {
      filtered = filtered.filter(p => p.paymentMethod === this.selectedMethod);
    }

    return filtered;
  }
}
