import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-staff-attendance',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div [class.p-4]="!isEmbedded" [class.sm:p-6]="!isEmbedded" class="space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Register Presence</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">Mark daily student presence and taught topics</p>
          <div *ngIf="staffOnLeaveId" class="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest rounded-lg">
            <span>🔄</span> Substitute Active
          </div>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div *ngIf="!isEmbedded" class="flex items-center justify-between sm:justify-start bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shadow-sm">
            <button (click)="changeDate(-1)" class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-xs">◀</button>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-[10px]">📅</span>
              <input type="date" [(ngModel)]="selectedDate" (change)="selectedTarget ? loadTodaySchedule() : null"
                     class="pl-8 pr-2 py-2 bg-transparent border-none outline-none text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest cursor-pointer w-32 sm:w-auto">
            </div>
            <button (click)="changeDate(1)" class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all text-xs">▶</button>
          </div>

          <div class="flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shadow-sm">
            <button (click)="attendanceType = 'batch'; onTypeChange()"
                    [class]="attendanceType === 'batch' ? 'bg-primary-600 text-white shadow-premium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'"
                    class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest">Groups</button>
            <button (click)="attendanceType = 'one-to-one'; onTypeChange()"
                    [class]="attendanceType === 'one-to-one' ? 'bg-primary-600 text-white shadow-premium' : 'text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800'"
                    class="flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black transition-all uppercase tracking-widest">1-to-1</button>
          </div>
        </div>
      </div>

      <div class="flex flex-col lg:flex-row gap-8">
        <!-- Selection Sidebar -->
        <div class="w-full lg:w-80 flex flex-col gap-6">
          <div class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft">
            <div class="flex items-center justify-between mb-6">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                {{ attendanceType === 'batch' ? 'Select Group' : 'Select Student' }}
              </label>
              <span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
            </div>

            <!-- Sidebar Search -->
            <div class="mb-6 relative">
              <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
              <input type="text" 
                     [(ngModel)]="sidebarSearch"
                     placeholder="Quick search..."
                     class="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-[10px] font-black text-slate-800 dark:text-white outline-none ring-2 ring-transparent focus:ring-primary-500/10 transition-all uppercase tracking-widest">
            </div>
            
            <div class="flex lg:flex-col gap-3 overflow-x-auto lg:overflow-y-auto lg:max-h-[400px] pb-4 lg:pb-0 custom-scrollbar">
              <ng-container *ngIf="attendanceType === 'batch'">
                <button *ngFor="let b of filteredBatches" 
                        (click)="selectTarget(b)"
                        [class.border-primary-500]="selectedTarget?.id === b.id"
                        [class.bg-primary-50/50]="selectedTarget?.id === b.id"
                        [class.dark:bg-primary-900/10]="selectedTarget?.id === b.id"
                        class="whitespace-nowrap flex-shrink-0 w-64 lg:w-full text-left p-4 lg:p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 hover:border-primary-500/30 transition-all group">
                  <p class="font-black text-sm text-slate-800 dark:text-slate-200 group-hover:text-primary-600 transition-colors truncate">{{ b.batch_name }}</p>
                  <p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate">{{ b.course_name }}</p>
                </button>
              </ng-container>

              <ng-container *ngIf="attendanceType === 'one-to-one'">
                <button *ngFor="let s of filteredStudents" 
                        (click)="selectTarget(s)"
                        [class.border-primary-500]="selectedTarget?.id === s.id"
                        [class.bg-primary-50/50]="selectedTarget?.id === s.id"
                        [class.dark:bg-primary-900/10]="selectedTarget?.id === s.id"
                        class="whitespace-nowrap flex-shrink-0 w-64 lg:w-full text-left p-4 lg:p-5 rounded-2xl border-2 border-slate-50 dark:border-slate-800 hover:border-primary-500/30 transition-all group">
                  <p class="font-black text-sm text-slate-800 dark:text-slate-200 group-hover:text-primary-600 transition-colors truncate">{{ s.name }}</p>
                  <p class="text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mt-1 truncate">{{ s.course_name }}</p>
                </button>
              </ng-container>
              
              <div *ngIf="(attendanceType === 'batch' ? filteredBatches : filteredStudents).length === 0" class="py-10 text-center w-full">
                <p class="text-slate-400 text-[10px] font-black uppercase tracking-widest opacity-60">No targets found</p>
              </div>
            </div>
          </div>

          <div *ngIf="selectedTarget" class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft animate-in fade-in slide-in-from-top-2">
            <div class="flex items-center justify-between mb-6">
              <label class="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Daily Schedule</label>
              <div class="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
            </div>
            <div class="space-y-3">
               <button *ngFor="let c of todaySchedule"
                       (click)="selectedClass = c"
                       [class.border-emerald-500]="selectedClass?.id === c.id"
                       [class.bg-emerald-50/30]="selectedClass?.id === c.id"
                       class="w-full text-left p-4 rounded-2xl border-2 border-slate-50 dark:border-slate-800 hover:border-emerald-500/30 transition-all">
                  <p class="font-black text-sm text-slate-800 dark:text-slate-200 line-clamp-1">{{ c.topic }}</p>
                  <p class="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1">🕒 {{ formatTime(c.start_time) }} - {{ formatTime(c.end_time) }}</p>
               </button>
               <div *ngIf="todaySchedule.length === 0" class="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                 <p class="text-[10px] text-amber-700 dark:text-amber-500 font-bold leading-relaxed italic">
                   No sessions scheduled for this target on {{ selectedDate | date:'mediumDate' }}.
                 </p>
                 <a routerLink="/staff/schedule" class="text-[9px] font-black text-primary-600 uppercase mt-4 inline-flex items-center gap-2 hover:translate-x-1 transition-transform">Update Schedule ➔</a>
               </div>
            </div>
          </div>
        </div>

        <!-- Attendance Table -->
        <div class="flex-1 min-w-0 space-y-8">
          <div *ngIf="!selectedTarget" class="bg-white dark:bg-slate-900 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 h-[400px] flex flex-col items-center justify-center text-center p-8">
            <div class="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-[2rem] flex items-center justify-center text-4xl mb-6">📝</div>
            <p class="text-slate-800 dark:text-white font-black text-2xl mb-2">Awaiting Selection</p>
            <p class="text-slate-500 dark:text-slate-400 text-sm max-w-xs font-medium">Select a teaching target from the sidebar to begin marking rolls.</p>
          </div>

          <div *ngIf="selectedTarget" class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div class="p-6 sm:p-8 border-b border-slate-50 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
               <div>
                 <h3 class="font-black text-xl lg:text-2xl text-slate-800 dark:text-white">Student Roll Call</h3>
                  <p class="text-[10px] text-primary-600 dark:text-primary-400 font-black mt-1 uppercase tracking-[0.2em]">{{ selectedTarget.batch_name || selectedTarget.name }}</p>
               </div>
               <div class="inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-100 dark:border-slate-800">
                 📅 {{ selectedDate | date:'dd MMM yyyy' }}
               </div>
            </div>

            <div class="p-6 sm:p-8 space-y-8">
              <div class="overflow-x-auto -mx-6 sm:mx-0 p-1">
                <table class="w-full min-w-[500px]">
                  <thead>
                    <tr class="text-left text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                      <th class="pb-6 pl-4">Student Information</th>
                      <th class="pb-6 text-center">Status Toggle</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
                    <tr *ngFor="let s of studentRecords" class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td class="py-5 pl-4">
                        <p class="font-black text-slate-800 dark:text-slate-200 text-base group-hover:text-primary-600 transition-colors">{{ s.name }}</p>
                        <p class="text-[10px] text-slate-400 font-bold mt-1 uppercase tracking-widest">Reg: {{ s.reg_number || 'N/A' }} • 📱 {{ s.mobile }}</p>
                      </td>
                      <td class="py-5">
                        <div class="flex items-center justify-center gap-4">
                          <button (click)="s.status = 'present'"
                                  [class]="s.status === 'present' ? 'bg-emerald-500 text-white shadow-xl shadow-emerald-200/50 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'"
                                  class="w-14 h-14 rounded-2xl font-black transition-all text-sm flex flex-col items-center justify-center gap-0.5 group-hover:scale-105 active:scale-95">
                            <span>P</span>
                            <span class="text-[7px] uppercase font-black opacity-60">Present</span>
                          </button>
                          <button (click)="s.status = 'absent'"
                                  [class]="s.status === 'absent' ? 'bg-rose-500 text-white shadow-xl shadow-rose-200/50 dark:shadow-none' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 hover:bg-slate-100'"
                                  class="w-14 h-14 rounded-2xl font-black transition-all text-sm flex flex-col items-center justify-center gap-0.5 group-hover:scale-105 active:scale-95">
                            <span>A</span>
                            <span class="text-[7px] uppercase font-black opacity-60">Absent</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <!-- Taught Description -->
              <div class="pt-8 border-t border-slate-50 dark:border-slate-800">
                <div class="flex items-center justify-between mb-4 px-1">
                  <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Topic Taught Today</label>
                  <span class="text-[9px] text-slate-400 font-black uppercase italic tracking-widest">Optional</span>
                </div>
                <textarea [(ngModel)]="taughtDescription" 
                          rows="4" 
                          class="w-full px-6 py-5 bg-slate-50 dark:bg-slate-800 border-none rounded-[2rem] text-sm text-slate-800 dark:text-white font-bold outline-none ring-4 ring-transparent focus:ring-primary-500/5 transition-all placeholder-slate-400 shadow-inner"
                          placeholder="Describe the session topics..."></textarea>
              </div>

              <div class="flex flex-col sm:flex-row items-center justify-between gap-6 pt-4">
                <div class="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-50 dark:bg-slate-800/50 px-4 py-2 rounded-xl">
                  Total Students: <span class="text-primary-600 ml-1">{{ studentRecords.length }}</span>
                </div>
                <button (click)="saveAttendance()"
                        [disabled]="saving || !selectedClass"
                        class="w-full sm:w-auto px-10 py-4 bg-primary-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-primary-700 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed shadow-premium transition-all flex items-center justify-center gap-3 active:scale-95">
                  <span *ngIf="saving" class="animate-spin">🔄</span>
                  <span>{{ selectedClass ? 'Sync Attendance' : 'Schedule Required' }}</span>
                  <span *ngIf="!saving">📂</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class StaffAttendanceComponent implements OnInit, OnChanges {
  @Input() isEmbedded = false;
  attendanceType: 'batch' | 'one-to-one' = 'batch';
  myBatches: any[] = [];
  myStudents: any[] = [];
  todaySchedule: any[] = [];

  selectedTarget: any = null;
  selectedClass: any = null;
  studentRecords: any[] = [];
  taughtDescription: string = '';

  @Input() selectedDate: string = new Date().toISOString().split('T')[0];
  saving = false;
  staffOnLeaveId: string | null = null;
  sidebarSearch = '';

  get filteredBatches() {
    if (!this.sidebarSearch) return this.myBatches;
    const q = this.sidebarSearch.toLowerCase();
    return this.myBatches.filter(b =>
      b.batch_name.toLowerCase().includes(q) ||
      b.course_name.toLowerCase().includes(q)
    );
  }

  get filteredStudents() {
    if (!this.sidebarSearch) return this.myStudents;
    const q = this.sidebarSearch.toLowerCase();
    return this.myStudents.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.course_name.toLowerCase().includes(q)
    );
  }

  constructor(private dataService: DataService, private route: ActivatedRoute, private toastService: ToastService) { }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['selectedDate'] && !changes['selectedDate'].firstChange) {
      if (this.selectedTarget) {
        this.loadTodaySchedule();
      }
    }
  }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['mode']) this.attendanceType = params['mode'] as 'batch' | 'one-to-one';
      this.staffOnLeaveId = params['staff_on_leave_id'] || null;

      this.loadResources(() => {
        if (params['batch_id'] || params['student_id']) {
          const targetId = params['batch_id'] || params['student_id'];
          const collection = this.attendanceType === 'batch' ? this.myBatches : this.myStudents;
          const found = collection.find(c => c.id == targetId);
          if (found) {
            this.selectTarget(found);
            if (params['scheduled_class_id']) {
              // Wait for schedule to load
              const checkSchedule = setInterval(() => {
                if (this.todaySchedule.length > 0) {
                  const cls = this.todaySchedule.find(c => c.id == params['scheduled_class_id']);
                  if (cls) {
                    this.selectedClass = cls;
                    this.taughtDescription = cls.topic;
                  }
                  clearInterval(checkSchedule);
                }
              }, 100);
              setTimeout(() => clearInterval(checkSchedule), 3000); // safety
            }
          }
        }
      });
    });
  }

  loadResources(callback?: () => void) {
    if (this.staffOnLeaveId) {
      this.dataService.getStaffResources(this.staffOnLeaveId).subscribe(res => {
        this.myBatches = res.data.batches;
        this.myStudents = res.data.students.filter((s: any) => !s.batch_id || s.batch_id == 0);
        if (callback) callback();
      });
    } else {
      this.dataService.getMyBatches().subscribe(res => {
        this.myBatches = res.data;
        this.dataService.getMyStudents().subscribe(res2 => {
          this.myStudents = res2.data.filter((s: any) => !s.batch_id || s.batch_id == 0);
          if (callback) callback();
        });
      });
    }
  }

  onTypeChange() {
    this.selectedTarget = null;
    this.selectedClass = null;
    this.studentRecords = [];
    this.todaySchedule = [];
  }

  selectTarget(target: any) {
    this.selectedTarget = target;
    this.selectedClass = null;
    this.taughtDescription = '';
    this.loadTodaySchedule();
    this.loadStudents();
  }

  changeDate(days: number) {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + days);
    this.selectedDate = d.toISOString().split('T')[0];
    if (this.selectedTarget) {
      this.loadTodaySchedule();
    }
  }

  loadTodaySchedule() {
    this.dataService.getMySchedule(this.selectedDate).subscribe(res => {
      if (this.attendanceType === 'batch') {
        this.todaySchedule = res.data.filter((c: any) => c.batch_id == this.selectedTarget.id);
      } else {
        this.todaySchedule = res.data.filter((c: any) => c.student_id == this.selectedTarget.id);
      }

      // Auto-select if only one
      if (this.todaySchedule.length === 1 && !this.selectedClass) {
        this.selectedClass = this.todaySchedule[0];
        this.taughtDescription = this.selectedClass.topic;
      }
    });
  }

  loadStudents() {
    if (this.attendanceType === 'batch') {
      this.dataService.getStudentsByBatch(this.selectedTarget.id).subscribe((res: any) => {
        this.studentRecords = res.data.map((s: any) => ({ ...s, status: 'present' }));
      });
    } else {
      this.studentRecords = [{ ...this.selectedTarget, status: 'present' }];
    }
  }

  saveAttendance() {
    if (!this.selectedClass) return;

    this.saving = true;
    const payload = {
      batch_id: this.attendanceType === 'batch' ? this.selectedTarget.id : null,
      scheduled_class_id: this.selectedClass.id,
      date: this.selectedDate,
      description: this.taughtDescription,
      records: this.studentRecords.map(s => ({ student_id: s.id, status: s.status }))
    };

    this.dataService.saveAttendance(payload).subscribe({
      next: () => {
        this.saving = false;
        this.toastService.success('Attendance saved successfully!');
        this.onTypeChange();
      },
      error: (err: any) => {
        this.saving = false;
        const msg = err?.error?.message || 'Error saving attendance';
        this.toastService.error(msg);
      }
    });
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
