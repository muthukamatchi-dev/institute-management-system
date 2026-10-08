import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PlanService } from '../../services/plan.service';

interface NavItem {
  label: string;
  path: string;
  icon: string;
  isActive?: boolean;
}

@Component({
  selector: 'app-bottom-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bottom-nav">
      <a *ngFor="let item of navItems"
         [routerLink]="item.path"
         routerLinkActive="bottom-nav-active"
         class="bottom-nav-item">
        <span class="bottom-nav-icon">{{ item.icon }}</span>
        <span class="bottom-nav-label">{{ item.label }}</span>
      </a>
    </nav>
  `,
  styles: [`
    .bottom-nav {
      display: flex;
      align-items: stretch;
      justify-content: space-around;
      background: rgba(255,255,255,0.97);
      border-top: 1px solid rgba(0,0,0,0.06);
      padding: 4px 0;
      padding-bottom: calc(4px + env(safe-area-inset-bottom, 0));
      flex-shrink: 0;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      position: relative;
      z-index: 50;
    }
    :host-context(.dark) .bottom-nav {
      background: rgba(15,23,42,0.97);
      border-top-color: rgba(255,255,255,0.06);
    }
    .bottom-nav-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 6px 12px;
      border-radius: 12px;
      text-decoration: none;
      color: #94a3b8;
      transition: all 0.2s ease;
      min-width: 56px;
      gap: 2px;
      -webkit-tap-highlight-color: transparent;
    }
    .bottom-nav-item:active {
      transform: scale(0.92);
    }
    .bottom-nav-active {
      color: rgb(var(--color-primary-600));
      background: rgba(var(--color-primary-500), 0.08);
    }
    .bottom-nav-icon {
      font-size: 20px;
      line-height: 1;
    }
    .bottom-nav-label {
      font-size: 9px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  `]
})
export class BottomNavComponent implements OnInit {
  navItems: NavItem[] = [];

  constructor(
    private authService: AuthService,
    public planService: PlanService
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      const role = (u?.role_name || u?.role || '').trim().toLowerCase();

      if (role === 'super admin' || role === 'super_admin') {
        this.navItems = [
          { label: 'Admin', path: '/super-admin', icon: '🏢' }
        ];
        return;
      }

      if (role === 'student') {
        this.navItems = [
          { label: 'Progress', path: '/my-progress', icon: '📈' },
          { label: 'Exams', path: '/my-exams', icon: '📝' },
          { label: 'Material', path: '/my-study-material', icon: '📚' },
          { label: 'Profile', path: '/profile', icon: '👤' }
        ];
        return;
      }

      if (role === 'staff') {
        this.navItems = [
          { label: 'Home', path: '/staff/my-attendance', icon: '🏠' },
          { label: 'Schedule', path: '/staff/schedule', icon: '📅' },
          { label: 'Students', path: '/staff/students', icon: '👥' },
          { label: 'Attendance', path: '/staff/attendance', icon: '✅' },
          { label: 'Profile', path: '/profile', icon: '👤' }
        ];
        return;
      }

      // Admin
      this.navItems = [
        { label: 'Home', path: '/dashboard', icon: '🏠' },
        { label: 'Students', path: '/students', icon: '🎓' },
        { label: 'Fees', path: '/fees', icon: '💰' },
        { label: 'Attendance', path: '/attendance', icon: '✅' },
        { label: 'More', path: '/settings', icon: '⚙️' }
      ];
    });
  }
}
