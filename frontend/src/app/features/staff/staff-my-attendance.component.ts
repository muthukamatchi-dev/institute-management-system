import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-staff-my-attendance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-8 max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl"></div>
        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl"></div>
        
        <div class="relative z-10">
          <h1 class="text-3xl font-black text-white tracking-tight sm:text-4xl">My Attendance</h1>
          <p class="text-slate-400 font-medium text-sm mt-2 max-w-md">Record your daily check-in and check-out times. Your presence is valuable to us.</p>
        </div>
        
        <div class="relative z-10 flex flex-col items-center bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-lg min-w-[180px]">
          <span class="text-[10px] font-black text-primary-400 uppercase tracking-widest">Live Time</span>
          <span class="text-2xl font-mono font-bold text-white mt-1">{{ currentTime }}</span>
          <span class="text-xs font-bold text-slate-300 uppercase tracking-wider mt-1">{{ currentDate | date:'fullDate' }}</span>
        </div>
      </div>

      <!-- Quick Stats Card -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
        <!-- Login Card -->
        <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-soft transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-primary-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
          
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-950/30 flex items-center justify-center text-primary-600 dark:text-primary-400 text-xl font-bold">
              🌅
            </div>
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white">Punch-In</h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Start your work day</p>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between mb-8">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Punch-In Time</span>
            <span class="text-xl font-mono font-black text-slate-800 dark:text-white">
              {{ formatTime12Hour(attendanceRecord?.loginTime) }}
            </span>
          </div>

          <button (click)="savePunch('login')" 
                  [disabled]="saving || attendanceRecord?.loginTime"
                  class="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-premium flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  [ngClass]="attendanceRecord?.loginTime ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-none' : 'bg-primary-600 hover:bg-primary-700 text-white'">
            <span *ngIf="saving">Saving...</span>
            <span *ngIf="!saving && !attendanceRecord?.loginTime">Save Login Time 📂</span>
            <span *ngIf="!saving && attendanceRecord?.loginTime">Punch-In Recorded ✓</span>
          </button>
        </div>

        <!-- Logout Card -->
        <div class="bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-soft transition-all duration-300 hover:shadow-xl relative overflow-hidden group">
          <div class="absolute right-0 top-0 w-24 h-24 bg-amber-500/5 rounded-bl-full group-hover:scale-110 transition-transform"></div>
          
          <div class="flex items-center gap-4 mb-6">
            <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 dark:text-amber-400 text-xl font-bold">
              🌆
            </div>
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white">Punch-Out</h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mt-0.5">Wrap up your work day</p>
            </div>
          </div>

          <div class="bg-slate-50 dark:bg-slate-800/40 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between mb-8">
            <span class="text-xs text-slate-500 dark:text-slate-400 font-black uppercase tracking-widest">Punch-Out Time</span>
            <span class="text-xl font-mono font-black text-slate-800 dark:text-white">
              {{ formatTime12Hour(attendanceRecord?.logoutTime) }}
            </span>
          </div>

          <button (click)="savePunch('logout')" 
                  [disabled]="saving || attendanceRecord?.logoutTime || !attendanceRecord?.loginTime"
                  class="w-full py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-200 shadow-premium flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed"
                  [ngClass]="attendanceRecord?.logoutTime ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shadow-none' : (!attendanceRecord?.loginTime ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 border border-slate-200 dark:border-slate-700 shadow-none' : 'bg-amber-600 hover:bg-amber-700 text-white')">
            <span *ngIf="saving">Saving...</span>
            <span *ngIf="!saving && !attendanceRecord?.logoutTime">Save Logout Time 📂</span>
            <span *ngIf="!saving && attendanceRecord?.logoutTime">Punch-Out Recorded ✓</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .shadow-soft {
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
    }
  `]
})
export class StaffMyAttendanceComponent implements OnInit, OnDestroy {
  currentTime = '';
  currentDate = new Date();
  attendanceRecord: any = null;
  saving = false;
  private timerId: any;

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    this.updateClock();
    this.timerId = setInterval(() => this.updateClock(), 1000);
    this.loadTodayAttendance();
  }

  ngOnDestroy() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  updateClock() {
    const now = new Date();
    this.currentTime = now.toLocaleTimeString();
  }

  formatTime12Hour(timeStr: string | null | undefined): string {
    if (!timeStr) return '--:--:--';
    if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
      return timeStr;
    }
    const parts = timeStr.split(':');
    if (parts.length < 2) return timeStr;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    const seconds = parts.length > 2 ? parts[2] : '00';
    if (isNaN(hours)) return timeStr;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // the hour '0' should be '12'
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  }

  loadTodayAttendance() {
    this.dataService.getTodayStaffAttendance().subscribe({
      next: (res) => {
        if (res && res.status === 'success') {
          this.attendanceRecord = res.data;
        }
      },
      error: () => {
        this.toastService.error('Failed to load today\'s attendance status');
      }
    });
  }

  savePunch(type: 'login' | 'logout') {
    this.saving = true;
    const now = new Date();
    const timeStr = now.toTimeString().split(' ')[0]; // HH:mm:ss format

    const payload: any = {};
    if (type === 'login') {
      payload.loginTime = timeStr;
    } else {
      payload.logoutTime = timeStr;
    }

    this.dataService.saveStaffAttendance(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res && res.status === 'success') {
          this.attendanceRecord = res.data;
          this.toastService.success(`Punch-${type === 'login' ? 'in' : 'out'} recorded successfully!`);
        } else {
          this.toastService.error(res.message || 'Failed to save attendance time');
        }
      },
      error: (err) => {
        this.saving = false;
        this.toastService.error(err?.error?.message || 'Error occurred while saving attendance');
      }
    });
  }
}
