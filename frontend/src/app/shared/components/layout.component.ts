import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SidebarComponent } from './sidebar.component';
import { HeaderComponent } from './header.component';
import { AuthService } from '../../services/auth.service';

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
        class="fixed md:relative z-50 md:z-auto h-full transition-transform duration-300 md:translate-x-0"
        [class.-translate-x-full]="!sidebarOpen">
      </app-sidebar>
      
      <!-- Main Content -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden">
        <app-header [title]="pageTitle" (toggleSidebar)="sidebarOpen = !sidebarOpen"></app-header>
        <main class="flex-1 overflow-y-auto p-4 md:p-8">
          <router-outlet (activate)="onActivate($event)"></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class LayoutComponent implements OnInit {
  pageTitle: string = 'Dashboard';
  sidebarOpen: boolean = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      const role = (user?.role_name || user?.role || '').trim().toLowerCase();
      const url = window.location.hash.replace(/^#/, '') || '/';

      if ((url === '/' || url === '/dashboard') && role === 'student') {
        this.router.navigate(['/my-progress']);
      } else if ((url === '/' || url === '/dashboard') && role === 'staff') {
        this.router.navigate(['/staff/schedule']);
      }
    });
  }

  onActivate(component: any) {
    const url = window.location.hash.replace(/^#/, '') || '/dashboard';
    const segments = url.split('/').filter(s => s && s !== 'dashboard');
    
    if (segments.length === 0) {
      this.pageTitle = 'Dashboard';
      return;
    }

    // Handle nested paths like 'exams/internal' -> 'Internal Exams'
    const lastSegment = segments[segments.length - 1];
    const secondLastSegment = segments.length > 1 ? segments[segments.length - 2] : null;

    if (secondLastSegment === 'exams') {
      this.pageTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1) + ' Exams';
    } else if (url.includes('study-material')) {
      this.pageTitle = url.includes('my-study-material') ? 'My Study Material' : 'Study Material';
    } else {
      this.pageTitle = lastSegment.charAt(0).toUpperCase() + lastSegment.slice(1).replace(/-/g, ' ');
    }
  }
}
