import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { User } from '../../models';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <aside class="w-64 bg-slate-50/50 dark:bg-slate-900/80 backdrop-blur-xl h-screen border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-300 ease-in-out shadow-2xl md:shadow-none">
      <div class="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-primary-200 dark:shadow-none">
            I
          </div>
          <div>
            <h1 class="font-bold text-slate-800 dark:text-white leading-tight">Institute</h1>
            <p class="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">Manager Pro</p>
          </div>
        </div>
        <button (click)="closeSidebar.emit()" class="md:hidden p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">✕</button>
      </div>
      
      <nav class="flex-1 overflow-y-auto p-4 space-y-1">
        <div *ngFor="let item of navItems">
          <!-- Main Link -->
          <a *ngIf="!item.children"
             [routerLink]="item.path" 
             (click)="closeSidebar.emit()"
             [routerLinkActiveOptions]="{exact: item.path === '/staff' || item.path === '/attendance'}"
             routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold shadow-sm shadow-primary-50 dark:shadow-none"
             class="flex items-center gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all group">
            <span class="text-xl" [innerHTML]="item.icon"></span>
            <span>{{ item.label }}</span>
          </a>

          <!-- Dropdown -->
          <div *ngIf="item.children" class="space-y-1">
            <button (click)="toggleDropdown(item)"
                    class="w-full flex items-center justify-between gap-3 px-4 py-3 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-all group">
              <div class="flex items-center gap-3">
                <span class="text-xl" [innerHTML]="item.icon"></span>
                <span>{{ item.label }}</span>
              </div>
              <span class="text-[10px] transform transition-transform" [class.rotate-180]="item.isOpen">▼</span>
            </button>
            <div *ngIf="item.isOpen" class="pl-12 space-y-1">
              <a *ngFor="let child of item.children"
                 [routerLink]="child.path"
                 (click)="closeSidebar.emit()"
                 routerLinkActive="text-primary-600 dark:text-primary-400 font-bold"
                 class="block py-2 text-sm text-slate-500 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-200 transition-colors">
                • {{ child.label }}
              </a>
            </div>
          </div>
        </div>
      </nav>
      
      <div class="p-4 border-t border-slate-100 dark:border-slate-800">
        <div class="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-bold overflow-hidden uppercase">
            {{ (user?.name || 'A').charAt(0) }}
          </div>
          <div class="flex-1 overflow-hidden">
            <p class="text-sm font-semibold text-slate-800 dark:text-slate-200 truncate">{{ user?.name || 'Admin User' }}</p>
            <p class="text-xs text-slate-500 dark:text-slate-400 truncate">{{ user?.email || 'admin@institute.com' }}</p>
          </div>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeSidebar = new EventEmitter<void>();
  user: User | null = null;
  navItems: any[] = [
    { label: 'Dashboard', path: '/dashboard', icon: '📊' },
    { label: 'Day Book', path: '/day-book', icon: '📓' },
    { label: 'Students', path: '/students', icon: '👤' },
    { label: 'Courses', path: '/courses', icon: '📚' },
    { label: 'Batches', path: '/batches', icon: '⏱️' },
    {
      label: 'Exams', icon: '📝', isOpen: false,
      children: [
        { label: 'Questions', path: '/exams/questions' },
        { label: 'Internal Exams', path: '/exams/internal' },
        { label: 'External Exams', path: '/exams/external' },
        { label: 'Exam Entries', path: '/exams/entries' }
      ]
    },
    { label: 'Staff', path: '/staff', icon: '👥' },
    { label: 'Fees', path: '/fees', icon: '💰' },
    { label: 'Attendance', path: '/attendance', icon: '✅' },
    { label: 'Reports', path: '/reports', icon: '📈' },
    { label: 'Settings', path: '/settings', icon: '⚙️' }
  ];

  adminAsStaff = false;

  constructor(private authService: AuthService, private dataService: DataService) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      this.user = u;
      if (this.isAdmin()) {
        this.dataService.getSettings().subscribe(s => {
          this.adminAsStaff = s?.admin_as_staff == 1;
          this.updateNavItems();
        });
      } else {
        this.updateNavItems();
      }
    });
  }

  updateNavItems() {
    const role = this.getNormalizedRole();

    if (role === 'super admin' || role === 'super_admin') {
      this.navItems = [
        { label: 'Super Admin', path: '/super-admin', icon: '🏢' }
      ];
      return;
    }

    if (role === 'student') {
      this.navItems = [
        { label: 'My Progress', path: '/my-progress', icon: '📈' },
        { label: 'Study Material', path: '/my-study-material', icon: '📚' },
        { label: 'My Exams', path: '/my-exams', icon: '📝' },
        { label: 'Profile', path: '/profile', icon: '👤' },
        { label: 'Settings', path: '/settings', icon: '⚙️' }
      ];
    } else if (role === 'staff') {
      this.navItems = [
        { label: 'My Attendance', path: '/staff/my-attendance', icon: '⏰' },
        { label: 'Schedule Class', path: '/staff/schedule', icon: '📅' },
        { label: 'My Students', path: '/staff/students', icon: '👤' },
        { label: 'My Courses', path: '/staff/courses', icon: '📚' },
        { label: 'My Batches', path: '/staff/batches', icon: '⏱️' },
        {
          label: 'Exams', icon: '📝', isOpen: false,
          children: [
            { label: 'Questions', path: '/exams/questions' },
            { label: 'Internal Exams', path: '/exams/internal' },
            { label: 'External Exams', path: '/exams/external' },
            { label: 'Exam Entries', path: '/exams/entries' }
          ]
        },
        { label: 'Attendance', path: '/staff/attendance', icon: '✅' },
        { label: 'Study Material', path: '/study-material', icon: '📁' },
        { label: 'Settings', path: '/settings', icon: '⚙️' }
      ];
    } else {
      this.navItems = [
        { label: 'Dashboard', path: '/dashboard', icon: '📊' },
        { label: 'Day Book', path: '/day-book', icon: '📓' },
        { label: 'Students', path: '/students', icon: '👤' },
        { label: 'Courses', path: '/courses', icon: '📚' },
        { label: 'Batches', path: '/batches', icon: '⏱️' },
        {
          label: 'Exams', icon: '📝', isOpen: false,
          children: [
            { label: 'Questions', path: '/exams/questions' },
            { label: 'Internal Exams', path: '/exams/internal' },
            { label: 'External Exams', path: '/exams/external' },
            { label: 'Exam Entries', path: '/exams/entries' }
          ]
        }
      ];

      this.navItems.push({ label: 'Staff', path: '/staff', icon: '👥' });
      this.navItems.push({ label: 'Fees', path: '/fees', icon: '💰' });
      this.navItems.push({ label: 'Expenses', path: '/expenses', icon: '💸' });
      this.navItems.push({ label: 'Schedule Class', path: '/staff/schedule', icon: '📅' });

      this.navItems.push({ label: 'Attendance', path: '/attendance', icon: '✅' });
      this.navItems.push({ label: 'Study Material', path: '/study-material', icon: '📁' });
      this.navItems.push({ label: 'Reports', path: '/reports', icon: '📈' });
      this.navItems.push({ label: 'Settings', path: '/settings', icon: '⚙️' });
    }
  }

  toggleDropdown(item: any) {
    item.isOpen = !item.isOpen;
  }

  private getNormalizedRole(): string {
    return (this.user?.role_name || this.user?.role || '').trim().toLowerCase();
  }

  private isAdmin(): boolean {
    const role = this.getNormalizedRole();
    return role === 'admin' || role === 'super admin' || role === 'super_admin';
  }

  private isSuperAdmin(): boolean {
    const role = this.getNormalizedRole();
    return role === 'super admin' || role === 'super_admin';
  }
}
