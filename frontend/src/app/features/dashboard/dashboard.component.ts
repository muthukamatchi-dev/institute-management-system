import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { DashboardStats, RecentActivity } from '../../models';
import { Observable, forkJoin } from 'rxjs';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './dashboard.component.html'
})
export class DashboardComponent implements OnInit {
  stats$: Observable<DashboardStats> | undefined;
  activities: RecentActivity[] = [];
  activitiesLoading = true;
  deadlines: any[] = [];
  deadlinesLoading = true;
  today = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  currentUser: any;

  // Chart instances
  enrollmentChart: any;
  revenueChart: any;
  expenseChart: any;

  constructor(private dataService: DataService, private authService: AuthService, private router: Router) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      this.currentUser = user;
      if (user) {
        if (user.role_name === 'staff') {
          this.router.navigate(['/staff/schedule']);
        } else if (user.role_name === 'student') {
          this.router.navigate(['/my-progress']);
        }
      }
    });

    this.stats$ = this.dataService.getStats();

    this.dataService.getRecentActivities().subscribe({
      next: data => {
        this.activities = data;
        this.activitiesLoading = false;
      },
      error: () => this.activitiesLoading = false
    });

    this.dataService.getUpcomingDeadlines().subscribe({
      next: data => {
        this.deadlines = data;
        this.deadlinesLoading = false;
      },
      error: () => this.deadlinesLoading = false
    });

    this.initCharts();
  }

  initCharts() {
    forkJoin({
      trends: this.dataService.getEnrollmentTrends(),
      revenue: this.dataService.getCourseRevenue(),
      expenses: this.dataService.getExpenseStats()
    }).subscribe(res => {
      this.createEnrollmentChart(res.trends);
      this.createRevenueChart(res.revenue);
      this.createExpenseChart(res.expenses);
    });
  }

  createEnrollmentChart(trends: any[]) {
    const ctx = document.getElementById('enrollmentChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = trends.map(t => t.month);
    const data = trends.map(t => t.count);

    this.enrollmentChart = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [{
          label: 'New Enrollments',
          data,
          borderColor: '#3b82f6',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4,
          borderWidth: 3,
          pointRadius: 4,
          pointBackgroundColor: '#fff',
          pointBorderColor: '#3b82f6',
          pointBorderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { beginAtZero: true, grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  createRevenueChart(revenue: any[]) {
    const ctx = document.getElementById('revenueChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = revenue.map(r => r.course_name);
    const data = revenue.map(r => r.total_revenue);

    this.revenueChart = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data,
          backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
          borderWidth: 0,
          spacing: 5
        }]
      },
      options: {
        responsive: true,
        cutout: '70%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              usePointStyle: true,
              padding: 20,
              font: { weight: 'bold', size: 10 }
            }
          }
        }
      }
    });
  }

  createExpenseChart(expenses: any[]) {
    const ctx = document.getElementById('expenseChart') as HTMLCanvasElement;
    if (!ctx) return;

    const labels = expenses.map(e => e.category);
    const data = expenses.map(e => e.total_amount);

    this.expenseChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Expenses',
          data,
          backgroundColor: '#ef4444',
          borderRadius: 8,
          barThickness: 20
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { display: false } },
          x: { grid: { display: false } }
        }
      }
    });
  }

  goToAddCourse() {
    this.router.navigate(['/courses']);
  }


  getActivityIcon(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('enrollment') || t.includes('student added')) return '📝';
    if (t.includes('fee') || t.includes('payment')) return '💳';
    if (t.includes('attendance')) return '✅';
    if (t.includes('course') || t.includes('batch')) return '📚';
    if (t.includes('updated') || t.includes('modified')) return '⚙️';
    if (t.includes('deleted')) return '🗑️';
    return '📍';
  }

  getActivityIconClass(type: string): string {
    const base = 'w-10 h-10 rounded-xl flex items-center justify-center text-xl shadow-sm ';
    const t = type.toLowerCase();
    if (t.includes('enrollment') || t.includes('student added')) return base + 'bg-blue-50 text-blue-600';
    if (t.includes('fee') || t.includes('payment')) return base + 'bg-emerald-50 text-emerald-600';
    if (t.includes('attendance')) return base + 'bg-violet-50 text-violet-600';
    if (t.includes('course') || t.includes('batch')) return base + 'bg-amber-50 text-amber-600';
    if (t.includes('updated') || t.includes('modified')) return base + 'bg-sky-50 text-sky-600';
    if (t.includes('deleted')) return base + 'bg-rose-50 text-rose-600';
    return base + 'bg-slate-50 text-slate-600';
  }

  getDeadlineColor(urgency: string): string {
    switch (urgency) {
      case 'high': return 'bg-rose-500';
      case 'medium': return 'bg-amber-400';
      default: return 'bg-emerald-400';
    }
  }

  getDeadlineIcon(type: string): string {
    return type === 'fee' ? '💰' : '📅';
  }

  formatTimestamp(ts: string): string {
    if (!ts) return 'Recently';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return 'Yesterday';
    return `${diffD} days ago`;
  }
}
