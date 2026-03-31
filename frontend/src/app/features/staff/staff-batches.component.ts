import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ModalComponent } from '../../shared/ui/modal.component';

@Component({
  selector: 'app-staff-batches',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  template: `
    <div class="p-4 sm:p-6 space-y-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Assigned Batches</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">Batches under your instruction</p>
        </div>

        <div class="relative w-full lg:w-96">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search batches or courses..."
                 class="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 transition-all font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-white">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div *ngFor="let batch of filteredBatches()" 
             class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft p-6 sm:p-8 group hover:border-primary-500/30 transition-all relative overflow-hidden">
          <div class="absolute top-0 right-0 w-24 h-24 bg-primary-500/5 -mr-12 -mt-12 rounded-full blur-2xl group-hover:bg-primary-500/10 transition-colors"></div>
          
          <div class="flex items-start justify-between mb-8 relative">
            <div class="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-900/20 flex items-center justify-center text-3xl shadow-inner">
              ⏱️
            </div>
             <div class="flex items-center gap-2">
                <div [class]="'px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] ' + 
                             (batch.status === 'ongoing' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20')">
                  {{ batch.status }}
                </div>
                <button (click)="viewBatchDetails(batch)"
                        class="p-2.5 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-primary-600 rounded-xl transition-all shadow-sm"
                        title="View Details">
                  👁️
                </button>
             </div>
          </div>
          
          <h3 class="text-xl sm:text-2xl font-black text-slate-800 dark:text-white mb-2 leading-tight group-hover:text-primary-600 transition-colors">{{ batch.batch_name }}</h3>
          <p class="text-[10px] font-black text-primary-600 dark:text-primary-400 uppercase tracking-[0.2em] mb-8">{{ batch.course_name }}</p>

          <div class="grid grid-cols-2 gap-6 pt-6 border-t border-slate-50 dark:border-slate-800 relative">
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Students</p>
              <p class="text-base font-black text-slate-800 dark:text-slate-200">{{ batch.student_count }} Members</p>
            </div>
            <div>
              <p class="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Schedule</p>
              <p class="text-base font-black text-slate-800 dark:text-slate-200">{{ batch.timing }}</p>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="filteredBatches().length === 0" class="py-20 flex flex-col items-center justify-center text-center opacity-40">
        <span class="text-6xl mb-6">⏱️</span>
        <p class="text-slate-500 font-black text-xl uppercase tracking-widest">No Batches Found</p>
      </div>
    </div>

    <!-- Batch Details Modal -->
    <app-modal [isOpen]="isModalOpen" [title]="selectedBatch?.batch_name + ' Details'" actionLabel="Close" 
               (onClose)="isModalOpen = false" (onSubmit)="isModalOpen = false">
      <div *ngIf="selectedBatch" class="space-y-6">
        <div class="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Course</p>
            <p class="text-sm font-black text-slate-800 dark:text-white">{{ selectedBatch.course_name }}</p>
          </div>
          <div>
            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Timing</p>
            <p class="text-sm font-black text-slate-800 dark:text-white">{{ selectedBatch.timing }}</p>
          </div>
        </div>

        <div>
          <h4 class="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-between">
            <span>Enrolled Students</span>
            <span class="bg-primary-100 dark:bg-primary-900/30 text-primary-600 px-2 py-0.5 rounded-md">{{ batchStudents.length }}</span>
          </h4>
          
          <div class="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
            <div *ngFor="let student of batchStudents" 
                 class="flex items-center justify-between p-3 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-xl hover:border-primary-500/20 transition-all">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-xs font-black text-primary-600">
                  {{ student.name.charAt(0) }}
                </div>
                <div>
                  <p class="text-sm font-bold text-slate-700 dark:text-slate-300">{{ student.name }}</p>
                  <p class="text-[10px] text-slate-400 font-medium">{{ student.reg_number }}</p>
                </div>
              </div>
              <span [class]="'w-2 h-2 rounded-full ' + (student.status === 'active' ? 'bg-emerald-500' : 'bg-slate-300')"></span>
            </div>

            <div *ngIf="batchStudents.length === 0" class="py-8 text-center text-slate-400 text-sm font-bold">
              No students enrolled in this batch.
            </div>
          </div>
        </div>
      </div>
    </app-modal>
  `
})
export class StaffBatchesComponent implements OnInit {
  batches: any[] = [];
  searchTerm: string = '';
  isModalOpen: boolean = false;
  selectedBatch: any = null;
  batchStudents: any[] = [];

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.dataService.getMyBatches().subscribe(res => {
      this.batches = res.data;
    });
  }

  filteredBatches() {
    if (!this.searchTerm) return this.batches;
    const term = this.searchTerm.toLowerCase();
    return this.batches.filter(b =>
      b.batch_name.toLowerCase().includes(term) ||
      b.course_name.toLowerCase().includes(term)
    );
  }

  viewBatchDetails(batch: any) {
    this.selectedBatch = batch;
    this.isModalOpen = true;
    this.dataService.getStudentsByBatch(batch.id).subscribe(res => {
      this.batchStudents = res.data;
    });
  }
}
