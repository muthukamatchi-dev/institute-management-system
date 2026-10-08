import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';

import { PlanService } from '../../services/plan.service';

/**
 * Desktop layout shell — provides sidebar + header + router-outlet.
 *
 * Shared business logic (role-based redirects, page-title resolution,
 * read-only mode) lives here and is inherited by LayoutMobileComponent
 * so that both presentations stay in sync.
 */
@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  template: `
    <div class="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden relative">
      <!-- Mobile Backdrop -->
      <div *ngIf="sidebarOpen" 
           (click)="sidebarOpen = false"
           class="md:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity">
      </div>

      <!-- Sidebar -->
      <app-sidebar 
        [isOpen]="sidebarOpen"
        (closeSidebar)="sidebarOpen = false"
        class="block w-64 shrink-0 fixed md:relative z-50 md:z-auto h-full transition-transform duration-300 md:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen">
      </app-sidebar>
      
      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div *ngIf="isReadOnly" class="bg-amber-600 text-white px-4 py-2 text-xs font-black uppercase tracking-widest text-center shadow-lg relative z-20 flex items-center justify-center gap-3">
          <span>⚠️ SUBSCRIPTION EXPIRED</span>
          <span class="opacity-80">|</span>
          <span>READ-ONLY MODE ENABLED</span>
          <span class="opacity-80">|</span>
          <a href="#" class="underline hover:no-underline">Contact system admin to renew →</a>
        </div>
        <app-header [title]="pageTitle" (toggleSidebar)="sidebarOpen = !sidebarOpen"></app-header>
        <main class="flex-1 overflow-y-auto p-4 md:p-8">
          <router-outlet (activate)="onActivate($event)"></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit, OnDestroy {
  protected pageTitle: string = 'Dashboard';
  sidebarOpen: boolean = false;
  protected isReadOnly: boolean = false;

  private userSub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    protected authService: AuthService,
    protected router: Router,
    protected planService: PlanService
  ) { }

  ngOnInit() {
    this.routerSub = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        this.updatePageTitle();
      });
    this.updatePageTitle();

    this.userSub = this.authService.currentUser.subscribe(user => {
      this.isReadOnly = user?.is_read_only || false;
      const role = (user?.role_name || user?.role || '').trim().toLowerCase();
      const rawUrl = window.location.hash.replace(/^#/, '') || '/';
      const url = rawUrl.split('?')[0].split('#')[0] || '/';

      if (role === 'staff' && !this.planService.canUse('staffLogin')) {
        this.authService.logout();
        this.router.navigate(['/login']);
        return;
      }
      if (role === 'student' && !this.planService.canUse('studentLogin')) {
        this.authService.logout();
        this.router.navigate(['/login']);
        return;
      }

      if ((url === '/' || url === '/dashboard') && role === 'student') {
        this.router.navigate(['/my-progress']);
      } else if ((url === '/' || url === '/dashboard') && role === 'staff') {
        this.router.navigate(['/staff/my-attendance']);
      }
    });
  }

  ngOnDestroy() {
    this.userSub?.unsubscribe();
    this.routerSub?.unsubscribe();
  }

  onActivate(component: any) {
    this.updatePageTitle();
  }

  protected updatePageTitle() {
    const rawUrl = this.router.url || window.location.hash.replace(/^#/, '') || '/dashboard';
    // Strip query strings (?batch_id=...) and hash fragments
    const cleanUrl = rawUrl.split('?')[0].split('#')[0];
    const segments = cleanUrl.split('/').filter(s => s && s !== 'dashboard');

    if (segments.length === 0) {
      this.pageTitle = 'Dashboard';
      return;
    }

    // Handle nested paths like 'exams/internal' -> 'Internal Exams'
    const lastSegment = segments[segments.length - 1];
    const secondLastSegment = segments.length > 1 ? segments[segments.length - 2] : null;

    if (cleanUrl.includes('/exams/external/results/')) {
      this.pageTitle = 'External Results';
    } else if (secondLastSegment === 'exams') {
      this.pageTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) + ' Exams';
    } else if (cleanUrl.includes('study-material')) {
      this.pageTitle = cleanUrl.includes('my-study-material') ? 'My Study Material' : 'Study Material';
    } else if (cleanUrl.includes('staff-dashboard')) {
      this.pageTitle = 'Staff Attendance Dashboard';
    } else if (cleanUrl.includes('student-dashboard')) {
      this.pageTitle = 'Student Attendance Dashboard';
    } else if (cleanUrl.includes('/attendance/file')) {
      this.pageTitle = 'File Attendance';
    } else if (lastSegment.toLowerCase() === 'attendance') {
      this.pageTitle = 'Attendance';
    } else if (lastSegment.toLowerCase() === 'schedule' || lastSegment.toLowerCase() === 'schedule-class') {
      this.pageTitle = 'Schedule Class';
    } else {
      this.pageTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    }
  }
}
