import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-day-book',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      <!-- Header banner -->
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-8 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden">
        <div class="absolute -right-10 -top-10 w-40 h-40 bg-primary-600/10 rounded-full blur-3xl"></div>
        <div class="absolute -left-10 -bottom-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-3xl"></div>
        
        <div class="relative z-10">
          <h1 class="text-3xl font-black text-white tracking-tight sm:text-4xl">Day Book</h1>
          <p class="text-slate-400 font-medium text-sm mt-2 max-w-md">
            Overview of transactions, schedules, attendance, and activities registered on this date.
          </p>
        </div>
        
        <!-- Interactive Date Selector -->
        <div class="relative z-10 flex flex-col sm:flex-row items-center gap-4 bg-white/5 backdrop-blur-md px-6 py-4 rounded-3xl border border-white/10 shadow-lg">
          <div class="flex items-center gap-2">
            <span class="text-xl">📅</span>
            <span class="text-xs font-bold text-slate-300 uppercase tracking-wider">Select Date:</span>
          </div>
          <input type="date" 
                 [(ngModel)]="selectedDate" 
                 (change)="loadDayBookData()"
                 class="bg-slate-800 text-white font-bold text-sm px-4 py-2 rounded-xl border border-slate-700 outline-none focus:border-primary-500 transition-colors cursor-pointer" />
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-20 space-y-4">
        <div class="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        <p class="text-slate-500 dark:text-slate-400 font-bold text-sm">Fetching today's logs...</p>
      </div>

      <!-- Main Dashboard Content (Only visible when loaded) -->
      <div *ngIf="!loading" class="space-y-8">
        
        <!-- Micro Statistics KPI Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Stat 1: Revenue -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div class="space-y-1">
              <span class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Revenue</span>
              <p class="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                ₹{{ dayBookData?.feesCollected?.totalCollected | number:'1.2-2' }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center text-emerald-600 text-xl font-bold">
              💰
            </div>
          </div>

          <!-- Stat 2: Expenses -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div class="space-y-1">
              <span class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Today's Expenses</span>
              <p class="text-2xl font-black text-rose-600 dark:text-rose-400">
                ₹{{ dayBookData?.expenses?.totalExpense | number:'1.2-2' }}
              </p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/30 flex items-center justify-center text-rose-600 text-xl font-bold">
              💸
            </div>
          </div>

          <!-- Stat 3: Joined Students -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div class="space-y-1">
              <span class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">New Registrations</span>
              <p class="text-2xl font-black text-blue-600 dark:text-blue-400">
                {{ dayBookData?.joinedStudents?.length || 0 }} Students
              </p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/30 flex items-center justify-center text-blue-600 text-xl font-bold">
              🎓
            </div>
          </div>

          <!-- Stat 4: Class Count -->
          <div class="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm flex items-center justify-between group hover:shadow-md transition-all">
            <div class="space-y-1">
              <span class="text-xs font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest">Scheduled Sessions</span>
              <p class="text-2xl font-black text-amber-600 dark:text-amber-400">
                {{ dayBookData?.scheduledClasses?.length || 0 }} Classes
              </p>
            </div>
            <div class="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center text-amber-600 text-xl font-bold">
              🏫
            </div>
          </div>
        </div>

        <!-- Collage Masonry Grid of Information -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">

          <!-- 1. Student Attendance widget -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col justify-between">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>📊</span> Student Attendance
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Glance at student attendance percentage</p>
              
              <!-- Circular Gauge Chart -->
              <div class="flex justify-center items-center py-6 relative">
                <svg class="w-36 h-36 transform -rotate-90">
                  <circle cx="72" cy="72" r="62" stroke="currentColor" stroke-width="12" class="text-slate-100 dark:text-slate-800" fill="transparent" />
                  <circle cx="72" cy="72" r="62" stroke="currentColor" stroke-width="12" 
                          [attr.stroke-dasharray]="389.5"
                          [attr.stroke-dashoffset]="389.5 - (389.5 * (dayBookData?.studentAttendance?.percentage || 0)) / 100"
                          class="text-primary-600 dark:text-primary-500 transition-all duration-1000 ease-out" 
                          fill="transparent" />
                </svg>
                <div class="absolute flex flex-col items-center justify-center">
                  <span class="text-2xl font-black text-slate-800 dark:text-white leading-none">
                    {{ (dayBookData?.studentAttendance?.percentage || 0) | number:'1.0-1' }}%
                  </span>
                  <span class="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Present Rate</span>
                </div>
              </div>
            </div>

            <div class="grid grid-cols-3 gap-2 border-t border-slate-100 dark:border-slate-800 pt-6 mt-6">
              <div class="text-center">
                <span class="text-lg font-black text-slate-800 dark:text-white">
                  {{ dayBookData?.studentAttendance?.total || 0 }}
                </span>
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Total</p>
              </div>
              <div class="text-center">
                <span class="text-lg font-black text-emerald-600 dark:text-emerald-400">
                  {{ dayBookData?.studentAttendance?.present || 0 }}
                </span>
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Present</p>
              </div>
              <div class="text-center">
                <span class="text-lg font-black text-rose-600 dark:text-rose-400">
                  {{ dayBookData?.studentAttendance?.absent || 0 }}
                </span>
                <p class="text-[10px] text-slate-400 font-black uppercase tracking-wider mt-0.5">Absent</p>
              </div>
            </div>
          </div>

          <!-- 2. Staff Shifts Log -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>👥</span> Staff Shifts
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Staff punch-in & punch-out times</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.staffAttendance?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No staff attended today.
              </div>
              <div *ngFor="let sa of dayBookData?.staffAttendance" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-black text-sm text-slate-800 dark:text-white">{{ sa.staffName }}</h3>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{{ sa.role || 'Staff' }}</p>
                  </div>
                  <span class="px-2 py-0.5 text-[10px] font-black uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    Active
                  </span>
                </div>
                <div class="grid grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1">
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Login</p>
                    <p class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      🌅 {{ formatTime12(sa.loginTime) }}
                    </p>
                  </div>
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Logout</p>
                    <p class="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                      🌆 {{ formatTime12(sa.logoutTime) }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 3. Scheduled Classes widget -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>📅</span> Scheduled Classes
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Today's class schedule timeline</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.scheduledClasses?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No classes scheduled for today.
              </div>
              <div *ngFor="let sc of dayBookData?.scheduledClasses" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2 relative">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-black text-sm text-slate-800 dark:text-white truncate max-w-[180px]">
                      {{ sc.topic || 'Subject Session' }}
                    </h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-0.5">
                      Batch: <span class="text-slate-600 dark:text-slate-300">{{ sc.batchName || 'N/A' }}</span>
                      <span *ngIf="sc.studentName"> (Student: {{ sc.studentName }})</span>
                    </p>
                  </div>
                  <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md"
                        [ngClass]="sc.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'">
                    {{ sc.status }}
                  </span>
                </div>
                <div class="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1">
                  <div class="text-[10px] font-bold text-slate-500">
                    👨‍🏫 {{ sc.staffName || 'Instructor' }}
                  </div>
                  <div class="text-xs font-mono font-bold text-primary-600 dark:text-primary-400">
                    ⏱️ {{ sc.startTime }} - {{ sc.endTime }}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 4. Exams Conducted Today -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>📝</span> Exams Conducted
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Exams scheduled today</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.exams?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No exams conducted today.
              </div>
              <div *ngFor="let ex of dayBookData?.exams" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-2">
                <div class="flex justify-between items-center">
                  <h3 class="font-black text-sm text-slate-800 dark:text-white">{{ ex.title }}</h3>
                  <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    {{ ex.examType }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Course: <span class="font-bold text-slate-700 dark:text-slate-300">{{ ex.courseName || 'N/A' }}</span>
                </p>
                <div class="grid grid-cols-2 gap-4 border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1">
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Duration</p>
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ ex.duration }} Mins</p>
                  </div>
                  <div>
                    <p class="text-[9px] font-black text-slate-400 uppercase tracking-wider">Max Marks</p>
                    <p class="text-xs font-bold text-slate-700 dark:text-slate-300">{{ ex.totalMarks }} Marks</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- 5. Today's Collections (Fee Payments Received) -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>💰</span> Fees Collected
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Payments received today</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.feesCollected?.transactions?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No fee collections today.
              </div>
              <div *ngFor="let tx of dayBookData?.feesCollected?.transactions" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-black text-sm text-slate-800 dark:text-white">{{ tx.studentName }}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-0.5">Receipt: {{ tx.receiptNo }}</p>
                  </div>
                  <span class="text-base font-black text-emerald-600 dark:text-emerald-400">
                    ₹{{ tx.amountPaid | number:'1.2-2' }}
                  </span>
                </div>
                <div class="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Method: {{ tx.paymentMethod }}
                  </span>
                  <span class="text-[10px] text-slate-500 font-bold">
                    Reg: {{ tx.regNumber }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 6. Today's Expenses widget -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>💸</span> Expenses Ledger
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Expenditures logged today</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.expenses?.items?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No expenses logged today.
              </div>
              <div *ngFor="let ex of dayBookData?.expenses?.items" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
                <div class="flex justify-between items-center">
                  <div>
                    <h3 class="font-black text-sm text-slate-800 dark:text-white">{{ ex.title }}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-0.5">Category: {{ ex.category }}</p>
                  </div>
                  <span class="text-base font-black text-rose-600 dark:text-rose-400">
                    ₹{{ ex.amount | number:'1.2-2' }}
                  </span>
                </div>
                <div class="border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1 flex justify-between items-center">
                  <span class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Method: {{ ex.paymentMethod }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 7. Today Joined Students -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>🎓</span> Today Joined Students
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">New student admissions today</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.joinedStudents?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No students joined today.
              </div>
              <div *ngFor="let std of dayBookData?.joinedStudents" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
                <h3 class="font-black text-sm text-slate-800 dark:text-white">{{ std.name }}</h3>
                <p class="text-xs text-slate-500 dark:text-slate-400">
                  Course: <span class="font-bold text-slate-700 dark:text-slate-200">{{ std.courseName || 'N/A' }}</span>
                </p>
                <div class="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1">
                  <span class="text-[10px] text-slate-500 font-bold">
                    Reg: {{ std.regNumber }}
                  </span>
                  <span class="text-xs font-bold text-primary-600 dark:text-primary-400">
                    📞 {{ std.mobile }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 8. Fees Alerted List -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>⏰</span> Fee Reminders
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Fees due alerts today</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.feeAlerts?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No fee reminders alerted today.
              </div>
              <div *ngFor="let al of dayBookData?.feeAlerts" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
                <div class="flex justify-between items-start">
                  <div>
                    <h3 class="font-black text-sm text-slate-800 dark:text-white">{{ al.studentName }}</h3>
                    <p class="text-[10px] font-bold text-slate-400 mt-0.5">Reg: {{ al.regNumber }}</p>
                  </div>
                  <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    Due Alerted
                  </span>
                </div>
                <div class="flex items-center justify-between border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1">
                  <span class="text-xs font-bold text-rose-600 dark:text-rose-400">
                    Balance: ₹{{ al.balanceAmount | number:'1.2-2' }}
                  </span>
                  <span class="text-xs font-bold text-slate-500">
                    📞 {{ al.mobile }}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- 9. Batch Created or Started Today -->
          <div class="bg-white dark:bg-slate-900 p-8 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft flex flex-col h-[400px]">
            <div>
              <h2 class="font-black text-lg text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                <span>⏱️</span> Batch Updates
              </h2>
              <p class="text-xs text-slate-400 font-bold uppercase tracking-wider mb-6">Batches created or started today</p>
            </div>
            
            <div class="flex-1 overflow-y-auto space-y-4 pr-1 scrollbar-thin">
              <div *ngIf="!dayBookData?.batches?.length" class="text-center py-12 text-slate-400 font-bold text-sm">
                No batches created or started today.
              </div>
              <div *ngFor="let bt of dayBookData?.batches" class="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-100 dark:border-slate-800/50 flex flex-col gap-1">
                <div class="flex justify-between items-center">
                  <h3 class="font-black text-sm text-slate-800 dark:text-white">{{ bt.batchName }}</h3>
                  <span class="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400">
                    {{ bt.action }}
                  </span>
                </div>
                <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Course: <span class="font-bold text-slate-700 dark:text-slate-200">{{ bt.courseName || 'N/A' }}</span>
                </p>
                <div class="border-t border-slate-200/50 dark:border-slate-700/50 pt-2 mt-1 flex justify-between items-center">
                  <span class="text-[10px] text-slate-400 uppercase tracking-widest font-black">
                    Status: {{ bt.status }}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .shadow-soft {
      box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.04);
    }
    .scrollbar-thin::-webkit-scrollbar {
      width: 4px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background: rgba(156, 163, 175, 0.3);
      border-radius: 2px;
    }
  `]
})
export class DayBookComponent implements OnInit {
  selectedDate: string = '';
  dayBookData: any = null;
  loading: boolean = false;

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    // Default to today's date in local time YYYY-MM-DD
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    this.selectedDate = `${year}-${month}-${day}`;

    this.loadDayBookData();
  }

  loadDayBookData() {
    this.loading = true;
    this.dataService.getDayBook(this.selectedDate).subscribe({
      next: (res) => {
        this.dayBookData = res;
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load Day Book logs');
        this.loading = false;
      }
    });
  }

  formatTime12(timeStr: string | null | undefined): string {
    if (!timeStr) return '--:--';
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
    hours = hours ? hours : 12;
    return `${hours}:${minutes}:${seconds} ${ampm}`;
  }
}
