import { Component, Input, OnDestroy, OnInit, HostListener, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { User, Branch } from '../../models';
import { Subject, debounceTime, distinctUntilChanged, switchMap, of } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { BranchContextService } from '../../services/branch-context.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
    <header class="h-16 bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b-2 border-slate-200/60 dark:border-slate-800 px-6 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      <div class="flex items-center gap-4">
        <button (click)="toggleSidebar.emit()" class="md:hidden p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400">☰</button>
        <div class="flex items-center gap-2">
          <span class="text-xl hidden sm:block">{{ getTitleIcon() }}</span>
          <h2 class="text-lg font-black text-slate-800 dark:text-white tracking-tight">{{ title }}</h2>
        </div>
      </div>
      
      <div class="flex items-center gap-4">
        <!-- Branch Selector -->
        <div *ngIf="isBranchSelectorVisible && !isSuperAdmin()" class="hidden md:flex items-center">
          <div class="relative flex items-center gap-2.5 px-3.5 py-2 bg-white/70 dark:bg-slate-800/70 border border-slate-200/70 dark:border-slate-700/60 rounded-2xl shadow-sm hover:shadow-md hover:bg-white dark:hover:bg-slate-800 transition-all">
            <span class="text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest select-none">Branch</span>
            <select [ngModel]="selectedBranchId" (ngModelChange)="onBranchChange($event)"
                    class="bg-transparent text-[13px] font-black text-slate-800 dark:text-white border-none outline-none cursor-pointer appearance-none pl-2 pr-8 min-w-[220px]">
              <option value="all">🌐 All Branches</option>
              <option *ngFor="let branch of activeBranches" [value]="branch.id">
                {{ branch.isMain ? '⭐ ' : '' }}{{ branch.name }}
              </option>
            </select>
            <span class="pointer-events-none absolute right-3 text-slate-400 dark:text-slate-500 text-xs select-none">&#9662;</span>
          </div>
        </div>

        <div *ngIf="!isSuperAdmin()" class="hidden md:flex relative group">
          <input type="text" placeholder="Search anything..." 
                 (input)="onSearchInput($event)"
                 [(ngModel)]="searchQuery"
                 class="pl-10 pr-4 py-2 bg-slate-100/80 dark:bg-slate-800/80 border border-transparent rounded-xl text-sm focus:ring-4 focus:ring-primary-500/10 dark:focus:ring-primary-400/10 focus:bg-white dark:focus:bg-slate-800 focus:border-slate-200 dark:focus:border-slate-700 w-64 transition-all outline-none text-slate-800 dark:text-slate-200">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors">🔍</span>
          
          <!-- Search Results Dropdown -->
          <div *ngIf="searchResults.length > 0"
               class="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden z-50">
            <div class="max-h-64 overflow-y-auto divide-y divide-slate-50 dark:divide-slate-800">
              <a *ngFor="let result of searchResults" 
                 [routerLink]="result.path" 
                 [queryParams]="{id: result.id}"
                 (click)="clearSearch()"
                 class="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                <span class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 flex items-center justify-center text-xs font-black">
                  {{ result.type[0].toUpperCase() }}
                </span>
                <div class="flex-1 min-w-0">
                  <p class="text-[13px] font-bold text-slate-800 dark:text-white truncate">{{ result.name }}</p>
                  <p class="text-[10px] text-slate-400 dark:text-slate-500 uppercase font-black tracking-widest">{{ result.code || result.type }}</p>
                </div>
              </a>
            </div>
          </div>
        </div>
        
        <!-- Notification Bell -->
        <div class="relative">
          <button (click)="toggleNotifications($event)"
                  class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl relative transition-colors bg-white/50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 shadow-sm">
            🔔
            <span *ngIf="unreadCount > 0"
                  class="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-rose-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm">
              {{ unreadCount > 9 ? '9+' : unreadCount }}
            </span>
          </button>

          <!-- Notification Dropdown -->
          <div *ngIf="showNotifications" (click)="$event.stopPropagation()"
               class="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-800 z-50 overflow-hidden">
            <div class="px-5 py-4 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
              <p class="text-sm font-black text-slate-800 dark:text-white">Notifications</p>
              <span *ngIf="unreadCount > 0" class="text-[10px] font-black bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 px-2 py-0.5 rounded-full uppercase tracking-widest">
                {{ unreadCount }} New
              </span>
            </div>
            <div class="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
              <div *ngFor="let n of notifications"
                   class="px-5 py-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors flex items-start gap-3 cursor-pointer"
                   [class.bg-blue-50/20]="!n.is_read">
                <div class="w-8 h-8 rounded-xl flex items-center justify-center text-sm flex-shrink-0 bg-primary-50 dark:bg-primary-900/20">
                  {{ n.type === 'fee' ? '💳' : n.type === 'enrollment' ? '📝' : n.type === 'schedule' ? '📅' : n.type === 'batch' ? '⏰' : '📍' }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-xs font-black text-slate-800 dark:text-white tracking-tight">{{ n.title }}</p>
                  <p class="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mt-0.5 line-clamp-2">{{ n.message }}</p>
                  <p class="text-[9px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-widest">{{ formatTs(n.created_at) }}</p>
                </div>
                <div *ngIf="!n.is_read" class="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0"></div>
              </div>
              <div *ngIf="notifications.length === 0" class="px-5 py-8 text-center">
                <p class="text-3xl mb-2">🎉</p>
                <p class="text-sm text-slate-400 dark:text-slate-500 font-bold">You're all caught up!</p>
              </div>
            </div>
          </div>
        </div>

        <div class="h-8 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
        
        <!-- User Dropdown -->
        <div class="relative group/user">
          <div class="flex items-center gap-3 cursor-pointer py-1.5 px-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800">
            <img [src]="'https://ui-avatars.com/api/?name=' + (user?.name || 'Admin') + '&background=0D8ABC&color=fff'" 
                 alt="Profile" class="w-9 h-9 rounded-xl ring-2 ring-transparent group-hover/user:ring-primary-100 dark:group-hover/user:ring-primary-900 transition-all shadow-sm">
            <div class="hidden sm:block">
              <p class="text-[13px] font-black text-slate-800 dark:text-white leading-none">{{ user?.name || 'Admin User' }}</p>
              <p class="text-[10px] text-slate-400 dark:text-slate-500 font-bold mt-1 uppercase tracking-widest">{{ user?.role_name || 'ADMIN' }}</p>
            </div>
            <span class="text-[10px] text-slate-300 dark:text-slate-600 ml-1">▼</span>
          </div>

          <div class="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-none border border-slate-100 dark:border-slate-800 py-2.5 z-50 invisible group-hover/user:visible opacity-0 group-hover/user:opacity-100 transition-all transform origin-top-right scale-95 group-hover/user:scale-100">
            <div class="px-5 py-3 border-b border-slate-50 dark:border-slate-800 mb-1.5">
              <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">Account Hub</p>
              <p class="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1 truncate">{{ user?.email || 'admin@institute.com' }}</p>
            </div>
            <a routerLink="/profile" class="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-bold group/item">
              <span class="text-lg group-hover/item:scale-110 transition-transform">👤</span> 
              <span>My Profile</span>
            </a>
            <a routerLink="/settings" class="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-bold group/item">
              <span class="text-lg group-hover/item:scale-110 transition-transform">⚙️</span> 
              <span>Settings</span>
            </a>
            <a routerLink="/help" class="flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-bold group/item">
              <span class="text-lg group-hover/item:scale-110 transition-transform">❓</span> 
              <span>Help Center</span>
            </a>
            
            <button *ngIf="isInstallable" (click)="installPwa()" 
                    class="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 transition-all font-black group/install overflow-hidden relative">
              <div class="absolute inset-0 bg-primary-500/5 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out"></div>
              <span class="text-lg group-hover:scale-125 transition-transform animate-bounce-subtle">📥</span> 
              <div class="flex flex-col items-start leading-tight">
                <span>Download as App</span>
                <span class="text-[8px] uppercase tracking-tighter opacity-60">Install for Quick Access</span>
              </div>
              <span class="ml-auto flex h-2 w-2">
                <span class="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-primary-400 opacity-75"></span>
                <span class="relative inline-flex rounded-full h-2 w-2 bg-primary-500"></span>
              </span>
            </button>

            <div class="my-2 border-t border-slate-50 dark:border-slate-800"></div>
            <button (click)="onLogout()" 
                    class="w-full flex items-center gap-3 px-5 py-3 text-sm text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 transition-colors font-black uppercase tracking-widest group/item">
              <span class="text-lg group-hover/item:translate-x-1 transition-transform">🚪</span> 
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
  @Input() title: string = 'Dashboard';
  @Output() toggleSidebar = new EventEmitter<void>();
  user: User | null = null;
  showNotifications = false;
  notifications: any[] = [];
  unreadCount = 0;
  searchResults: any[] = [];
  searchQuery: string = '';
  private searchTerms = new Subject<string>();

  // Branch context
  isBranchContextEnabled = false;
  activeBranches: Branch[] = [];
  selectedBranchId: string | number | 'all' = 'all';
  private readonly branchSwitchToastKey = 'branchSwitchToast';
  private readonly seenNotificationsStorageKey = 'seenNotificationIds';
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  constructor(
    private authService: AuthService,
    private dataService: DataService,
    private branchContextService: BranchContextService,
    private toastService: ToastService,
    private router: Router
  ) { }

  ngOnInit() {
    const branchToast = localStorage.getItem(this.branchSwitchToastKey);
    if (branchToast) {
      localStorage.removeItem(this.branchSwitchToastKey);
      this.toastService.info(branchToast, 3500);
    }

    this.authService.currentUser.subscribe(u => this.user = u);

    // Load real notifications
    this.loadNotifications();

    // Polling for new notifications every 30 seconds
    this.pollHandle = setInterval(() => this.loadNotifications(), 30000);

    // Setup search
    this.searchTerms.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((term: string) => term ? this.dataService.search(term) : of([]))
    ).subscribe(results => {
      this.searchResults = results;
    });

    // Setup branch context
    this.branchContextService.isEnabled$.subscribe(enabled => {
      this.isBranchContextEnabled = enabled;
      this.updateBranchVisibility();
    });
    this.branchContextService.isHeaderHidden$.subscribe(hidden => {
      this.isHeaderHidden = hidden;
      this.updateBranchVisibility();
    });
    this.branchContextService.branches$.subscribe(branches => this.activeBranches = branches);
    this.branchContextService.selectedBranchId$.subscribe(id => this.selectedBranchId = id);
  }

  isHeaderHidden = false;
  isBranchSelectorVisible = false;

  private updateBranchVisibility() {
    this.isBranchSelectorVisible = this.isBranchContextEnabled && !this.isHeaderHidden;
  }

  loadNotifications() {
    this.dataService.getNotifications().subscribe(ns => {
      const seenIds = this.getSeenNotificationIds();
      this.notifications = ns.filter(n => !n.is_read && !seenIds.has(String(n.id)));
      this.unreadCount = this.notifications.length;
    });
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications && this.unreadCount > 0) {
      const seenIds = this.getSeenNotificationIds();
      this.notifications.forEach(n => {
        if (n?.id != null) {
          seenIds.add(String(n.id));
        }
      });
      this.saveSeenNotificationIds(seenIds);

      this.dataService.markNotificationsRead().subscribe(() => {
        this.unreadCount = 0;
        this.notifications.forEach(n => n.is_read = 1);
      });
    }
  }

  onSearchInput(event: any) {
    this.searchQuery = event.target.value;
    this.searchTerms.next(this.searchQuery);
  }

  clearSearch() {
    this.searchQuery = '';
    this.searchResults = [];
    this.searchTerms.next('');
  }
  onBranchChange(newId: any) {
    if (String(newId) === String(this.selectedBranchId)) return;

    const name = this.activeBranches.find(b => String(b.id) === String(newId))?.name || 'selected branch';

    localStorage.setItem(this.branchSwitchToastKey, 'Switched to ' + name + '. Updating view...');
    this.branchContextService.setSelectedBranchId(newId);
    // Reload to refresh all data with branch filter
    window.location.reload();
  }

  @HostListener('document:click')
  onDocumentClick() {
    if (this.showNotifications) {
      this.showNotifications = false;
      this.notifications = [];
    }
  }

  ngOnDestroy() {
    if (this.pollHandle) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
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
    } catch {
      // Ignore storage issues and fall back to backend read-state only.
    }
  }

  formatTs(ts: string): string {
    if (!ts) return 'Recently';
    const d = new Date(ts);
    if (isNaN(d.getTime())) return ts;
    const diffH = Math.floor((Date.now() - d.getTime()) / 3600000);
    if (diffH < 1) return 'Just now';
    if (diffH < 24) return `${diffH}h ago`;
    const diffD = Math.floor(diffH / 24);
    return diffD === 1 ? 'Yesterday' : `${diffD} days ago`;
  }

  onLogout() {
    if (confirm('Are you sure you want to sign out?')) {
      this.authService.logout();
    }
  }

  isSuperAdmin(): boolean {
    const role = (this.user?.role_name || this.user?.role || '').trim().toLowerCase();
    return role === 'super admin' || role === 'super_admin';
  }

  getTitleIcon(): string {
    const t = this.title.toLowerCase();
    if (t.includes('dashboard')) return '📊';
    if (t.includes('student')) return '👥';
    if (t.includes('course')) return '📚';
    if (t.includes('batch')) return '⏱️';
    if (t.includes('exam')) return '📝';
    if (t.includes('staff')) return '👨‍🏫';
    if (t.includes('fee')) return '💰';
    if (t.includes('expense')) return '📉';
    if (t.includes('attendance')) return '✅';
    if (t.includes('profile')) return '👤';
    if (t.includes('settings')) return '⚙️';
    if (t.includes('material')) return '📁';
    return '💎';
  }

  isInstallable = false;
  private deferredPrompt: any;

  @HostListener('window:beforeinstallprompt', ['$event'])
  onBeforeInstallPrompt(e: any) {
    e.preventDefault();
    this.deferredPrompt = e;
    this.isInstallable = true;
  }

  installPwa() {
    if (!this.deferredPrompt) return;
    this.deferredPrompt.prompt();
    this.deferredPrompt.userChoice.then((choiceResult: any) => {
      if (choiceResult.outcome === 'accepted') {
        this.isInstallable = false;
      }
      this.deferredPrompt = null;
    });
  }
}

