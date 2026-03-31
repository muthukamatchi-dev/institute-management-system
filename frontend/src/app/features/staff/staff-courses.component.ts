import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-staff-courses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-8">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <h1 class="text-2xl sm:text-3xl font-black text-slate-800 dark:text-white tracking-tight">Assigned Subjects</h1>
          <p class="text-slate-500 dark:text-slate-400 font-medium text-xs sm:text-sm mt-1">Courses you are currently instructing</p>
        </div>

        <div class="relative w-full lg:w-96">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          <input type="text" [(ngModel)]="searchTerm" placeholder="Search assigned courses..."
                 class="w-full pl-12 pr-4 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl outline-none focus:ring-4 focus:ring-primary-500/5 transition-all font-black text-[10px] uppercase tracking-widest text-slate-800 dark:text-white">
        </div>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
        <div *ngFor="let course of filteredCourses()" 
             class="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft overflow-hidden group hover:border-primary-500/30 transition-all relative">
          <div class="aspect-video relative overflow-hidden">
            <img [src]="course.image_url || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=60'" 
                 class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700">
            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent"></div>
            <div class="absolute bottom-6 left-6 right-6">
              <span class="px-3 py-1 bg-white/10 backdrop-blur-md text-white text-[9px] font-black rounded-lg uppercase tracking-[0.2em] border border-white/10">
                {{ course.course_id }}
              </span>
              <h3 class="text-white font-black text-xl sm:text-2xl mt-3 truncate group-hover:text-primary-400 transition-colors">{{ course.name }}</h3>
            </div>
            
            <button (click)="viewSyllabus(course)" 
                    class="absolute top-6 right-6 w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-white border border-white/10 hover:bg-white/20 transition-all sm:opacity-0 group-hover:opacity-100"
                    title="View Syllabus">
              👁️
            </button>
          </div>
          <div class="p-6 sm:p-8">
            <div class="flex items-center justify-between">
              <span class="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Course Duration</span>
              <span class="px-4 py-1.5 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-white font-black text-xs rounded-xl">{{ course.duration }}</span>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="filteredCourses().length === 0" class="py-20 flex flex-col items-center justify-center text-center opacity-40">
        <span class="text-6xl mb-6">📚</span>
        <p class="text-slate-500 font-black text-xl uppercase tracking-widest">No Courses Found</p>
      </div>
    </div>
  `
})
export class StaffCoursesComponent implements OnInit {
  courses: any[] = [];
  searchTerm: string = '';

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    this.dataService.getMyCourses().subscribe(res => {
      this.courses = res.data;
    });
  }

  filteredCourses() {
    if (!this.searchTerm) return this.courses;
    const term = this.searchTerm.toLowerCase();
    return this.courses.filter(c =>
      c.name.toLowerCase().includes(term) ||
      c.course_id.toLowerCase().includes(term)
    );
  }

  viewSyllabus(course: any) {
    if (course.syllabus_path) {
      const normalizedPath = course.syllabus_path.startsWith('/') ? course.syllabus_path.slice(1) : course.syllabus_path;
      window.open(`http://localhost:8081/${normalizedPath}`, '_blank');
      this.toastService.info(`Opening syllabus for ${course.name}`);
    } else {
      this.toastService.warning('Syllabus not uploaded for this course yet.');
    }
  }
}
