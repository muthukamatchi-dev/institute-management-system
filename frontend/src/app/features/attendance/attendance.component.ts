import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, NavigationEnd } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { StaffAttendanceComponent } from '../staff/staff-attendance.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';
import { forkJoin, Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ModalComponent,
    SearchableSelectComponent,
    BadgeComponent,
    StaffAttendanceComponent,
    DatePickerComponent
  ],
  template: `
    <div class="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <!-- ── TAB 1: FILE ATTENDANCE (STUDENT ROLL CALL) ── -->
      <div *ngIf="activeTab === 'staff-attendance'">
        <app-staff-attendance></app-staff-attendance>
      </div>

      <!-- ── TAB 2: STAFF ATTENDANCE DASHBOARD ── -->
      <div *ngIf="activeTab === 'staff-dashboard'" class="space-y-6">
        <!-- Header Info & Actions -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div class="flex items-center gap-3">
              <h1 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Staff Attendance Dashboard</h1>
              <span *ngIf="isToday()" class="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Today
              </span>
            </div>
            <p class="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">
              Verify daily In & Out punch entries. Staff with both In and Out punches are marked <span class="font-bold text-emerald-500">Present</span>; missing punches are counted as <span class="font-bold text-rose-500">Absent</span>.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <!-- Date Navigator -->
            <div class="flex items-center justify-between bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-1 shadow-sm">
              <button (click)="changeDate(-1)" class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-xs font-black">◀</button>
              <div class="relative flex items-center w-36">
                <app-date-picker [(ngModel)]="selectedDate" (change)="onDateChange()"></app-date-picker>
              </div>
              <button (click)="changeDate(1)" class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-xs font-black">▶</button>
            </div>

            <!-- Refresh Punches Button -->
            <button (click)="loadStaffAttendance()" [disabled]="loadingStaffAttendance"
                    class="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 shadow-sm transition-all w-fit">
              <span [class.animate-spin]="loadingStaffAttendance">🔄</span>
              <span>Refresh Punches</span>
            </button>
          </div>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <!-- Total Staff Card -->
          <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft flex items-center justify-between">
            <div>
              <p class="text-[11px] font-black uppercase tracking-wider text-slate-400">Total Staff</p>
              <h3 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white mt-1">{{ staffAttendanceStats.total }}</h3>
              <p class="text-[10px] font-bold text-slate-500 mt-1">Total active members</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xl shadow-sm">
              👥
            </div>
          </div>

          <!-- Present Today Card -->
          <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-emerald-500/20 dark:border-emerald-500/30 shadow-soft flex items-center justify-between bg-gradient-to-br from-emerald-500/5 to-transparent">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p class="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">Present</p>
              </div>
              <h3 class="text-2xl sm:text-3xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{{ staffAttendanceStats.present }}</h3>
              <p class="text-[10px] font-bold text-slate-500 mt-1">Both In & Out punched</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xl shadow-sm">
              ✅
            </div>
          </div>

          <!-- Absent Today Card -->
          <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-rose-500/20 dark:border-rose-500/30 shadow-soft flex items-center justify-between bg-gradient-to-br from-rose-500/5 to-transparent">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-rose-500"></span>
                <p class="text-[11px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">Absent</p>
              </div>
              <h3 class="text-2xl sm:text-3xl font-black text-rose-600 dark:text-rose-400 mt-1">{{ staffAttendanceStats.absent }}</h3>
              <p class="text-[10px] font-bold text-slate-500 mt-1">Not punched / missing</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 flex items-center justify-center text-xl shadow-sm">
              ❌
            </div>
          </div>

          <!-- In-Progress (Punched In Only) -->
          <div class="bg-white dark:bg-slate-900 p-5 sm:p-6 rounded-3xl border border-amber-500/20 dark:border-amber-500/30 shadow-soft flex items-center justify-between bg-gradient-to-br from-amber-500/5 to-transparent">
            <div>
              <div class="flex items-center gap-1.5">
                <span class="w-2 h-2 rounded-full bg-amber-500"></span>
                <p class="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">In Progress</p>
              </div>
              <h3 class="text-2xl sm:text-3xl font-black text-amber-600 dark:text-amber-400 mt-1">{{ staffAttendanceStats.inProgress }}</h3>
              <p class="text-[10px] font-bold text-slate-500 mt-1">Out punch pending</p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xl shadow-sm">
              ⏳
            </div>
          </div>
        </div>

        <!-- Search and Quick Filter Toolbar -->
        <div class="bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <!-- Search input -->
          <div class="relative flex-1 max-w-md">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-sm">🔍</span>
            <input type="text" [(ngModel)]="staffSearchQuery" placeholder="Search by staff name, ID, role..."
                   class="w-full pl-11 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-xs font-bold text-slate-800 dark:text-white outline-none ring-2 ring-transparent focus:ring-primary-500/20 transition-all">
          </div>

          <!-- Status Filter Tabs -->
          <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button (click)="staffStatusFilter = 'all'"
                    [class]="staffStatusFilter === 'all' ? 'bg-primary-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
                    class="px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap">
              All Staff ({{ staffListWithAttendance.length }})
            </button>
            <button (click)="staffStatusFilter = 'present'"
                    [class]="staffStatusFilter === 'present' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
                    class="px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5">
              <span>✅ Present</span>
              <span class="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{{ staffAttendanceStats.present }}</span>
            </button>
            <button (click)="staffStatusFilter = 'absent'"
                    [class]="staffStatusFilter === 'absent' ? 'bg-rose-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
                    class="px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5">
              <span>❌ Absent</span>
              <span class="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{{ staffAttendanceStats.absent }}</span>
            </button>
            <button (click)="staffStatusFilter = 'in_progress'"
                    [class]="staffStatusFilter === 'in_progress' ? 'bg-amber-600 text-white shadow-sm' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'"
                    class="px-3.5 py-2 rounded-xl text-xs font-black transition-all whitespace-nowrap flex items-center gap-1.5">
              <span>⏳ Punched In</span>
              <span class="px-1.5 py-0.5 rounded-md bg-white/20 text-[10px]">{{ staffAttendanceStats.inProgress }}</span>
            </button>
          </div>
        </div>

        <!-- Staff Attendance List Table -->
        <div class="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-soft overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-black uppercase tracking-wider text-slate-400">
                  <th class="py-4 px-6">Staff Member</th>
                  <th class="py-4 px-6">In Punch (Arrival)</th>
                  <th class="py-4 px-6">Out Punch (Departure)</th>
                  <th class="py-4 px-6">Working Hours</th>
                  <th class="py-4 px-6 text-center">Attendance Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100 dark:divide-slate-800/60">
                <tr *ngFor="let staff of filteredStaffList" class="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors">
                  <!-- Staff Info -->
                  <td class="py-4 px-6">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-500 to-indigo-600 text-white font-black flex items-center justify-center text-sm shadow-sm flex-shrink-0">
                        {{ staff.name ? staff.name.charAt(0).toUpperCase() : 'S' }}
                      </div>
                      <div class="min-w-0">
                        <div class="flex items-center gap-2">
                          <p class="font-black text-sm text-slate-800 dark:text-white truncate">{{ staff.name }}</p>
                          <span *ngIf="staff.staff_id || staff.staffId" class="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 tracking-wider">
                            {{ staff.staff_id || staff.staffId }}
                          </span>
                        </div>
                        <p class="text-xs font-semibold text-slate-400 truncate mt-0.5">
                          {{ staff.designation || staff.role || 'Staff' }}
                          <span *ngIf="staff.mobile" class="text-slate-300 dark:text-slate-600 mx-1">•</span>
                          <span *ngIf="staff.mobile">{{ staff.mobile }}</span>
                        </p>
                      </div>
                    </div>
                  </td>

                  <!-- In Punch -->
                  <td class="py-4 px-6">
                    <div *ngIf="staff.hasIn" class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0 animate-pulse"></span>
                      <div>
                        <p class="text-xs font-black text-slate-800 dark:text-slate-200">{{ staff.formattedLoginTime }}</p>
                        <span class="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-widest">Punched In</span>
                      </div>
                    </div>
                    <div *ngIf="!staff.hasIn" class="flex items-center gap-1.5 text-slate-400">
                      <span class="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span class="text-xs font-bold italic text-slate-400">Not Punched</span>
                    </div>
                  </td>

                  <!-- Out Punch -->
                  <td class="py-4 px-6">
                    <div *ngIf="staff.hasOut" class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0"></span>
                      <div>
                        <p class="text-xs font-black text-slate-800 dark:text-slate-200">{{ staff.formattedLogoutTime }}</p>
                        <span class="text-[9px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">Punched Out</span>
                      </div>
                    </div>
                    <div *ngIf="!staff.hasOut" class="flex items-center gap-1.5 text-slate-400">
                      <span class="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
                      <span class="text-xs font-bold italic text-slate-400">Not Punched</span>
                    </div>
                  </td>

                  <!-- Working Hours -->
                  <td class="py-4 px-6">
                    <div *ngIf="staff.duration !== '—'" class="flex items-center gap-1.5">
                      <span class="text-xs">⏱️</span>
                      <span class="text-xs font-black text-slate-700 dark:text-slate-300">{{ staff.duration }}</span>
                    </div>
                    <span *ngIf="staff.duration === '—'" class="text-xs font-semibold text-slate-400">
                      {{ staff.hasIn ? 'In Progress' : '—' }}
                    </span>
                  </td>

                  <!-- Attendance Status -->
                  <td class="py-4 px-6 text-center">
                    <div class="inline-flex flex-col items-center gap-1">
                      <!-- Present Badge (Both In & Out Punched) -->
                      <div *ngIf="staff.status === 'PRESENT'" class="flex flex-col items-center">
                        <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-sm">
                          <span>✅</span> Present
                        </span>
                        <span class="text-[9px] font-semibold text-emerald-500/80 mt-0.5">In & Out Completed</span>
                      </div>

                      <!-- Absent Badge (No punch records) -->
                      <div *ngIf="staff.status === 'ABSENT'" class="flex flex-col items-center">
                        <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 flex items-center gap-1.5 shadow-sm">
                          <span>❌</span> Absent
                        </span>
                        <span class="text-[9px] font-semibold text-rose-400/80 mt-0.5">No punch today</span>
                      </div>

                      <!-- Punched In Only (Pending Out Punch -> Counted as Absent/Incomplete) -->
                      <div *ngIf="staff.status === 'IN_PROGRESS'" class="flex flex-col items-center">
                        <span class="px-3 py-1 rounded-xl text-xs font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 flex items-center gap-1.5 shadow-sm">
                          <span>⏳</span> Incomplete
                        </span>
                        <span class="text-[9px] font-semibold text-amber-500/80 mt-0.5">Absent (Out Pending)</span>
                      </div>
                    </div>
                  </td>
                </tr>

                <!-- Empty Filter Results -->
                <tr *ngIf="filteredStaffList.length === 0 && !loadingStaffAttendance">
                  <td colspan="5" class="py-16 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <span class="text-4xl mb-3">👥</span>
                      <p class="text-sm font-black text-slate-700 dark:text-slate-300">No staff found matching criteria</p>
                      <p class="text-xs text-slate-400 mt-1">Try searching a different keyword or resetting your filter</p>
                    </div>
                  </td>
                </tr>

                <!-- Loading State -->
                <tr *ngIf="loadingStaffAttendance">
                  <td colspan="5" class="py-16 text-center">
                    <div class="flex flex-col items-center justify-center gap-2">
                      <div class="w-8 h-8 border-3 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                      <p class="text-xs font-bold text-slate-400">Loading staff attendance records...</p>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ── TAB 3: STUDENT ATTENDANCE DASHBOARD ── -->
      <div *ngIf="activeTab === 'overview' || activeTab === 'marking'" class="space-y-6">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Student Attendance Dashboard</h1>
            <p class="text-slate-500 dark:text-slate-400 font-medium mt-1">Review and manage student presence across all modules</p>
          </div>

          <!-- Date Navigator -->
          <div class="flex items-center justify-between bg-white dark:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 p-1 w-full sm:w-auto shadow-sm">
            <button (click)="changeDate(-1)" class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-xs font-black">◀</button>
            <div class="relative flex items-center flex-1 sm:flex-none w-36">
              <app-date-picker [(ngModel)]="selectedDate" (change)="onDateChange()"></app-date-picker>
            </div>
            <button (click)="changeDate(1)" class="p-2.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all text-xs font-black">▶</button>
          </div>
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

        <!-- Schedule Cards -->
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

    <!-- Attendance Details Modal -->
    <app-modal [isOpen]="isViewModalOpen" [title]="'Attendance Details'" [showFooter]="false" 
               (onClose)="isViewModalOpen = false">
      <div *ngIf="selectedClassForView" class="space-y-6">
        <div class="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700">
          <div class="flex items-center justify-between mb-2">
            <h4 class="text-sm font-black text-slate-800 dark:text-white uppercase tracking-wider">Class Info</h4>
            <span class="text-[12px] font-bold text-primary-600">{{ selectedDate | date:'fullDate' }}</span>
          </div>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400">Batch/Student : <span class="text-slate-900 dark:text-slate-200">{{ selectedClassForView.batch_name || selectedClassForView.student_name }}</span></p>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1">Topic : <span class="text-slate-900 dark:text-slate-200">{{ selectedClassForView.topic }}</span></p>
          <p class="text-sm font-bold text-slate-600 dark:text-slate-400 mt-1">Log : <span class="italic text-slate-500">{{ classAttendance[0]?.remarks || 'No teaching description provided.' }}</span></p>
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
export class AttendanceComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  private routerSub?: Subscription;

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
  activeTab: 'overview' | 'marking' | 'staff-dashboard' | 'staff-attendance' = 'marking';

  // Staff Attendance Dashboard State
  staffListWithAttendance: any[] = [];
  staffSearchQuery = '';
  staffStatusFilter: 'all' | 'present' | 'absent' | 'in_progress' = 'all';
  loadingStaffAttendance = false;
  staffAttendanceStats = {
    total: 0,
    present: 0,
    absent: 0,
    inProgress: 0,
    rate: 0
  };

  constructor(private dataService: DataService, private authService: AuthService) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      if (u) {
        this.isAdmin = u.role_name === 'Admin';
        this.currentUserId = this.isAdmin ? (1000000 + parseInt(u.id)) : u.id;

        if (this.isAdmin) {
          this.dataService.getSettings().subscribe(s => {
            this.adminAsStaffEnabled = s != null && (s.admin_as_staff == 1 || s.admin_as_staff === true || s.adminAsStaff == 1 || s.adminAsStaff === true || s.admin_as_staff === '1');
            if (!this.adminAsStaffEnabled && this.activeTab === 'staff-attendance') {
              this.router.navigate(['/attendance/student-dashboard'], { replaceUrl: true });
              this.activeTab = 'marking';
              this.loadSchedule();
            }
          });
        }
      }
    });

    this.loadStaff();
    this.syncTabWithUrl();

    this.routerSub = this.router.events
      .pipe(filter(e => e instanceof NavigationEnd))
      .subscribe(() => {
        this.syncTabWithUrl();
      });
  }

  ngOnDestroy() {
    this.routerSub?.unsubscribe();
  }

  syncTabWithUrl() {
    const url = this.router.url;
    if (url.includes('/attendance/staff-dashboard')) {
      this.activeTab = 'staff-dashboard';
      this.loadStaffAttendance();
    } else if (url.includes('/attendance/file')) {
      if (this.isAdmin && !this.adminAsStaffEnabled) {
        this.router.navigate(['/attendance/student-dashboard'], { replaceUrl: true });
        this.activeTab = 'marking';
        this.loadSchedule();
      } else {
        this.activeTab = 'staff-attendance';
      }
    } else {
      this.activeTab = 'marking';
      this.loadSchedule();
      if (url === '/attendance' || url.startsWith('/attendance?')) {
        this.router.navigate(['/attendance/student-dashboard'], { replaceUrl: true, queryParamsHandling: 'preserve' });
      }
    }
  }

  setActiveTab(tab: 'marking' | 'staff-dashboard' | 'staff-attendance') {
    this.activeTab = tab;
    if (tab === 'staff-dashboard') {
      this.router.navigate(['/attendance/staff-dashboard']);
    } else if (tab === 'staff-attendance') {
      this.router.navigate(['/attendance/file']);
    } else {
      this.router.navigate(['/attendance/student-dashboard']);
    }
  }

  onDateChange() {
    if (this.activeTab === 'staff-dashboard') {
      this.loadStaffAttendance();
    } else {
      this.loadSchedule();
    }
  }

  isToday(): boolean {
    const today = new Date().toISOString().split('T')[0];
    return this.selectedDate === today;
  }

  loadStaff() {
    this.dataService.getStaff().subscribe(staff => {
      this.allStaff = staff || [];
    });
  }

  loadSchedule() {
    this.loading = true;
    this.dataService.getMySchedule(this.selectedDate).subscribe(res => {
      let data = res.data || [];
      if (this.selectedStaffId !== 'all') {
        data = data.filter((item: any) => item.staff_id == this.selectedStaffId);
      }
      this.schedule = data;
      this.loading = false;
    });
  }

  loadStaffAttendance() {
    this.loadingStaffAttendance = true;

    forkJoin({
      staff: this.dataService.getStaff(),
      dayBook: this.dataService.getDayBook(this.selectedDate)
    }).subscribe({
      next: ({ staff, dayBook }) => {
        const attendanceList: any[] = dayBook?.staffAttendance || [];
        const attendanceMap = new Map<string, any>();
        for (const item of attendanceList) {
          attendanceMap.set(String(item.staffId), item);
        }

        const activeStaff = (staff || []).filter((s: any) => (s.status || 'active').toLowerCase() !== 'inactive');

        const list = activeStaff.map((s: any) => {
          const punch = attendanceMap.get(String(s.id));
          const loginTime = punch?.loginTime || null;
          const logoutTime = punch?.logoutTime || null;

          const hasIn = !!loginTime;
          const hasOut = !!logoutTime;

          let status: 'PRESENT' | 'ABSENT' | 'IN_PROGRESS' = 'ABSENT';
          let statusLabel = 'Absent';

          // Rule: If both In and Out punches are created, staff is Present.
          // If neither or only one punch exists, staff is Absent (or pending out punch).
          if (hasIn && hasOut) {
            status = 'PRESENT';
            statusLabel = 'Present';
          } else if (hasIn && !hasOut) {
            status = 'IN_PROGRESS';
            statusLabel = 'Punched In (Pending Out)';
          } else {
            status = 'ABSENT';
            statusLabel = 'Absent';
          }

          const durationStr = this.calculateDuration(loginTime, logoutTime);

          return {
            ...s,
            loginTime,
            logoutTime,
            formattedLoginTime: this.formatPunchTime(loginTime),
            formattedLogoutTime: this.formatPunchTime(logoutTime),
            duration: durationStr,
            status,
            statusLabel,
            hasIn,
            hasOut
          };
        });

        this.staffListWithAttendance = list;
        this.computeStaffStats(list);
        this.loadingStaffAttendance = false;
      },
      error: (err) => {
        console.error('Failed to load staff attendance:', err);
        this.loadingStaffAttendance = false;
      }
    });
  }

  computeStaffStats(list: any[]) {
    const total = list.length;
    const present = list.filter(s => s.status === 'PRESENT').length;
    const inProgress = list.filter(s => s.status === 'IN_PROGRESS').length;
    // Those who have not completed both punches are considered Absent
    const absent = total - present;
    const rate = total > 0 ? Math.round((present / total) * 100) : 0;

    this.staffAttendanceStats = {
      total,
      present,
      absent,
      inProgress,
      rate
    };
  }

  get filteredStaffList() {
    return this.staffListWithAttendance.filter(staff => {
      const query = (this.staffSearchQuery || '').toLowerCase().trim();
      const matchesSearch = !query ||
        (staff.name || '').toLowerCase().includes(query) ||
        (staff.staff_id || staff.staffId || '').toLowerCase().includes(query) ||
        (staff.designation || staff.role || '').toLowerCase().includes(query) ||
        (staff.email || '').toLowerCase().includes(query) ||
        (staff.mobile || '').toLowerCase().includes(query);

      if (!matchesSearch) return false;

      if (this.staffStatusFilter === 'present') {
        return staff.status === 'PRESENT';
      }
      if (this.staffStatusFilter === 'absent') {
        return staff.status === 'ABSENT' || staff.status === 'IN_PROGRESS';
      }
      if (this.staffStatusFilter === 'in_progress') {
        return staff.status === 'IN_PROGRESS';
      }
      return true;
    });
  }

  formatPunchTime(time: string | null): string {
    if (!time) return '—';
    const parts = time.split(':');
    if (parts.length < 2) return time;
    let h = parseInt(parts[0], 10);
    const m = parts[1];
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  }

  calculateDuration(login: string | null, logout: string | null): string {
    if (!login || !logout) return '—';
    try {
      const inParts = login.split(':').map(Number);
      const outParts = logout.split(':').map(Number);
      const inMins = inParts[0] * 60 + inParts[1];
      const outMins = outParts[0] * 60 + outParts[1];
      let diff = outMins - inMins;
      if (diff < 0) diff += 24 * 60;
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      if (h === 0 && m === 0) return '< 1m';
      if (h === 0) return `${m}m`;
      if (m === 0) return `${h}h`;
      return `${h}h ${m}m`;
    } catch {
      return '—';
    }
  }

  changeDate(days: number) {
    const d = new Date(this.selectedDate);
    d.setDate(d.getDate() + days);
    this.selectedDate = d.toISOString().split('T')[0];
    this.onDateChange();
  }

  viewAttendance(item: any) {
    this.selectedClassForView = item;
    this.classAttendance = [];
    this.dataService.getClassAttendance(item.id).subscribe(res => {
      this.classAttendance = res.data || [];
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
    let h = parseInt(parts[0], 10);
    const m = parts[1] || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12;
    return `${h.toString().padStart(2, '0')}:${m} ${ampm}`;
  }
}
