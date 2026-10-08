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

            <button (click)="openAboutModal()" class="w-full flex items-center gap-3 px-5 py-2.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-primary-50 dark:hover:bg-primary-900/10 hover:text-primary-700 dark:hover:text-primary-400 transition-colors font-bold group/item text-left">
              <span class="text-lg group-hover/item:scale-110 transition-transform">🏢</span> 
              <span>About Institute</span>
            </button>
            
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

    <!-- About Institute Modal Backdrop -->
    <div *ngIf="showAboutModal" class="fixed inset-0 bg-slate-900/70 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 overflow-hidden animate-fade-in" (click)="closeAboutModal()">
      
      <!-- Modal Card (Sized to match red boxed mark) -->
      <div class="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-2xl max-w-5xl w-full overflow-hidden transform transition-all animate-scale-up" (click)="$event.stopPropagation()">
        
        <!-- Modal Header -->
        <div class="relative px-7 py-4 bg-gradient-to-r from-primary-600 via-indigo-600 to-purple-600 text-white flex items-center justify-between overflow-hidden">
          <div class="flex items-center gap-3.5 z-10">
            <div class="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shadow-inner border border-white/20 flex-shrink-0">
              🏢
            </div>
            <div>
              <div class="flex items-center gap-2.5">
                <h3 class="text-lg font-black tracking-tight">About {{ aboutDetails?.institute?.name || 'Institute' }}</h3>
                <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-400/20 text-emerald-200 border border-emerald-400/30 flex items-center gap-1 shadow-xs">
                  <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {{ aboutDetails?.plan?.status || 'Active' }}
                </span>
              </div>
              <p class="text-xs text-white/80 font-medium">Software Specifications, Plan Subscription & Automatic DB Backup Configuration</p>
            </div>
          </div>

          <button (click)="closeAboutModal()" class="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 transition-colors flex items-center justify-center text-white font-bold text-base z-10 flex-shrink-0">
            ✕
          </button>
        </div>

        <!-- Modal Content (Spacious 1050px layout, non-scrolling) -->
        <div class="p-6 space-y-4 text-slate-800 dark:text-slate-200">
          
          <!-- Spinner loading state -->
          <div *ngIf="loadingAbout" class="py-12 text-center">
            <div class="inline-block w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            <p class="text-xs font-bold text-slate-400 dark:text-slate-500 mt-2">Loading institute & plan details...</p>
          </div>

          <div *ngIf="!loadingAbout" class="space-y-4">
            
            <!-- SECTION 1: Institute Plan & Software Details -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span>📋</span> Plan Subscription & System Details
                </h4>
                <span class="text-xs font-black text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/30 px-3 py-1 rounded-xl border border-primary-100 dark:border-primary-800/40">
                  {{ aboutDetails?.plan?.version || 'Classivo CMS v2.4.0 PRO' }}
                </span>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <!-- Plan Tier Card -->
                <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5 shadow-xs">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-black flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                    💎
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Current Plan Tier</p>
                    <p class="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">{{ aboutDetails?.plan?.planName || 'Enterprise Plan' }}</p>
                    <p class="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">Mode: {{ aboutDetails?.plan?.databaseMode || 'Shared Multi-Tenant' }}</p>
                  </div>
                </div>

                <!-- Registration ID & Support Card -->
                <div class="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 flex items-center gap-3.5 shadow-xs">
                  <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-black flex items-center justify-center text-lg flex-shrink-0 shadow-md">
                    🆔
                  </div>
                  <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-extrabold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Institute ID & Support</p>
                    <p class="text-sm font-black text-slate-900 dark:text-white truncate mt-0.5">{{ aboutDetails?.institute?.registrationId || 'INS-1001' }}</p>
                    <p class="text-xs font-bold text-primary-600 dark:text-primary-400 truncate">{{ aboutDetails?.plan?.supportEmail || 'support@classivo.app' }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 2: Automatic Google Drive DB Backup Settings -->
            <div class="space-y-2.5">
              <div class="flex items-center justify-between">
                <h4 class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <span>☁️</span> Automatic DB Backup (Google Drive)
                </h4>
                <span *ngIf="aboutDetails?.backup?.lastBackupAt" class="text-xs font-semibold text-slate-400 dark:text-slate-500">
                  Last Backup: {{ aboutDetails.backup.lastBackupAt | date:'medium' }}
                </span>
              </div>

              <div class="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
                <!-- Google Drive URL Input Row -->
                <div class="flex items-center gap-3">
                  <div class="relative flex-1">
                    <input type="url" [(ngModel)]="gdriveBackupUrl"
                           placeholder="https://drive.google.com/drive/folders/your-folder-id"
                           class="w-full pl-9 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500 outline-none text-slate-800 dark:text-slate-100 font-medium">
                    <span class="absolute left-3 top-1/2 -translate-y-1/2 text-sm">🔗</span>
                  </div>

                  <button (click)="onSaveBackupSettings()" [disabled]="savingBackupSettings"
                          class="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 text-xs font-black rounded-xl shadow-md transition-all flex items-center gap-2 flex-shrink-0 cursor-pointer">
                    <span *ngIf="savingBackupSettings" class="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin"></span>
                    <span>💾 Save Schedule</span>
                  </button>
                </div>

                <!-- Backup Frequency Selector Pills -->
                <div class="flex items-center justify-between gap-3 pt-0.5">
                  <span class="text-xs font-extrabold text-slate-700 dark:text-slate-300 uppercase tracking-wider">Schedule Frequency:</span>
                  <div class="flex items-center gap-2 flex-1 max-w-lg">
                    <button type="button" *ngFor="let opt of ['Daily', 'Weekly', 'Monthly', 'Quarterly']"
                            (click)="backupFrequency = opt"
                            [class.bg-primary-600]="backupFrequency === opt"
                            [class.text-white]="backupFrequency === opt"
                            [class.shadow-md]="backupFrequency === opt"
                            [class.bg-white]="backupFrequency !== opt"
                            [class.dark:bg-slate-900]="backupFrequency !== opt"
                            [class.text-slate-700]="backupFrequency !== opt"
                            [class.dark:text-slate-200]="backupFrequency !== opt"
                            [class.border-slate-300]="backupFrequency !== opt"
                            [class.dark:border-slate-700]="backupFrequency !== opt"
                            class="flex-1 py-2 px-3 rounded-xl border text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer hover:border-primary-400">
                      <span>{{ opt === 'Daily' ? '🕒' : opt === 'Weekly' ? '📅' : opt === 'Monthly' ? '🗓️' : '📊' }}</span>
                      <span>{{ opt }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- SECTION 3: Immediate Manual DB Backup Banner -->
            <div class="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-purple-500/10 border border-blue-200 dark:border-blue-800/40 flex items-center justify-between gap-4 shadow-xs">
              <div class="flex items-center gap-3.5 min-w-0">
                <div class="w-10 h-10 rounded-xl bg-primary-600 text-white flex items-center justify-center text-lg shadow-md flex-shrink-0">
                  📦
                </div>
                <div class="min-w-0">
                  <p class="text-xs font-black text-slate-900 dark:text-white">Quick Manual Database Backup</p>
                  <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Export & download complete relational SQL database backup file directly to your local computer.</p>
                </div>
              </div>

              <button (click)="onDownloadManualBackup()" [disabled]="downloadingBackup"
                      class="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-700 hover:to-indigo-700 text-white text-xs font-black rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group flex-shrink-0 cursor-pointer">
                <span *ngIf="downloadingBackup" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span *ngIf="!downloadingBackup" class="text-sm group-hover:scale-125 transition-transform">📥</span>
                <span>{{ downloadingBackup ? 'Generating...' : 'Manual DB Backup' }}</span>
              </button>
            </div>

          </div>

        </div>

        <!-- Modal Footer -->
        <div class="px-7 py-3 bg-slate-50 dark:bg-slate-900/80 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span class="font-bold">System Status: Operational</span>
          </div>
          <button (click)="closeAboutModal()" class="px-5 py-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-800 font-bold text-xs text-slate-700 dark:text-slate-300 transition-colors cursor-pointer">
            Close Window
          </button>
        </div>

      </div>
    </div>
  `
})
export class HeaderComponent implements OnInit, OnDestroy {
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
    // Clean out query strings or hash parameters e.g. Attendance?batch_id=24...
    const clean = val.split('?')[0].split('#')[0].trim();
    this._title = clean || 'Dashboard';
  }
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
      this.notifications = ns;
      this.unreadCount = ns.filter(n => !n.is_read && !seenIds.has(String(n.id))).length;
    });
  }

  toggleNotifications(event: Event) {
    event.stopPropagation();
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      const seenIds = this.getSeenNotificationIds();
      this.notifications.forEach(n => {
        if (n?.id != null) {
          seenIds.add(String(n.id));
        }
        n.is_read = 1;
      });
      this.saveSeenNotificationIds(seenIds);
      this.unreadCount = 0;

      this.dataService.markNotificationsRead().subscribe({
        next: () => {
          this.unreadCount = 0;
        },
        error: () => {}
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

  // About Modal State & Logic
  showAboutModal = false;
  aboutDetails: any = null;
  loadingAbout = false;
  savingBackupSettings = false;
  downloadingBackup = false;

  gdriveBackupUrl = '';
  backupFrequency = 'Daily';

  openAboutModal() {
    this.showAboutModal = true;
    this.loadingAbout = true;
    this.dataService.getAboutInfo().subscribe({
      next: (data) => {
        this.aboutDetails = data;
        if (data?.backup) {
          this.gdriveBackupUrl = data.backup.gdriveBackupUrl || '';
          this.backupFrequency = data.backup.backupFrequency || 'Daily';
        }
        this.loadingAbout = false;
      },
      error: (err) => {
        console.error('Failed to load about details', err);
        this.loadingAbout = false;
      }
    });
  }

  closeAboutModal() {
    this.showAboutModal = false;
  }

  onSaveBackupSettings() {
    if (this.savingBackupSettings) return;
    this.savingBackupSettings = true;
    this.dataService.saveBackupSettings({
      gdrive_backup_url: this.gdriveBackupUrl,
      backup_frequency: this.backupFrequency
    }).subscribe({
      next: () => {
        this.savingBackupSettings = false;
        this.toastService.success('Automatic DB Backup schedule saved!');
        if (this.aboutDetails && this.aboutDetails.backup) {
          this.aboutDetails.backup.gdriveBackupUrl = this.gdriveBackupUrl;
          this.aboutDetails.backup.backupFrequency = this.backupFrequency;
        }
      },
      error: (err) => {
        this.savingBackupSettings = false;
        this.toastService.error('Failed to save backup schedule settings');
      }
    });
  }

  onDownloadManualBackup() {
    if (this.downloadingBackup) return;
    this.downloadingBackup = true;
    this.toastService.info('Preparing database backup export...', 3000);
    this.dataService.downloadManualBackup().subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        const now = new Date();
        const timestamp = now.toISOString().replace(/[-:T.]/g, '').slice(0, 14);
        a.download = `institute_db_backup_${timestamp}.sql`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.downloadingBackup = false;
        this.toastService.success('Manual DB Backup downloaded successfully!');
        if (this.aboutDetails && this.aboutDetails.backup) {
          this.aboutDetails.backup.lastBackupAt = new Date().toISOString();
        }
      },
      error: (err) => {
        this.downloadingBackup = false;
        this.toastService.error('Failed to download manual database backup');
      }
    });
  }
}

