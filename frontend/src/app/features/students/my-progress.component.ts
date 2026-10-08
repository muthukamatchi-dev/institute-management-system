import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-my-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 sm:p-6 space-y-6 sm:space-y-8">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div class="space-y-1">
          <button *ngIf="selectedCourse" (click)="selectedCourse = null" 
            class="mb-4 flex items-center gap-2 text-primary-600 font-black text-xs uppercase tracking-widest hover:translate-x-1 transition-all">
            <span>←</span> Back to Academy
          </button>
          <h1 class="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
            {{ selectedCourse ? selectedCourse : 'My Knowledge & Pathways' }}
          </h1>
          <p class="text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest opacity-80">
            {{ selectedCourse ? 'Session intensity & attendance audit' : 'Track your course consistency and professional program pathways' }}
          </p>
        </div>
        
        <div *ngIf="selectedCourse" class="bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl px-6 py-4 rounded-[2rem] flex items-center gap-4 border border-slate-100 dark:border-slate-800 shadow-soft">
           <div class="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center text-xl shadow-lg shadow-primary-500/20">📈</div>
           <div>
             <p class="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] leading-none mb-1.5">Knowledge Index</p>
             <div class="flex items-baseline gap-2">
               <p class="text-2xl font-black text-slate-800 dark:text-white leading-none">{{ getAttendanceForCourse(selectedCourse) }}%</p>
               <span class="text-[10px] font-bold text-emerald-500 uppercase">Presence Rate</span>
             </div>
           </div>
        </div>
      </div>

      <!-- Program Pathway View (If Student is enrolled in a Professional Program) -->
      <div *ngIf="!selectedCourse && programProgressList.length > 0" class="space-y-6">
        <h2 class="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <span>🎓</span> Professional Learning Pathways
        </h2>

        <div *ngFor="let prog of programProgressList" class="bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-soft space-y-6">
          <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-6">
            <div>
              <span class="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-[10px] font-black uppercase rounded-xl">
                Enrolled Program
              </span>
              <h3 class="text-2xl font-black text-slate-800 dark:text-white mt-1">{{ prog.programName }}</h3>
              <p class="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{{ prog.programDescription }}</p>
            </div>
            
            <div class="flex items-center gap-4 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div class="text-right">
                <p class="text-[10px] font-black text-slate-400 uppercase">Overall Progress</p>
                <p class="text-xl font-black text-emerald-600 dark:text-emerald-400">{{ prog.progressPercentage }}%</p>
              </div>
              <div class="w-12 h-12 rounded-full border-4 border-emerald-500 flex items-center justify-center font-black text-xs text-emerald-600">
                {{ prog.completedModules }}/{{ prog.totalModules }}
              </div>
            </div>
          </div>

          <!-- Sequential Module Step Map -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div *ngFor="let mod of prog.modules; let idx = index" 
              class="p-5 rounded-2xl border transition-all relative overflow-hidden"
              [class]="mod.status === 'COMPLETED' ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/50' : (mod.status === 'AVAILABLE' || mod.status === 'IN_PROGRESS' ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/50' : 'bg-slate-50 dark:bg-slate-800/30 border-slate-200/60 dark:border-slate-800/60 opacity-60')">
              
              <div class="flex items-center justify-between mb-3">
                <span class="w-7 h-7 rounded-xl font-black text-xs flex items-center justify-center"
                  [class]="mod.status === 'COMPLETED' ? 'bg-emerald-600 text-white' : (mod.status === 'AVAILABLE' || mod.status === 'IN_PROGRESS' ? 'bg-amber-500 text-white' : 'bg-slate-300 dark:bg-slate-700 text-slate-600 dark:text-slate-300')">
                  0{{ idx + 1 }}
                </span>

                <span class="px-2.5 py-1 text-[9px] font-black uppercase rounded-lg border"
                  [class]="mod.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 border-emerald-300' : (mod.status === 'AVAILABLE' || mod.status === 'IN_PROGRESS' ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-slate-200 text-slate-600 border-slate-300')">
                  <span *ngIf="mod.status === 'COMPLETED'">✓ Completed</span>
                  <span *ngIf="mod.status === 'AVAILABLE' || mod.status === 'IN_PROGRESS'">➔ Available</span>
                  <span *ngIf="mod.status === 'LOCKED'">🔒 Locked</span>
                </span>
              </div>

              <h4 class="text-sm font-black text-slate-800 dark:text-white leading-tight">{{ mod.moduleName || mod.courseName }}</h4>
              <p class="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Course: {{ mod.courseName }} ({{ mod.courseDuration || 'Standard' }})</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Course List View -->
      <div *ngIf="!selectedCourse" class="space-y-4">
        <h2 class="text-xl font-black text-slate-800 dark:text-white flex items-center gap-2">
          <span>📚</span> Enrolled Courses & Attendance Audit
        </h2>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          <div *ngFor="let courseName of getCourseKeys()" 
               (click)="selectedCourse = courseName"
               class="group bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-premium hover:border-primary-500/20 transition-all duration-500 cursor-pointer relative overflow-hidden">
            
            <div class="absolute -right-4 -top-4 w-24 h-24 bg-primary-500/5 rounded-full blur-2xl group-hover:scale-150 transition-all duration-700"></div>
            
            <div class="flex items-start justify-between mb-8">
              <div class="w-16 h-16 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-3xl group-hover:scale-110 group-hover:bg-primary-600 group-hover:text-white transition-all duration-500 shadow-inner">
                📚
              </div>
              <div class="text-right">
                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p>
                <span class="px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 text-[9px] font-black uppercase rounded-lg border border-emerald-100 dark:border-emerald-800/50">Active</span>
              </div>
            </div>

            <div class="space-y-4">
              <h3 class="text-2xl font-black text-slate-800 dark:text-white leading-tight group-hover:text-primary-600 transition-colors">{{ courseName }}</h3>
              
              <div class="flex items-center gap-6 pt-6 border-t border-slate-50 dark:border-slate-800">
                <div class="flex flex-col">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Hours</span>
                  <span class="text-xl font-black text-slate-800 dark:text-white">{{ groupedProgress[courseName].length }}</span>
                </div>
                <div class="flex flex-col">
                  <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Score</span>
                  <span class="text-xl font-black text-emerald-500">{{ getAttendanceForCourse(courseName) }}%</span>
                </div>
              </div>
            </div>
            
            <div class="mt-8 flex items-center justify-center gap-3 py-4 bg-slate-50 dark:bg-slate-800 rounded-2xl group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
              <span class="text-[10px] font-black uppercase tracking-[0.2em]">Enter Analytics</span>
              <span class="text-sm group-hover:translate-x-1 transition-transform">→</span>
            </div>
          </div>

          <div *ngIf="getCourseKeys().length === 0 && programProgressList.length === 0" class="col-span-full py-24 text-center bg-white/50 dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
             <div class="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">🏝️</div>
             <p class="text-slate-400 dark:text-slate-500 font-black text-xl tracking-tight">No active enrollments detected.</p>
             <p class="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Contact administrator for course allocation</p>
          </div>
        </div>
      </div>

      <!-- Detailed Attendance List View -->
      <div *ngIf="selectedCourse" class="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <div *ngFor="let record of groupedProgress[selectedCourse]" 
             class="group bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6 hover:shadow-premium hover:border-primary-500/20 transition-all duration-500 relative overflow-hidden">
          
          <div class="flex-shrink-0 w-20 h-20 rounded-[1.8rem] flex flex-col items-center justify-center font-black transition-all group-hover:scale-110 shadow-lg"
               [class]="record.status === 'present' ? 'bg-emerald-600 text-white shadow-emerald-500/20' : 'bg-rose-600 text-white shadow-rose-500/20'">
            <span class="text-2xl leading-none mb-1">{{ record.attendance_date | date:'dd' }}</span>
            <span class="text-[10px] uppercase tracking-tighter opacity-80 font-bold">{{ record.attendance_date | date:'MMMM' }}</span>
          </div>

          <div class="flex-1 w-full">
            <div class="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
               <div>
                 <h3 class="text-xl font-black text-slate-800 dark:text-white group-hover:text-primary-600 transition-colors">
                   {{ record.topic || 'Curriculum Session' }}
                 </h3>
                 <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{{ record.attendance_date | date:'EEEE, yyyy' }}</p>
               </div>
               
               <div class="flex items-center gap-2">
                 <span *ngIf="record.status === 'present'" class="bg-emerald-50 dark:bg-emerald-900/10 text-emerald-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-emerald-100 dark:border-emerald-800/50 flex items-center gap-2">
                   <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Present
                 </span>
                 <span *ngIf="record.status === 'absent'" class="bg-rose-50 dark:bg-rose-900/10 text-rose-600 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-rose-100 dark:border-rose-800/50 flex items-center gap-2">
                   <span class="w-1.5 h-1.5 rounded-full bg-rose-500"></span> Absent
                 </span>
               </div>
            </div>
            
            <p class="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed mb-6 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800/50 italic">
              "{{ record.remarks || 'No specific session remarks recorded.' }}"
            </p>

            <div class="flex items-center justify-between pt-4 border-t border-slate-50 dark:border-slate-800">
               <div class="flex items-center gap-3">
                 <div class="w-8 h-8 rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 flex items-center justify-center text-[10px] font-black">
                   {{ (record.staff_name || 'S').charAt(0) }}
                 </div>
                 <div class="flex flex-col">
                   <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Supervised By</p>
                   <p class="text-xs font-bold text-slate-700 dark:text-slate-300 leading-none">{{ record.staff_name || 'Institute System' }}</p>
                 </div>
               </div>
               
               <div class="flex items-center gap-1.5 text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">
                  Verified <span class="text-emerald-500">✓</span>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyProgressComponent implements OnInit {
  groupedProgress: { [key: string]: any[] } = {};
  programProgressList: any[] = [];
  selectedCourse: string | null = null;

  constructor(private dataService: DataService, private authService: AuthService) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      if (user) {
        this.loadProgress(user.id);
        this.loadProgramProgress(user.id);
      }
    });
  }

  loadProgress(studentId: string) {
    this.dataService.getStudentProgress(studentId).subscribe(res => {
      if (res && res.data) {
        this.groupData(res.data);
      }
    });
  }

  loadProgramProgress(studentId: string) {
    this.dataService.getPrograms().subscribe(programs => {
      if (programs && programs.length > 0) {
        programs.forEach(p => {
          this.dataService.getStudentProgramProgress(studentId, p.id).subscribe(progRes => {
            if (progRes && progRes.isEnrolled) {
              this.programProgressList.push(progRes);
            }
          });
        });
      }
    });
  }

  groupData(data: any[]) {
    this.groupedProgress = {};
    if (!Array.isArray(data)) return;
    data.forEach(item => {
      const course = item.course_name || 'General';
      if (!this.groupedProgress[course]) {
        this.groupedProgress[course] = [];
      }
      this.groupedProgress[course].push(item);
    });
  }

  getCourseKeys() {
    return Object.keys(this.groupedProgress);
  }

  getAttendanceForCourse(courseName: string): number {
    const list = this.groupedProgress[courseName];
    if (!list || list.length === 0) return 0;
    const present = list.filter(p => p.status === 'present').length;
    return Math.round((present / list.length) * 100);
  }
}
