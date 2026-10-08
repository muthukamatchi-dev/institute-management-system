import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { DashboardComponent } from './dashboard.component';

@Component({
  selector: 'app-dashboard-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, ModalComponent],
  templateUrl: './dashboard-mobile.component.html'
})
export class DashboardMobileComponent extends DashboardComponent {
  deadlinesCurrentPage: number = 1;
  deadlinesPerPage: number = 10;

  constructor(dataService: DataService, authService: AuthService, router: Router) {
    super(dataService, authService, router);
  }

  get paginatedDeadlines(): any[] {
    const start = (this.deadlinesCurrentPage - 1) * this.deadlinesPerPage;
    return (this.deadlines || []).slice(start, start + this.deadlinesPerPage);
  }

  get totalDeadlinePages(): number {
    return Math.ceil((this.deadlines || []).length / this.deadlinesPerPage) || 1;
  }

  prevDeadlinePage(): void {
    if (this.deadlinesCurrentPage > 1) {
      this.deadlinesCurrentPage--;
    }
  }

  nextDeadlinePage(): void {
    if (this.deadlinesCurrentPage < this.totalDeadlinePages) {
      this.deadlinesCurrentPage++;
    }
  }
}
