import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { PlanService } from '../../services/plan.service';
import { User } from '../../models';

interface NavItem {
  label: string;
  path?: string;
  icon: string;
  isOpen?: boolean;
  children?: { label: string; path: string }[];
}

@Component({
  selector: 'app-header-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <header class="mobile-header">
      <div class="mobile-header-left">
        <!-- Hamburger Button -->
        <button (click)="showDrawer = !showDrawer" class="mobile-hamburger-btn" aria-label="Toggle navigation">
          <svg class="hamburger-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
          </svg>
        </button>
        <h2 class="mobile-header-title">{{ title }}</h2>
      </div>
      
      <div class="mobile-header-right">
        <!-- Notifications -->
        <button (click)="toggleNotifications($event)" class="mobile-header-btn" *ngIf="user">
          <span>🔔</span>
          <span *ngIf="unreadCount > 0" class="mobile-notif-badge">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </button>
        <!-- User Avatar -->
        <button (click)="showUserMenu = !showUserMenu; showNotifications = false" class="mobile-header-avatar" *ngIf="user">
          {{ user?.name?.charAt(0)?.toUpperCase() || '?' }}
        </button>
      </div>

      <!-- User Menu Dropdown -->
      <div *ngIf="showUserMenu" class="mobile-user-menu">
        <div class="mobile-user-info">
          <div class="mobile-user-avatar-lg">{{ user?.name?.charAt(0)?.toUpperCase() || '?' }}</div>
          <div>
            <p class="mobile-user-name">{{ user?.name }}</p>
            <p class="mobile-user-role">{{ user?.role_name || user?.role }}</p>
          </div>
        </div>
        <div class="mobile-menu-divider"></div>
        <a routerLink="/profile" (click)="showUserMenu = false" class="mobile-menu-item">👤 My Profile</a>
        <a routerLink="/settings" (click)="showUserMenu = false" class="mobile-menu-item">⚙️ Settings</a>
        <div class="mobile-menu-divider"></div>
        <button (click)="logout()" class="mobile-menu-item mobile-menu-danger">🚪 Logout</button>
      </div>
      <div *ngIf="showUserMenu || showNotifications" (click)="showUserMenu = false; showNotifications = false" class="mobile-overlay"></div>

      <!-- Notifications Panel -->
      <div *ngIf="showNotifications" class="mobile-notif-panel">
        <div class="mobile-notif-header">
          <div style="display: flex; align-items: center; gap: 8px;">
            <span class="mobile-notif-title">Notifications</span>
            <span *ngIf="unreadCount > 0" class="mobile-notif-badge" style="position: relative; top: 0; right: 0;">{{ unreadCount }} New</span>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <button *ngIf="notifications.length > 0" (click)="markAllRead()" style="border: none; background: none; color: #4f46e5; font-weight: 800; font-size: 11px; cursor: pointer;">
              Mark all read
            </button>
            <button (click)="showNotifications = false" class="mobile-notif-close">✕</button>
          </div>
        </div>
        <div *ngIf="notifications.length === 0" class="mobile-notif-empty">
          <span>🔕</span>
          <p>No notifications yet</p>
        </div>
        <div *ngFor="let n of notifications" class="mobile-notif-item" (click)="markAllRead()" style="cursor: pointer;">
          <p class="mobile-notif-text" [style.font-weight]="n.is_read ? '600' : '800'">
            {{ n.title ? n.title + ': ' : '' }}{{ n.message }}
          </p>
          <p class="mobile-notif-time">{{ n.created_at | date:'short' }}</p>
        </div>
      </div>
    </header>

    <!-- Navigation Drawer Overlay Backdrop -->
    <div *ngIf="showDrawer" (click)="showDrawer = false" class="mobile-drawer-backdrop"></div>

    <!-- Navigation Drawer Panel -->
    <div class="mobile-drawer-panel" [class.mobile-drawer-open]="showDrawer">
      <!-- Drawer Header -->
      <div class="mobile-drawer-header">
        <div class="mobile-drawer-brand">
          <div class="mobile-brand-icon">I</div>
          <div>
            <h3 class="mobile-brand-name">Institute</h3>
            <p class="mobile-brand-sub">Manager Pro</p>
          </div>
        </div>
        <button (click)="showDrawer = false" class="mobile-drawer-close">✕</button>
      </div>

      <!-- User Banner -->
      <div class="mobile-drawer-user" *ngIf="user">
        <div class="mobile-drawer-avatar">{{ user.name?.charAt(0)?.toUpperCase() || 'U' }}</div>
        <div class="mobile-drawer-user-info">
          <p class="mobile-drawer-user-name">{{ user.name }}</p>
          <p class="mobile-drawer-user-role">{{ user.role_name || user.role }}</p>
        </div>
      </div>

      <!-- Nav Items List -->
      <nav class="mobile-drawer-nav">
        <div *ngFor="let item of navItems" class="mobile-drawer-item-container">
          <!-- Single Link -->
          <a *ngIf="!item.children"
             [routerLink]="item.path"
             (click)="showDrawer = false"
             routerLinkActive="mobile-drawer-link-active"
             class="mobile-drawer-link">
            <span class="mobile-drawer-icon">{{ item.icon }}</span>
            <span class="mobile-drawer-label">{{ item.label }}</span>
          </a>

          <!-- Multi-level Dropdown -->
          <div *ngIf="item.children" class="mobile-drawer-dropdown">
            <button (click)="toggleDropdown(item)" class="mobile-drawer-link mobile-drawer-dropdown-btn">
              <div class="mobile-drawer-dropdown-left">
                <span class="mobile-drawer-icon">{{ item.icon }}</span>
                <span class="mobile-drawer-label">{{ item.label }}</span>
              </div>
              <span class="mobile-drawer-arrow" [class.mobile-drawer-arrow-open]="item.isOpen">▼</span>
            </button>
            <div *ngIf="item.isOpen" class="mobile-drawer-submenu">
              <a *ngFor="let child of item.children"
                 [routerLink]="child.path"
                 (click)="showDrawer = false"
                 routerLinkActive="mobile-drawer-sublink-active"
                 class="mobile-drawer-sublink">
                • {{ child.label }}
              </a>
            </div>
          </div>
        </div>
      </nav>

      <!-- Drawer Footer -->
      <div class="mobile-drawer-footer">
        <button (click)="logout(); showDrawer = false" class="mobile-drawer-logout-btn">
          <span>🚪 Logout</span>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .mobile-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: rgba(255,255,255,0.97);
      border-bottom: 1px solid rgba(0,0,0,0.06);
      flex-shrink: 0;
      position: relative;
      z-index: 40;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
    }
    :host-context(.dark) .mobile-header {
      background: rgba(15,23,42,0.97);
      border-bottom-color: rgba(255,255,255,0.06);
    }
    .mobile-header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mobile-hamburger-btn {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      border: none;
      background: #f1f5f9;
      color: #0f172a;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      padding: 0;
      transition: all 0.2s ease;
      -webkit-tap-highlight-color: transparent;
    }
    :host-context(.dark) .mobile-hamburger-btn {
      background: #1e293b;
      color: white;
    }
    .mobile-hamburger-btn:active {
      transform: scale(0.92);
      background: rgba(var(--color-primary-500), 0.15);
    }
    .hamburger-icon {
      width: 20px;
      height: 20px;
    }
    .mobile-header-title {
      font-size: 18px;
      font-weight: 900;
      color: #0f172a;
      letter-spacing: -0.02em;
      margin: 0;
    }
    :host-context(.dark) .mobile-header-title { color: white; }
    .mobile-header-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .mobile-header-btn {
      position: relative;
      width: 40px;
      height: 40px;
      border-radius: 12px;
      border: none;
      background: #f1f5f9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host-context(.dark) .mobile-header-btn { background: #1e293b; }
    .mobile-header-btn:active { transform: scale(0.92); }
    .mobile-notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      min-width: 16px;
      height: 16px;
      border-radius: 99px;
      background: #ef4444;
      color: white;
      font-size: 9px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
    }
    .mobile-header-avatar {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      border: none;
      background: rgb(var(--color-primary-600));
      color: white;
      font-size: 14px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    .mobile-header-avatar:active { transform: scale(0.92); }
    .mobile-overlay {
      position: fixed;
      inset: 0;
      z-index: 45;
      background: transparent;
    }
    .mobile-user-menu {
      position: absolute;
      top: 100%;
      right: 12px;
      width: 240px;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px -10px rgba(0,0,0,0.2);
      border: 1px solid rgba(0,0,0,0.06);
      z-index: 50;
      overflow: hidden;
      animation: slideDown 0.2s ease;
    }
    :host-context(.dark) .mobile-user-menu {
      background: #1e293b;
      border-color: rgba(255,255,255,0.06);
    }
    .mobile-user-info {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }
    .mobile-user-avatar-lg {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: rgb(var(--color-primary-600));
      color: white;
      font-size: 16px;
      font-weight: 900;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .mobile-user-name { font-size: 14px; font-weight: 800; color: #0f172a; margin: 0; }
    :host-context(.dark) .mobile-user-name { color: white; }
    .mobile-user-role { font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: capitalize; margin: 0; }
    .mobile-menu-divider { height: 1px; background: #f1f5f9; margin: 0; }
    :host-context(.dark) .mobile-menu-divider { background: #334155; }
    .mobile-menu-item {
      display: block;
      width: 100%;
      padding: 12px 16px;
      font-size: 13px;
      font-weight: 700;
      color: #475569;
      text-decoration: none;
      border: none;
      background: none;
      text-align: left;
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }
    :host-context(.dark) .mobile-menu-item { color: #94a3b8; }
    .mobile-menu-item:active { background: #f8fafc; }
    :host-context(.dark) .mobile-menu-item:active { background: #0f172a; }
    .mobile-menu-danger { color: #ef4444 !important; }
    .mobile-notif-panel {
      position: absolute;
      top: 100%;
      right: 12px;
      left: 12px;
      max-height: 400px;
      overflow-y: auto;
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px -10px rgba(0,0,0,0.2);
      border: 1px solid rgba(0,0,0,0.06);
      z-index: 50;
      animation: slideDown 0.2s ease;
    }
    :host-context(.dark) .mobile-notif-panel {
      background: #1e293b;
      border-color: rgba(255,255,255,0.06);
    }
    .mobile-notif-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
    }
    :host-context(.dark) .mobile-notif-header { border-bottom-color: #334155; }
    .mobile-notif-title { font-size: 14px; font-weight: 900; color: #0f172a; }
    :host-context(.dark) .mobile-notif-title { color: white; }
    .mobile-notif-close { border: none; background: none; font-size: 16px; color: #94a3b8; cursor: pointer; padding: 4px; }
    .mobile-notif-empty {
      padding: 32px 16px;
      text-align: center;
      color: #94a3b8;
      font-size: 13px;
      font-weight: 600;
    }
    .mobile-notif-empty span { font-size: 32px; display: block; margin-bottom: 8px; }
    .mobile-notif-item {
      padding: 12px 16px;
      border-bottom: 1px solid #f8fafc;
    }
    :host-context(.dark) .mobile-notif-item { border-bottom-color: #1e293b; }
    .mobile-notif-text { font-size: 13px; font-weight: 600; color: #334155; margin: 0; }
    :host-context(.dark) .mobile-notif-text { color: #cbd5e1; }
    .mobile-notif-time { font-size: 10px; font-weight: 700; color: #94a3b8; margin: 4px 0 0; }

    /* Drawer Backdrop */
    .mobile-drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(15, 23, 42, 0.6);
      backdrop-filter: blur(4px);
      -webkit-backdrop-filter: blur(4px);
      z-index: 9998;
      animation: fadeIn 0.25s ease;
    }

    /* Drawer Panel */
    .mobile-drawer-panel {
      position: fixed;
      top: 0;
      left: 0;
      bottom: 0;
      width: 295px;
      max-width: 85vw;
      background: #ffffff;
      z-index: 9999;
      transform: translateX(-100%);
      transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      display: flex;
      flex-direction: column;
      box-shadow: 10px 0 30px rgba(0,0,0,0.2);
    }
    :host-context(.dark) .mobile-drawer-panel {
      background: #0f172a;
      border-right: 1px solid rgba(255,255,255,0.08);
    }
    .mobile-drawer-panel.mobile-drawer-open {
      transform: translateX(0);
    }

    .mobile-drawer-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 20px;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    :host-context(.dark) .mobile-drawer-header {
      border-bottom-color: rgba(255,255,255,0.08);
    }
    .mobile-drawer-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .mobile-brand-icon {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: rgb(var(--color-primary-600));
      color: white;
      font-weight: 900;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .mobile-brand-name {
      font-size: 15px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
      line-height: 1.2;
    }
    :host-context(.dark) .mobile-brand-name { color: white; }
    .mobile-brand-sub {
      font-size: 10px;
      font-weight: 700;
      color: #64748b;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .mobile-drawer-close {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      border: none;
      background: #f1f5f9;
      color: #64748b;
      font-size: 16px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    :host-context(.dark) .mobile-drawer-close {
      background: #1e293b;
      color: #94a3b8;
    }

    .mobile-drawer-user {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: #f8fafc;
      border-bottom: 1px solid rgba(0,0,0,0.06);
    }
    :host-context(.dark) .mobile-drawer-user {
      background: #1e293b;
      border-bottom-color: rgba(255,255,255,0.08);
    }
    .mobile-drawer-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgb(var(--color-primary-600));
      color: white;
      font-weight: 800;
      font-size: 15px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .mobile-drawer-user-name {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      margin: 0;
    }
    :host-context(.dark) .mobile-drawer-user-name { color: white; }
    .mobile-drawer-user-role {
      font-size: 11px;
      font-weight: 600;
      color: #64748b;
      margin: 0;
      text-transform: capitalize;
    }

    .mobile-drawer-nav {
      flex: 1;
      overflow-y: auto;
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .mobile-drawer-item-container {
      width: 100%;
    }
    .mobile-drawer-link {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: 11px 14px;
      border-radius: 12px;
      text-decoration: none;
      color: #475569;
      font-size: 14px;
      font-weight: 700;
      background: transparent;
      border: none;
      cursor: pointer;
      transition: all 0.15s ease;
      -webkit-tap-highlight-color: transparent;
      text-align: left;
    }
    :host-context(.dark) .mobile-drawer-link {
      color: #cbd5e1;
    }
    .mobile-drawer-link:active {
      background: #f1f5f9;
    }
    :host-context(.dark) .mobile-drawer-link:active {
      background: #1e293b;
    }
    .mobile-drawer-link-active {
      background: rgba(var(--color-primary-500), 0.1) !important;
      color: rgb(var(--color-primary-600)) !important;
    }
    :host-context(.dark) .mobile-drawer-link-active {
      background: rgba(var(--color-primary-500), 0.2) !important;
      color: #60a5fa !important;
    }
    .mobile-drawer-icon {
      font-size: 18px;
      line-height: 1;
      margin-right: 10px;
    }
    .mobile-drawer-label {
      flex: 1;
    }
    .mobile-drawer-dropdown-left {
      display: flex;
      align-items: center;
    }
    .mobile-drawer-arrow {
      font-size: 10px;
      color: #94a3b8;
      transition: transform 0.2s ease;
    }
    .mobile-drawer-arrow-open {
      transform: rotate(180deg);
    }
    .mobile-drawer-submenu {
      padding-left: 36px;
      padding-top: 4px;
      padding-bottom: 4px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .mobile-drawer-sublink {
      display: block;
      padding: 8px 12px;
      border-radius: 8px;
      text-decoration: none;
      color: #64748b;
      font-size: 13px;
      font-weight: 600;
      transition: all 0.15s ease;
    }
    :host-context(.dark) .mobile-drawer-sublink {
      color: #94a3b8;
    }
    .mobile-drawer-sublink-active {
      color: rgb(var(--color-primary-600)) !important;
      font-weight: 800;
    }
    :host-context(.dark) .mobile-drawer-sublink-active {
      color: #60a5fa !important;
    }

    .mobile-drawer-footer {
      padding: 14px 16px;
      border-top: 1px solid rgba(0,0,0,0.06);
    }
    :host-context(.dark) .mobile-drawer-footer {
      border-top-color: rgba(255,255,255,0.08);
    }
    .mobile-drawer-logout-btn {
      width: 100%;
      padding: 10px 14px;
      border-radius: 12px;
      border: 1px solid #fee2e2;
      background: #fef2f2;
      color: #ef4444;
      font-size: 13px;
      font-weight: 800;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    :host-context(.dark) .mobile-drawer-logout-btn {
      background: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.2);
    }

    @keyframes slideDown {
      from { opacity: 0; transform: translateY(-8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
  `]
})
export class HeaderMobileComponent implements OnInit, OnDestroy {
  private _title: string = 'Dashboard';
  @Input()
  get title(): string {
    return this._title;
  }
  set title(val: string) {
    if (!val) {
      this._title = 'Dashboard';
      return;
    }
    const clean = val.split('?')[0].split('#')[0].trim();
    this._title = clean || 'Dashboard';
  }
  user: User | null = null;
  notifications: any[] = [];
  unreadCount = 0;
  showUserMenu = false;
  showNotifications = false;
  showDrawer = false;
  navItems: NavItem[] = [];

  enableExams = true;
  enableExpenses = true;
  enableStudyMaterial = true;
  enablePrograms = true;
  adminAsStaffEnabled = false;

  private readonly seenNotificationsStorageKey = 'seenNotificationIds';
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    public planService: PlanService,
    private router: Router
  ) {}

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      this.user = u;
      if (u) {
        this.loadNotifications();
        this.buildNavItems();
      }
    });

    // Polling for new notifications every 30 seconds
    this.pollHandle = setInterval(() => this.loadNotifications(), 30000);

    this.dataService.getSettings().subscribe((s: any) => {
      const notOff = (v: any) => v !== 0 && v !== '0' && v !== false;
      this.enableExams = s == null || notOff(s.enable_exams);
      this.enableExpenses = s == null || notOff(s.enable_expenses);
      this.enableStudyMaterial = s == null || notOff(s.enable_study_material);
      this.enablePrograms = s == null || (notOff(s.enable_programs) && notOff(s.enablePrograms));
      this.adminAsStaffEnabled = s != null && (s.admin_as_staff == 1 || s.admin_as_staff === true || s.adminAsStaff == 1 || s.adminAsStaff === true || s.admin_as_staff === '1');
      this.buildNavItems();
    });

    this.planService.plan$.subscribe(() => {
      this.buildNavItems();
    });
  }

  ngOnDestroy() {
    if (this.pollHandle) clearInterval(this.pollHandle);
  }

  buildNavItems() {
    const role = (this.user?.role_name || this.user?.role || '').trim().toLowerCase();

    if (role === 'super admin' || role === 'super_admin') {
      this.navItems = [
        { label: 'Super Admin', path: '/super-admin', icon: '🏢' }
      ];
      return;
    }

    if (role === 'student') {
      this.navItems = [
        { label: 'My Progress', path: '/my-progress', icon: '📈' }
      ];
      if (this.planService.canUse('studyMaterial')) {
        this.navItems.push({ label: 'Study Material', path: '/my-study-material', icon: '📚' });
      }
      if (this.planService.canUse('exams')) {
        this.navItems.push({ label: 'My Exams', path: '/my-exams', icon: '📝' });
      }
      this.navItems.push({ label: 'My Profile', path: '/profile', icon: '👤' });
      this.navItems.push({ label: 'Settings', path: '/settings', icon: '⚙️' });
      return;
    }

    if (role === 'staff') {
      this.navItems = [];
      if (this.planService.canUse('attendance')) {
        this.navItems.push({ label: 'My Attendance', path: '/staff/my-attendance', icon: '⏰' });
      }
      if (this.planService.canUse('scheduleClass')) {
        this.navItems.push({ label: 'Schedule Class', path: '/staff/schedule', icon: '📅' });
      }
      this.navItems.push({ label: 'My Students', path: '/staff/students', icon: '👤' });
      this.navItems.push({ label: 'My Courses', path: '/staff/courses', icon: '📚' });
      this.navItems.push({ label: 'My Batches', path: '/staff/batches', icon: '⏱️' });

      if (this.planService.canUse('exams') && this.enableExams) {
        this.navItems.push({
          label: 'Exams', icon: '📝', isOpen: false,
          children: [
            { label: 'Questions', path: '/exams/questions' },
            { label: 'Internal Exams', path: '/exams/internal' },
            { label: 'External Exams', path: '/exams/external' },
            { label: 'Exam Entries', path: '/exams/entries' }
          ]
        });
      }

      if (this.planService.canUse('attendance')) {
        this.navItems.push({ label: 'Attendance', path: '/staff/attendance', icon: '✅' });
      }

      if (this.planService.canUse('studyMaterial') && this.enableStudyMaterial) {
        this.navItems.push({ label: 'Study Material', path: '/study-material', icon: '📁' });
      }

      this.navItems.push({ label: 'Profile', path: '/profile', icon: '👤' });
      this.navItems.push({ label: 'Settings', path: '/settings', icon: '⚙️' });
      return;
    }

    // Admin
    this.navItems = [
      { label: 'Dashboard', path: '/dashboard', icon: '📊' },
      { label: 'Enquiries', path: '/enquiries', icon: '📞' },
      { label: 'Day Book', path: '/day-book', icon: '📓' },
      { label: 'Students', path: '/students', icon: '👤' },
      { label: 'Courses', path: '/courses', icon: '📚' }
    ];

    if (this.planService.canUse('programs') && this.enablePrograms) {
      this.navItems.push({ label: 'Programs', path: '/programs', icon: '🎓' });
    }

    this.navItems.push({ label: 'Batches', path: '/batches', icon: '⏱️' });

    if (this.planService.canUse('exams') && this.enableExams) {
      this.navItems.push({
        label: 'Exams', icon: '📝', isOpen: false,
        children: [
          { label: 'Questions', path: '/exams/questions' },
          { label: 'Internal Exams', path: '/exams/internal' },
          { label: 'External Exams', path: '/exams/external' },
          { label: 'Exam Entries', path: '/exams/entries' }
        ]
      });
    }

    this.navItems.push({ label: 'Staff', path: '/staff', icon: '👥' });
    this.navItems.push({ label: 'Fees', path: '/fees', icon: '💰' });

    if (this.planService.canUse('expenses') && this.enableExpenses) {
      this.navItems.push({ label: 'Expenses', path: '/expenses', icon: '💸' });
    }

    if (this.planService.canUse('scheduleClass')) {
      this.navItems.push({ label: 'Schedule Class', path: '/staff/schedule', icon: '📅' });
    }

    if (this.planService.canUse('attendance')) {
      const isAttendanceActive = this.router.url.includes('/attendance');
      const attendanceChildren = [
        { label: 'Student Attendance Dashboard', path: '/attendance/student-dashboard' },
        { label: 'Staff Attendance Dashboard', path: '/attendance/staff-dashboard' }
      ];

      if (this.adminAsStaffEnabled) {
        attendanceChildren.push({ label: 'File Attendance', path: '/attendance/file' });
      }

      this.navItems.push({
        label: 'Attendance',
        icon: '✅',
        isOpen: isAttendanceActive,
        children: attendanceChildren
      });
    }

    if (this.planService.canUse('studyMaterial') && this.enableStudyMaterial) {
      this.navItems.push({ label: 'Study Material', path: '/study-material', icon: '📁' });
    }

    this.navItems.push({ label: 'Reports', path: '/reports', icon: '📈' });
    this.navItems.push({ label: 'Profile', path: '/profile', icon: '👤' });
    this.navItems.push({ label: 'Settings', path: '/settings', icon: '⚙️' });
  }

  toggleDropdown(item: NavItem) {
    item.isOpen = !item.isOpen;
  }

  toggleNotifications(event?: Event) {
    if (event) event.stopPropagation();
    this.showUserMenu = false;
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.markAllRead();
    }
  }

  loadNotifications() {
    if (!this.dataService.getNotifications) return;
    this.dataService.getNotifications().subscribe({
      next: (res: any) => {
        const list = Array.isArray(res) ? res : (res?.data || []);
        const seenIds = this.getSeenNotificationIds();
        this.notifications = list;
        this.unreadCount = list.filter((n: any) => !n.is_read && !seenIds.has(String(n.id))).length;
      },
      error: () => {}
    });
  }

  markAllRead() {
    const seenIds = this.getSeenNotificationIds();
    this.notifications.forEach(n => {
      if (n?.id != null) {
        seenIds.add(String(n.id));
      }
      n.is_read = 1;
    });
    this.saveSeenNotificationIds(seenIds);
    this.unreadCount = 0;

    if (this.dataService.markNotificationsRead) {
      this.dataService.markNotificationsRead().subscribe({
        next: () => {
          this.unreadCount = 0;
        },
        error: () => {}
      });
    }
  }

  private getSeenNotificationIds(): Set<string> {
    try {
      const raw = localStorage.getItem(this.seenNotificationsStorageKey);
      if (!raw) return new Set<string>();
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return new Set<string>();
      return new Set(parsed.map(id => String(id)));
    } catch {
      return new Set<string>();
    }
  }

  private saveSeenNotificationIds(ids: Set<string>) {
    try {
      localStorage.setItem(
        this.seenNotificationsStorageKey,
        JSON.stringify(Array.from(ids).slice(-500))
      );
    } catch {}
  }

  logout() {
    this.showUserMenu = false;
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}

