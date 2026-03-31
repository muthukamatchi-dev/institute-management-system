import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { StaffAttendanceComponent } from '../staff/staff-attendance.component';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SearchableSelectComponent, BadgeComponent, StaffAttendanceComponent],
  template: `
    <div class="p-6 space-y-8">
      <!-- Admin Tab Switcher -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
      <div *ngIf="isAdmin && !adminAsStaffEnabled">
        <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Attendance Browser</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1">Review and manage student presence across all modules</p>
      </div>
      <div *ngIf="isAdmin && adminAsStaffEnabled" class="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-1 bg-slate-100 dark:bg-slate-900 w-full sm:w-fit rounded-2xl">
        <button (click)="activeTab = 'marking'" [class.bg-white]="activeTab === 'marking'"
            [class.dark:bg-slate-800]="activeTab === 'marking'" [class.shadow-xl]="activeTab === 'marking'"
            class="flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            [class.text-slate-800]="activeTab === 'marking'" [class.text-slate-400]="activeTab !== 'marking'">
            File Attendance
        </button>
        <button (click)="activeTab = 'overview'" [class.bg-white]="activeTab === 'overview'"
            [class.dark:bg-slate-800]="activeTab === 'overview'" [class.shadow-xl]="activeTab === 'overview'"
            class="flex-1 sm:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
            [class.text-slate-800]="activeTab === 'overview'" [class.text-slate-400]="activeTab !== 'overview'">
            Attendance Overview
        </button>
      </div>
      <div class="flex items-center justify-between bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 w-full sm:w-auto shadow-sm">
          <button (click)="changeDate(-1)" class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-xs">◀</button>
          <div class="relative flex items-center flex-1 sm:flex-none">
            <span class="absolute left-3 text-[10px]">📅</span>
            <input type="date" [(ngModel)]="selectedDate" (change)="loadSchedule()"
                   class="w-full sm:w-auto pl-8 pr-4 py-2 bg-transparent border-none outline-none text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest cursor-pointer text-center">
          </div>
          <button (click)="changeDate(1)" class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-xs">▶</button>
      </div>
      </div>

      <div *ngIf="activeTab === 'marking'">
        <app-staff-attendance [isEmbedded]="true" [selectedDate]="selectedDate"></app-staff-attendance>
      </div>

      <div *ngIf="activeTab === 'overview'" class="space-y-6">
      <div *ngIf="isAdmin && adminAsStaffEnabled">
          <h1 class="text-3xl font-black text-slate-800 dark:text-white tracking-tight">Attendance Browser</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium mt-1">Review and manage student presence across all modules</p>
        </div>

      <!-- Staff Filter (Required for Admin) -->
      <div class="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
        <label class="text-[10px] font-black text-slate-500 uppercase tracking-widest whitespace-nowrap">Filter Instructor:</label>
        <div class="w-full sm:max-w-md">
          <app-searchable-select 
            [(modelValue)]="selectedStaffId"
            [options]="[{id: 'all', name: 'Show All Staff Schedules'}, ...allStaff]"
            placeholder="Search staff..."
            labelKey="name"
            (onChange)="loadSchedule()"
          ></app-searchable-select>
        </div>
      </div>

      <!-- Schedule Cards (Cloned Style) -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div *ngFor="let item of schedule" 
             class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft group hover:border-primary-500/30 transition-all flex flex-col">
          
          <div class="flex items-start justify-between mb-4">
             <div class="w-12 h-12 rounded-2xl bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-xl">
               {{ item.batch_id ? '⏱️' : '👤' }}
             </div>
             <div class="flex flex-col items-end gap-1">
               <app-badge [label]="item.status" [type]="getStatusType(item.status)"></app-badge>
               <span *ngIf="item.staff_on_leave_id" class="text-[9px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md mt-1">Substitute</span>
             </div>
          </div>
          
          <h3 class="text-lg font-black text-slate-800 dark:text-white mb-1">
            {{ item.batch_name || item.student_name }}
          </h3>
          <p *ngIf="item.course_name" class="text-[10px] font-black text-primary-600 uppercase tracking-widest mb-2">
            {{ item.course_name }}
          </p>
          <p class="text-sm text-slate-500 dark:text-slate-400 font-medium mb-4 flex-grow">
            {{ item.topic }}
          </p>

          <div class="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 text-[11px] font-bold text-slate-400">
                <span>🕒</span> {{ formatTime(item.start_time) }} - {{ formatTime(item.end_time) }}
              </div>
              <div class="flex items-center gap-1.5 px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black rounded-lg uppercase tracking-wider w-fit">
                👤 {{ item.instructor_name }}
              </div>
            </div>
            
            <button (click)="viewAttendance(item)" 
                    class="w-10 h-10 flex items-center justify-center bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-xl hover:bg-primary-600 hover:text-white transition-all shadow-sm"
                    title="View Attendance Data">
              <span class="text-lg">👁️</span>
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="schedule.length === 0 && !loading" 
             class="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800">
          <span class="text-5xl mb-4">📅</span>
          <p class="text-slate-500 dark:text-slate-400 font-black text-xl">No classes found for this date.</p>
          <p class="text-slate-400 text-sm mt-1">Try selecting a different date or staff member.</p>
        </div>
        </div>
      </div>
    </div>

    <!-- Attendance Viewer Modal -->
    <app-modal [isOpen]="isViewModalOpen" [title]="'Attendance Details'" [showFooter]="false" 
               (onClose)="isViewModalOpen = false">
      <div *ngIf="selectedClassForView" class="space-y-6">
        <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Class Info</h4>
            <span class="text-[12px] font-bold text-primary-600">{{ selectedDate | date:'fullDate' }}</span>
          </div>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400">Batch/Student  : <span class="text-slate-900 dark:text-slate-200">{{ selectedClassForView.batch_name || selectedClassForView.student_name }}</span></p>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1">Topic  : <span class="text-slate-900 dark:text-slate-200">{{ selectedClassForView.topic }}</span></p>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1">Log  : <span class="italic text-slate-500">{{ classAttendance[0]?.remarks || 'No teaching description provided.' }}</span></p>
        </div>

        <div class="space-y-3">
          <h4 class="text-sm font-black text-slate-500 uppercase tracking-widest px-1">Presence List</h4>
          <div class="max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            <div *ngFor="let record of classAttendance" 
                 class="flex items-center justify-between p-3 mb-2 bg-white dark:bg-slate-900 border border-slate-50 dark:border-slate-800 rounded-xl">
              <div>
                <p class="text-sm font-bold text-slate-800 dark:text-slate-200">{{ record.student_name }}</p>
                <p class="text-[10px] text-slate-500 font-medium">ID: {{ record.reg_number }}</p>
              </div>
              <span [class]="record.status === 'present' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'"
                    class="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider">
                {{ record.status }}
              </span>
            </div>
            <div *ngIf="classAttendance.length === 0" class="py-10 text-center text-slate-400 italic text-sm">
                No attendance records submitted for this class.
            </div>
          </div>
        </div>
      </div>
    </app-modal>
  `
})
export class AttendanceComponent implements OnInit {
  schedule: any[] = [];
  allStaff: any[] = [];
  selectedDate = new Date().toISOString().split('T')[0];
  selectedStaffId: any = 'all';
  loading = true;

