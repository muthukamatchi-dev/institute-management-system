import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ModalComponent } from '../../shared/ui/modal.component';

@Component({
  selector: 'app-staff-students',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="p-4 sm:p-6 space-y-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Active Students</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">Students assigned to your batches or 1:1 sessions</p>
        </div>

        <div class="relative w-full lg:w-96">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search by name, ID or course..."
                 class="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 transition-all font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-white">
        </div>
      </div>

      <div class="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-soft overflow-hidden transition-all">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr class="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Student Identifier</th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Program / Batch</th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Comm. Info</th>
                <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Enrollment</th>
                 <th class="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Actions</th>
               </tr>
             </thead>
             <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
               <tr *ngFor="let s of filteredStudents()" class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                <td class="px-8 py-6">
                  <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-700 dark:text-primary-400 font-black text-lg">
                      {{ s.name.charAt(0) }}
                    </div>
                    <div>
                      <p class="font-black text-slate-800 dark:text-white leading-tight mb-1">{{ s.name }}</p>
                      <p class="text-[10px] text-primary-600 dark:text-primary-400 font-black uppercase tracking-widest">{{ s.reg_number }}</p>
                    </div>
                  </div>
                </td>
                <td class="px-8 py-6">
                  <p class="text-sm font-black text-slate-700 dark:text-slate-200 mb-1">{{ s.course_name }}</p>
                  <p class="text-[10px] text-slate-400 font-black uppercase tracking-widest">{{ s.batch_name || 'Individual Session' }}</p>
                </td>
                <td class="px-8 py-6">
                   <p class="text-sm font-bold text-slate-600 dark:text-slate-400">{{ s.mobile }}</p>
                </td>
                <td class="px-8 py-6">
                   <span [class]="'px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] ' + 
                                 (s.status === 'active' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-slate-50 text-slate-600 dark:bg-slate-800')">
                     {{ s.status }}
                   </span>
                </td>
                 <td class="px-8 py-6 text-right">
                    <button (click)="viewStudent(s)" 
                            class="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 rounded-2xl transition-all shadow-sm active:scale-90">
                      👁️
                    </button>
                 </td>
               </tr>

              <tr *ngIf="filteredStudents().length === 0">
                <td colspan="5" class="px-6 py-12 text-center text-slate-400 font-bold">No students assigned to you.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Student Details Modal -->
    <app-modal [isOpen]="isModalOpen" title="Student Information" actionLabel="Close" 
               (onClose)="isModalOpen = false" (onSubmit)="isModalOpen = false">
      <div *ngIf="selectedStudent" class="space-y-6">
        <div class="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <div class="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center text-white text-2xl font-black">
            {{ selectedStudent.name.charAt(0) }}
          </div>
          <div>
            <h3 class="text-xl font-black text-slate-800 dark:text-white">{{ selectedStudent.name }}</h3>
            <p class="text-sm font-bold text-primary-600 uppercase tracking-widest">{{ selectedStudent.reg_number }}</p>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-6">
          <div class="space-y-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Father's Name</p>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ selectedStudent.father_name || 'N/A' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date of Birth</p>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ selectedStudent.dob || 'N/A' }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Number</p>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ selectedStudent.mobile }}</p>
          </div>
          <div class="space-y-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent's Mobile</p>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ selectedStudent.parent_mobile || 'N/A' }}</p>
          </div>
          <div class="col-span-2 space-y-1">
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</p>
            <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ selectedStudent.email || 'N/A' }}</p>
          </div>
        </div>

        <div class="p-4 border border-slate-100 dark:border-slate-800 rounded-2xl space-y-4">
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Enrolled Course</span>
            <span class="text-sm font-black text-slate-800 dark:text-white">{{ selectedStudent.course_name }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Group</span>
            <span class="text-sm font-black text-slate-800 dark:text-white">{{ selectedStudent.batch_name || 'One-to-One' }}</span>
          </div>
          <div class="flex items-center justify-between">
            <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Joining Date</span>
            <span class="text-sm font-black text-slate-800 dark:text-white">{{ selectedStudent.joining_date }}</span>
          </div>
          <div class="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <span class="text-xs font-black text-slate-400 uppercase tracking-widest">Fee Status</span>
            <span [class]="'px-3 py-1 rounded-full text-[10px] font-black uppercase ' + 
                          (selectedStudent.fee_status === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')">
              {{ selectedStudent.fee_status || 'Pending' }}
            </span>
          </div>
        </div>
      </div>
    </app-modal>
  `
})
export class StaffStudentsComponent implements OnInit {
  students: any[] = [];
  searchTerm: string = '';
  isModalOpen: boolean = false;
  selectedStudent: any = null;

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.getMyStudents().subscribe(res => {
      this.students = res.data;
    });
  }

  filteredStudents() {
    if (!this.searchTerm) return this.students;
    const lowTerm = this.searchTerm.toLowerCase();
    return this.students.filter(s =>
      s.name.toLowerCase().includes(lowTerm) ||
      s.reg_number.toLowerCase().includes(lowTerm) ||
      s.course_name.toLowerCase().includes(lowTerm)
    );
  }

  viewStudent(student: any) {
    this.selectedStudent = student;
    this.isModalOpen = true;
  }
}
