import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { RouterModule } from '@angular/router';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-staff-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, SearchableSelectComponent, RouterModule, CustomFieldsRendererComponent],
  template: `
    <div class="p-4 sm:p-6 space-y-6">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Schedule Class</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">Plan your teaching topics for today</p>
        </div>
        
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <!-- Date & Clone Group -->
          <div class="flex items-center justify-between sm:justify-start bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-1 shadow-sm">
            <button (click)="changeDate(-1)" class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-xs">◀</button>
            <div class="relative flex items-center">
              <span class="absolute left-3 text-[10px]">📅</span>
              <input type="date" [(ngModel)]="selectedDate" (change)="loadSchedule()"
                     class="pl-8 pr-2 py-2 bg-transparent border-none outline-none text-[10px] font-black text-slate-700 dark:text-slate-200 uppercase tracking-widest cursor-pointer w-32 sm:w-auto">
            </div>
            <button (click)="changeDate(1)" class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-xs">▶</button>
            <div class="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button *ngIf="isToday() && (!isAdmin || adminAsStaffEnabled)" (click)="clonePreviousDay()"
                    [disabled]="loading"
                    class="p-2.5 hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-all text-emerald-600"
                    title="Clone Previous day">
              <span class="text-lg">📋</span>
            </button>
          </div>

          <!-- Main Action Button -->
          <div class="relative w-full sm:w-auto" *ngIf="isToday() && (!isAdmin || adminAsStaffEnabled)">
            <button (click)="showDropdown = !showDropdown"
                    class="w-full bg-primary-600 text-white font-black text-[10px] uppercase tracking-widest px-6 py-4 rounded-2xl shadow-lg shadow-primary-200 dark:shadow-none hover:bg-primary-700 transition-all flex items-center justify-center gap-2">
              <span>📅</span> Schedule Today's Class <span class="text-[8px] opacity-70">▼</span>
            </button>
            
            <div *ngIf="showDropdown" 
                 class="absolute right-0 mt-2 w-full sm:w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-50 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <button (click)="prepareSchedule('normal')"
                      class="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors">
                <span class="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center text-emerald-600">✍️</span>
                <div>
                  <p class="text-sm font-black text-slate-800 dark:text-white">Today's Class</p>
                  <p class="text-[10px] font-medium text-slate-500">Schedule your regular session</p>
                </div>
              </button>
              <button (click)="prepareSchedule('substitute')"
                      class="w-full px-4 py-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800 flex items-center gap-3 transition-colors border-t border-slate-50 dark:border-slate-800">
                <span class="w-8 h-8 rounded-lg bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-primary-600">🔄</span>
                <div>
                  <p class="text-sm font-black text-slate-800 dark:text-white">Substitute Class</p>
                  <p class="text-[10px] font-medium text-slate-500">Handle class for colleague</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Staff Filter (Only for Admin) -->
      <div *ngIf="isAdmin" class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col sm:flex-row sm:items-center gap-4">
        <label class="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] whitespace-nowrap ml-2">Staff Filter:</label>
        <div class="flex-grow max-w-md w-full">
          <app-searchable-select 
            [(modelValue)]="selectedStaffId"
            [options]="[{id: 'all', name: 'Show All Staff Schedules'}, ...allStaff]"
            placeholder="Search staff..."
            labelKey="name"
            (onChange)="loadSchedule()"
          ></app-searchable-select>
        </div>
      </div>

      <!-- Today's Schedule -->
      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        <div *ngFor="let item of schedule" 
             class="bg-white dark:bg-slate-900 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 shadow-soft group hover:border-primary-500/30 hover:shadow-premium transition-all">
          <div class="flex items-start justify-between mb-6">
             <div class="w-14 h-14 rounded-[1.25rem] bg-primary-50 dark:bg-primary-900/20 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
               {{ item.batch_id ? '⏱️' : '👤' }}
             </div>
             <div class="flex flex-col items-end gap-2">
               <span class="px-3 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-[10px] uppercase font-black tracking-widest rounded-lg">
                 {{ item.status }}
               </span>
                <div class="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span *ngIf="item.staff_on_leave_id" class="text-[8px] font-black text-rose-500 uppercase tracking-widest bg-rose-50 dark:bg-rose-900/20 px-2 py-0.5 rounded-md mr-1">Substitute</span>
                  <button *ngIf="canManage(item)" (click)="editSchedule(item)" 
                          class="p-2 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-all"
                          title="Edit">
                    ✏️
                  </button>
                  <button *ngIf="canManage(item)" (click)="deleteSchedule(item.id)" 
                          class="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-xl transition-all"
                          title="Delete">
                    🗑️
                  </button>
               </div>
             </div>
          </div>
          
          <h3 class="text-xl font-black text-slate-800 dark:text-white mb-1 truncate">
            {{ item.batch_name || item.student_name }}
          </h3>
          <p *ngIf="item.course_name" class="text-[10px] font-black text-primary-600 uppercase tracking-[0.2em] mb-3">
            {{ item.course_name }}
          </p>
          <div class="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl mb-6">
            <p class="text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed italic line-clamp-2">
              "{{ item.topic || 'No topic specified' }}"
            </p>
          </div>

          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div class="flex flex-col gap-2">
              <div class="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                <span>🕒</span> {{ formatTime(item.start_time) }} - {{ formatTime(item.end_time) }}
              </div>
              <div *ngIf="isAdmin" class="inline-flex items-center gap-1.5 self-start px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[9px] font-black rounded-md uppercase tracking-widest">
                👤 {{ item.instructor_name }}
              </div>
            </div>
            
            <a *ngIf="canManage(item)" [routerLink]="['/staff/attendance']" 
               [queryParams]="{ 
                 batch_id: item.batch_id, 
                 student_id: item.student_id, 
                 scheduled_class_id: item.id,
                 staff_on_leave_id: item.staff_on_leave_id,
                 mode: item.batch_id ? 'batch' : 'one-to-one'
               }"
               class="px-5 py-2.5 bg-primary-600 text-white text-[10px] font-black rounded-xl hover:bg-primary-700 transition-all shadow-lg shadow-primary-500/10 text-center uppercase tracking-widest">
              Attendance
            </a>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="schedule.length === 0 && !loading" 
             class="col-span-full py-20 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-800/20 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-slate-800 px-6 text-center">
          <span class="text-6xl mb-6">🏜️</span>
          <p class="text-slate-500 dark:text-slate-400 font-black text-2xl">No classes captured.</p>
          <p class="text-slate-400 text-sm mt-2 max-w-xs font-medium">The schedule is clean for this date. Ready to start teaching?</p>
        </div>
      </div>
    </div>

    <!-- Schedule Modal -->
    <app-modal [isOpen]="isModalOpen" [title]="getModalTitle()" actionLabel="Commit Schedule" 
               (onClose)="isModalOpen = false" (onSubmit)="saveSchedule()" size="md">
      <div class="space-y-6">
        <!-- substitute Mode Banner -->
        <div *ngIf="isSubstituteMode" class="p-5 bg-rose-50 dark:bg-rose-900/20 rounded-2xl border border-rose-100 dark:border-rose-800 flex items-start gap-4">
          <span class="text-xl">🔄</span>
          <div>
            <p class="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest mb-1">Substitute Protocol</p>
            <p class="text-[10px] text-rose-500 font-medium leading-relaxed">You are managing a class for a colleague on leave.</p>
          </div>
        </div>

        <!-- Staff Selection (Only for Substitute Mode) -->
        <div *ngIf="isSubstituteMode" class="space-y-2">
          <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Staff on Leave <span class="text-rose-500">*</span></label>
          <app-searchable-select 
            [(modelValue)]="newSchedule.staff_on_leave_id"
            [options]="allStaff"
            placeholder="Select Staff..."
            searchPlaceholder="Search name..."
            labelKey="name"
            (onChange)="onStaffOnLeaveChange()"
          ></app-searchable-select>
        </div>

          <div class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Target Type</label>
            <select [(ngModel)]="newSchedule.targetType" (change)="onTargetTypeChange()"
                    class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary-500/50 transition-all">
              <option value="batch">Group Batch</option>
              <option value="student">Individual Student</option>
            </select>
          </div>

          <div *ngIf="newSchedule.targetType === 'batch'" class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Course <span class="text-rose-500">*</span></label>
            <app-searchable-select
              [(modelValue)]="newSchedule.course_id"
              [options]="myCourses"
              placeholder="Select Course..."
              labelKey="name"
              subLabelKey="course_id"
              (onChange)="onCourseChange()"
            ></app-searchable-select>
          </div>

          <div *ngIf="newSchedule.targetType === 'batch'" class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Batch <span class="text-rose-500">*</span></label>
            <app-searchable-select
              [(modelValue)]="newSchedule.batch_id"
              [options]="filteredBatches"
              placeholder="Select Batch..."
              labelKey="batch_name"
              subLabelKey="course_name"
              (onChange)="onBatchChange($event)"
            ></app-searchable-select>
          </div>

          <div *ngIf="newSchedule.targetType === 'student'" class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Course <span class="text-rose-500">*</span></label>
            <app-searchable-select
              [(modelValue)]="newSchedule.course_id"
              [options]="myCourses"
              placeholder="Select Course..."
              labelKey="name"
              subLabelKey="course_id"
              (onChange)="onCourseChange()"
            ></app-searchable-select>
          </div>

          <div *ngIf="newSchedule.targetType === 'student'" class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Select Student <span class="text-rose-500">*</span></label>
            <app-searchable-select
              [(modelValue)]="newSchedule.student_id"
              [options]="filteredStudents"
              placeholder="Select Student..."
              labelKey="name"
              subLabelKey="course_name"
              (onChange)="onStudentChange($event)"
            ></app-searchable-select>
          </div>

        <div class="space-y-2">
          <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Session Topic <span class="text-rose-500">*</span></label>
          <input type="text" [(ngModel)]="newSchedule.topic" placeholder="What will you teach today?"
                 class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary-500/50 transition-all shadow-inner">
        </div>

        <div class="grid grid-cols-2 gap-4">
          <div class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Starts At</label>
            <input type="time" [(ngModel)]="newSchedule.start_time"
                   class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary-500/50 transition-all">
          </div>
          <div class="space-y-2">
            <label class="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ends At</label>
            <input type="time" [(ngModel)]="newSchedule.end_time"
                   class="w-full px-5 py-3.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-sm text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary-500/50 transition-all">
          </div>
        </div>

        <!-- Custom Fields -->
        <div class="pt-4">
          <app-custom-fields-renderer [location]="isSubstituteMode ? 'substitute_schedule' : 'schedule_class'" [entityId]="newSchedule.id"></app-custom-fields-renderer>
        </div>
      </div>
    </app-modal>
  `
})
export class StaffScheduleComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  schedule: any[] = [];
  myBatches: any[] = [];
  myStudents: any[] = [];
  myCourses: any[] = [];
  allStaff: any[] = [];

  loading = true;
  isModalOpen = false;
  showDropdown = false;
  isSubstituteMode = false;
  selectedDate = new Date().toLocaleDateString('sv-SE');

  newSchedule: any = {
    targetType: 'batch',
    course_id: null,
    batch_id: null,
    student_id: null,
    staff_on_leave_id: null,
    topic: '',
    start_time: '',
    end_time: '',
    class_date: '',
    id: null
  };

  isAdmin = false;
  adminAsStaffEnabled = false;
  currentUserId: any = null;
  selectedStaffId: any = 'all';

  constructor(private dataService: DataService, private authService: AuthService, private toastService: ToastService) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      if (u) {
        this.isAdmin = u.role_name === 'Admin';
        this.currentUserId = this.isAdmin ? (1000000 + parseInt(u.id)) : u.id;

        if (this.isAdmin) {
          this.dataService.getSettings().subscribe(s => {
            this.adminAsStaffEnabled = s?.admin_as_staff == 1;
          });
        }
      }
    });
    this.loadSchedule();
    this.loadResources();
    this.loadStaff();
  }

  getModalTitle() {
    if (this.newSchedule.id) return 'Edit Scheduled Class';
    return this.isSubstituteMode ? 'Schedule Substitute Class' : 'Schedule New Class';
  }

  get filteredBatches() {
    if (!this.newSchedule.course_id) return this.myBatches;
    return this.myBatches.filter((batch: any) => String(batch.course_id) === String(this.newSchedule.course_id));
  }

  get filteredStudents() {
    if (!this.newSchedule.course_id) return this.myStudents;
    return this.myStudents.filter((student: any) => String(student.course_id) === String(this.newSchedule.course_id));
  }

  loadSchedule() {
    this.loading = true;
    const date = this.selectedDate;
    this.dataService.getMyScheduleWithStaff(date, this.isAdmin ? this.selectedStaffId : undefined).subscribe(res => {
      this.schedule = res.data ?? [];
      this.loading = false;
    });
  }

  canManage(item: any): boolean {
    if (!this.isToday()) return false;
    if (!this.isAdmin) return true; 

    return item.staff_id == this.currentUserId;
  }

  isToday(): boolean {
    return this.selectedDate === new Date().toLocaleDateString('sv-SE');
  }

  clonePreviousDay() {
    if (confirm('This will copy all scheduled classes from the previous day to ' + this.selectedDate + '. Continue?')) {
      this.loading = true;
      this.dataService.clonePreviousSchedule(this.selectedDate).subscribe(res => {
        this.toastService.success(res.message);
        this.loadSchedule();
      });
    }
  }

  loadResources() {
    this.dataService.getMyCourses().subscribe(res => {
      this.myCourses = res.data ?? [];
      this.ensureSelectedCourseStillValid();
    });
    this.dataService.getMyBatches().subscribe(res => {
      this.myBatches = res.data ?? [];
      this.ensureSelectedTargetStillValid();
    });
    this.dataService.getMyStudents().subscribe(res => {
      this.myStudents = (res.data ?? []).filter((s: any) => !s.batch_id || s.batch_id == 0);
      this.ensureSelectedTargetStillValid();
    });
  }

  loadStaff() {
    this.dataService.getStaff().subscribe(staff => {
      this.allStaff = staff;
    });
  }

  changeDate(days: number) {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + days);
    this.selectedDate = d.toLocaleDateString('sv-SE');
    this.loadSchedule();
  }

  editSchedule(item: any) {
    this.isSubstituteMode = item.staff_on_leave_id ? true : false;
    this.newSchedule = {
      id: item.id,
      targetType: item.batch_id ? 'batch' : 'student',
      course_id: item.course_id ?? null,
      batch_id: item.batch_id,
      student_id: item.student_id,
      staff_on_leave_id: item.staff_on_leave_id,
      topic: item.topic,
      start_time: item.start_time,
      end_time: item.end_time,
      class_date: item.class_date
    };

    if (this.isSubstituteMode) {
      this.onStaffOnLeaveChange();
    } else {
      this.loadResources();
    }

    this.isModalOpen = true;
  }

  onStaffOnLeaveChange() {
    if (this.newSchedule.staff_on_leave_id) {
      this.dataService.getStaffResources(this.newSchedule.staff_on_leave_id).subscribe(res => {
        this.myBatches = res.data.batches ?? [];
        this.myStudents = (res.data.students ?? []).filter((s: any) => !s.batch_id || s.batch_id == 0);
        this.myCourses = this.buildCourseOptions(this.myBatches, this.myStudents);
        this.ensureSelectedCourseStillValid();
        this.ensureSelectedTargetStillValid();
      });
    } else {
      this.loadResources();
    }
  }

  prepareSchedule(mode: 'normal' | 'substitute') {
    this.isSubstituteMode = mode === 'substitute';
    this.showDropdown = false;
    this.newSchedule = this.createEmptySchedule();

    if (!this.isSubstituteMode) {
      this.loadResources();
    }

    this.isModalOpen = true;
  }

  onTargetTypeChange() {
    this.newSchedule.batch_id = null;
    this.newSchedule.student_id = null;
    this.ensureSelectedCourseStillValid();
  }

  onCourseChange() {
    if (this.newSchedule.targetType === 'batch') {
      const selectedBatch = this.filteredBatches.find((batch: any) => String(batch.id) === String(this.newSchedule.batch_id));
      if (!selectedBatch) {
        this.newSchedule.batch_id = null;
      }
    } else {
      const selectedStudent = this.filteredStudents.find((student: any) => String(student.id) === String(this.newSchedule.student_id));
      if (!selectedStudent) {
        this.newSchedule.student_id = null;
      }
    }
  }

  onBatchChange(selectedBatch: any) {
    this.newSchedule.batch_id = selectedBatch?.id ?? null;
    this.newSchedule.student_id = null;
    this.newSchedule.course_id = selectedBatch?.course_id ?? this.newSchedule.course_id ?? null;
  }

  onStudentChange(selectedStudent: any) {
    this.newSchedule.student_id = selectedStudent?.id ?? null;
    this.newSchedule.batch_id = null;
    this.newSchedule.course_id = selectedStudent?.course_id ?? this.newSchedule.course_id ?? null;
  }

  saveSchedule() {
    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    if (!this.newSchedule.course_id) {
      this.toastService.warning('Please select a course.');
      return;
    }

    if (this.newSchedule.targetType === 'batch' && !this.newSchedule.batch_id) {
      this.toastService.warning('Please select a batch.');
      return;
    }

    if (this.newSchedule.targetType === 'student' && !this.newSchedule.student_id) {
      this.toastService.warning('Please select a student.');
      return;
    }

    const payload = { ...this.newSchedule };
    delete payload.targetType;
    payload.class_date = this.selectedDate;
    payload.status = payload.status || 'scheduled';
    if (this.newSchedule.targetType === 'batch') {
      payload.student_id = null;
    } else {
      payload.batch_id = null;
    }
    if (!payload.staff_on_leave_id) {
      payload.staff_on_leave_id = null;
    }

    // Merge custom fields
    if (this.customFieldsRenderer) {
      payload.custom_fields = this.customFieldsRenderer.getValues();
    }

    this.dataService.scheduleClass(payload).subscribe({
      next: () => {
        this.isModalOpen = false;
        this.toastService.success(this.newSchedule.id ? 'Schedule updated' : 'Schedule committed');
        this.loadSchedule();
        this.newSchedule = this.createEmptySchedule();
        this.isSubstituteMode = false;
      },
      error: (error) => {
        this.toastService.error(error?.error?.message || 'Unable to save schedule');
      }
    });
  }

  deleteSchedule(id: string) {
    if (confirm('Are you sure you want to delete this scheduled class? This action cannot be undone.')) {
      this.dataService.deleteSchedule(id).subscribe(() => {
        this.loadSchedule();
        this.toastService.success('Schedule deleted');
      });
    }
  }

  private createEmptySchedule() {
    return {
      targetType: 'batch',
      course_id: null,
      batch_id: null,
      student_id: null,
      staff_on_leave_id: this.isSubstituteMode ? this.newSchedule?.staff_on_leave_id ?? null : null,
      topic: '',
      start_time: '',
      end_time: '',
      class_date: this.selectedDate,
      id: null
    };
  }

  private buildCourseOptions(batches: any[], students: any[]) {
    const options = new Map<string, any>();
    [...batches, ...students].forEach((item: any) => {
      if (!item?.course_id) {
        return;
      }
      const key = String(item.course_id);
      if (!options.has(key)) {
        options.set(key, {
          id: item.course_id,
          name: item.course_name || `Course ${item.course_id}`,
          course_id: item.course_id
        });
      }
    });
    return Array.from(options.values());
  }

  private ensureSelectedCourseStillValid() {
    if (!this.newSchedule.course_id) {
      return;
    }
    const exists = this.myCourses.some((course: any) => String(course.id) === String(this.newSchedule.course_id));
    if (!exists) {
      this.newSchedule.course_id = null;
      this.newSchedule.batch_id = null;
      this.newSchedule.student_id = null;
    }
  }

  private ensureSelectedTargetStillValid() {
    if (this.newSchedule.targetType === 'batch' && this.newSchedule.batch_id) {
      const exists = this.myBatches.some((batch: any) => String(batch.id) === String(this.newSchedule.batch_id));
      if (!exists) {
        this.newSchedule.batch_id = null;
      }
    }

    if (this.newSchedule.targetType === 'student' && this.newSchedule.student_id) {
      const exists = this.myStudents.some((student: any) => String(student.id) === String(this.newSchedule.student_id));
      if (!exists) {
        this.newSchedule.student_id = null;
      }
    }
  }

  formatTime(time: string): string {
    if (!time) return '--:--';
    const parts = time.split(':');
    let h = parseInt(parts[0]);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // the hour '0' should be '12'
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  }
}