  // View Modal State
  isViewModalOpen = false;
  selectedClassForView: any = null;
  classAttendance: any[] = [];

  isAdmin = false;
  adminAsStaffEnabled = false;
  currentUserId: any = null;
  activeTab: 'overview' | 'marking' = 'overview';

  constructor(private dataService: DataService, private authService: AuthService) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      if (u) {
        this.isAdmin = u.role_name === 'Admin';
        this.currentUserId = this.isAdmin ? (1000000 + parseInt(u.id)) : u.id;

        if (this.isAdmin) {
          this.dataService.getSettings().subscribe(s => {
            this.adminAsStaffEnabled = s?.admin_as_staff == 1;
            this.activeTab = this.adminAsStaffEnabled ? 'marking' : 'overview';
          });
        }
      }
    });

    this.loadStaff();
    this.loadSchedule();
  }

  loadStaff() {
    this.dataService.getStaff().subscribe(staff => {
      this.allStaff = staff;
    });
  }

  loadSchedule() {
    this.loading = true;
    this.dataService.getMySchedule(this.selectedDate).subscribe(res => {
      let data = res.data;
      if (this.selectedStaffId !== 'all') {
        data = data.filter((item: any) => item.staff_id == this.selectedStaffId);
      }
      this.schedule = data;
      this.loading = false;
    });
  }

  changeDate(days: number) {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + days);
    this.selectedDate = d.toISOString().split('T')[0];
    this.loadSchedule();
  }

  viewAttendance(item: any) {
    this.selectedClassForView = item;
    this.classAttendance = [];
    this.dataService.getClassAttendance(item.id).subscribe(res => {
      this.classAttendance = res.data;
      this.isViewModalOpen = true;
    });
  }

  getStatusType(status: string): any {
    switch (status?.toLowerCase()) {
      case 'completed': return 'success';
      case 'scheduled': return 'info';
      case 'cancelled': return 'danger';
      default: return 'neutral';
    }
  }

  formatTime(time: string): string {
    if (!time) return '--:--';
    const parts = time.split(':');
    let h = parseInt(parts[0]);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  }
}
