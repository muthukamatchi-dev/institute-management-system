import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { ModalComponent } from '../../shared/ui/modal.component';
import { BadgeComponent } from '../../shared/ui/badge.component';

@Component({
    selector: 'app-student-exam',
    standalone: true,
    imports: [CommonModule, ModalComponent, BadgeComponent],
    template: `
    <div class="space-y-8 sm:space-y-12 pb-20">
        <!-- Header -->
        <div class="flex flex-col md:flex-row md:items-end justify-between gap-8">
            <div class="space-y-2">
                <div class="inline-flex items-center gap-2 px-3 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-full text-[10px] font-black uppercase tracking-widest border border-primary-100 dark:border-primary-800/50">
                   Academic Evaluation
                </div>
                <h1 class="text-4xl sm:text-5xl font-black text-slate-800 dark:text-white tracking-tighter">My Assessments</h1>
                <p class="text-slate-500 dark:text-slate-400 font-bold text-xs sm:text-sm uppercase tracking-widest opacity-80">Track your knowledge acquisition and performance metrics.</p>
            </div>
            <div class="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl w-full md:w-auto overflow-x-auto scrollbar-hide">
                <button (click)="activeTab = 'assigned'" 
                    [class.bg-white]="activeTab === 'assigned'" [class.dark:bg-slate-700]="activeTab === 'assigned'"
                    [class.text-primary-600]="activeTab === 'assigned'"
                    [class.shadow-soft]="activeTab === 'assigned'"
                    class="flex-1 md:flex-none px-6 sm:px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap">
                    Active Assessments
                </button>
                <button (click)="activeTab = 'results'" 
                    [class.bg-white]="activeTab === 'results'" [class.dark:bg-slate-700]="activeTab === 'results'"
                    [class.text-primary-600]="activeTab === 'results'"
                    [class.shadow-soft]="activeTab === 'results'"
                    class="flex-1 md:flex-none px-6 sm:px-10 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap">
                    Performance Log
                </button>
            </div>
        </div>

        <!-- Assigned Exams Tab -->
        <div *ngIf="activeTab === 'assigned'" class="space-y-6">
            <div *ngIf="assignedExams.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div *ngFor="let ex of assignedExams" 
                     class="group bg-white dark:bg-slate-900 p-8 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-soft hover:shadow-premium hover:border-primary-500/30 transition-all duration-500 relative overflow-hidden">
                    
                    <div class="absolute -top-10 -right-10 w-40 h-40 bg-primary-500/5 rounded-full group-hover:scale-150 transition-transform duration-700 blur-2xl"></div>

                    <div class="flex items-start justify-between mb-8 relative z-10">
                        <div class="w-16 h-16 rounded-[1.8rem] bg-slate-50 dark:bg-slate-800 text-primary-600 dark:text-primary-400 flex items-center justify-center text-3xl shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">
                            🎯
                        </div>
                        <div class="text-right">
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Time Limit</p>
                            <p class="text-xs font-black text-slate-700 dark:text-slate-300">{{ ex.exam_type !== 'performance' ? ex.duration_minutes + ' m' : 'No Limit' }}</p>
                        </div>
                    </div>
                    
                    <h3 class="font-black text-slate-800 dark:text-white text-2xl mb-2 leading-tight group-hover:text-primary-600 transition-colors">{{ ex.title }}</h3>
                    <p class="text-[10px] font-black text-primary-500 uppercase tracking-widest mb-8">Capacity: {{ ex.total_marks }} Cumulative Marks</p>
                    
                    <button (click)="takeExam(ex)"
                            [disabled]="!ex.can_take"
                            class="w-full py-5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-black uppercase tracking-[0.25em] text-[10px] rounded-[1.5rem] shadow-button hover:shadow-premium hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed">
                        {{ ex.has_attempted && !ex.can_take ? 'Execution Complete' : 'Synchronize Assessment' }}
                    </button>
                </div>
            </div>

            <div *ngIf="assignedExams.length === 0" class="py-32 text-center bg-white/50 dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div class="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-5xl mx-auto mb-8 animate-bounce">🏝️</div>
                <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Queue Exhausted</h3>
                <p class="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-2">All assessments have been successfully cleared.</p>
            </div>
        </div>

        <!-- Results History Tab -->
        <div *ngIf="activeTab === 'results'" class="space-y-6">
            <!-- Table for Desktop, Cards for Mobile -->
            <div *ngIf="examResults.length > 0" class="hidden lg:block bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 overflow-hidden shadow-soft">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-slate-50/50 dark:bg-slate-800/30 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">
                            <th class="px-10 py-6">Evaluation Unit</th>
                            <th class="px-10 py-6 text-center">Timestamp</th>
                            <th class="px-10 py-6 text-center">Aggregate</th>
                            <th class="px-10 py-6 text-center">Intensity</th>
                            <th class="px-10 py-6 text-right">Verdict</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-50 dark:divide-slate-800">
                        <tr *ngFor="let res of examResults" class="group hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-all">
                            <td class="px-10 py-8">
                                <div class="flex items-center gap-5">
                                    <div class="w-12 h-12 rounded-2xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-xl shadow-inner group-hover:bg-primary-600 group-hover:text-white transition-all duration-500">📄</div>
                                    <div>
                                        <p class="font-black text-slate-800 dark:text-white text-lg group-hover:text-primary-600 transition-colors">{{ res.exam_title }}</p>
                                        <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Sequence Identification #{{ res.attempt_number }}</p>
                                    </div>
                                </div>
                            </td>
                            <td class="px-10 py-8 text-center">
                                <span class="text-xs font-black text-slate-500 dark:text-slate-400 uppercase">{{ res.end_time | date:'mediumDate' }}</span>
                            </td>
                            <td class="px-10 py-8 text-center">
                                <p class="text-xl font-black text-slate-800 dark:text-white">{{ res.total_score }} <span class="text-slate-300 dark:text-slate-600 text-xs font-bold ring-1 ring-slate-100 dark:ring-slate-800 px-2 py-1 rounded-lg ml-1">/ {{ res.exam_total_marks }}</span></p>
                            </td>
                            <td class="px-10 py-8 text-center">
                                <div class="inline-flex flex-col items-center">
                                    <span class="text-2xl font-black" [class.text-emerald-500]="((res.total_score / res.exam_total_marks) * 100) >= res.pass_percentage" [class.text-rose-500]="((res.total_score / res.exam_total_marks) * 100) < res.pass_percentage">
                                        {{ ((res.total_score / res.exam_total_marks) * 100).toFixed(1) }}%
                                    </span>
                                </div>
                            </td>
                            <td class="px-10 py-8 text-right">
                                <div class="flex items-center justify-end gap-4">
                                    <button (click)="review(res)" 
                                        class="px-6 py-3 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-primary-600 dark:hover:bg-primary-500 dark:hover:text-white transition-all shadow-lg">
                                        Detailed Audit
                                    </button>
                                    <span *ngIf="(res.total_score / res.exam_total_marks) * 100 >= res.pass_percentage" 
                                        class="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">Cleared</span>
                                    <span *ngIf="(res.total_score / res.exam_total_marks) * 100 < res.pass_percentage" 
                                        class="px-4 py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg shadow-rose-600/20">Deficient</span>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Mobile Cards -->
            <div class="lg:hidden space-y-4">
                <div *ngFor="let res of examResults" 
                    class="bg-white dark:bg-slate-900 p-6 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft space-y-6">
                    <div class="flex items-center gap-4">
                        <div class="w-14 h-14 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📄</div>
                        <div class="flex-1 min-w-0">
                            <h4 class="font-black text-slate-800 dark:text-white truncate">{{ res.exam_title }}</h4>
                            <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attempt #{{ res.attempt_number }} • {{ res.end_time | date:'medium' }}</p>
                        </div>
                    </div>

                    <div class="grid grid-cols-2 gap-3">
                        <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Score</p>
                            <p class="text-lg font-black text-slate-800 dark:text-white">{{ res.total_score }} / {{ res.exam_total_marks }}</p>
                        </div>
                        <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 text-right">
                            <p class="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Percentage</p>
                            <p class="text-lg font-black" [class.text-emerald-500]="((res.total_score / res.exam_total_marks) * 100) >= res.pass_percentage" [class.text-rose-500]="((res.total_score / res.exam_total_marks) * 100) < res.pass_percentage">
                                {{ ((res.total_score / res.exam_total_marks) * 100).toFixed(1) }}%
                            </p>
                        </div>
                    </div>

                    <div class="flex items-center gap-3">
                        <button (click)="review(res)" 
                            class="flex-1 py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all font-black">
                            Audit Report
                        </button>
                        <div [class]="(res.total_score / res.exam_total_marks) * 100 >= res.pass_percentage ? 'bg-emerald-600' : 'bg-rose-600'"
                             class="px-6 py-4 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg">
                             {{ (res.total_score / res.exam_total_marks) * 100 >= res.pass_percentage ? 'Cleared' : 'Deficient' }}
                        </div>
                    </div>
                </div>
            </div>

            <div *ngIf="examResults.length === 0" class="py-32 text-center bg-white/50 dark:bg-slate-900/50 rounded-[4rem] border-2 border-dashed border-slate-100 dark:border-slate-800">
                <div class="w-24 h-24 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center text-5xl mx-auto mb-8">📉</div>
                <h3 class="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tighter">Null History</h3>
                <p class="text-slate-500 dark:text-slate-400 font-bold text-xs uppercase tracking-widest mt-2 px-6">Your performance analytics will populate here upon graduation.</p>
            </div>
        </div>
    </div>

    <!-- Review Modal -->
    <app-modal [isOpen]="isReviewModalOpen" [title]="'Assessment Review - ' + activeSubmission?.exam_title"
        (onClose)="isReviewModalOpen = false" hideFooter="true" size="huge">
        <div class="p-10 space-y-12">
            <!-- Header Summary -->
            <div class="p-8 bg-slate-50 dark:bg-slate-800 rounded-[2.5rem] border border-slate-100 dark:border-slate-800">
                <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Final Score</p>
                        <p class="text-2xl font-black text-slate-800 dark:text-white">{{ activeSubmission?.total_score }} / {{ activeSubmission?.exam_total_marks }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Percentage</p>
                        <p class="text-2xl font-black text-slate-800 dark:text-white">{{ ((activeSubmission?.total_score / activeSubmission?.exam_total_marks) * 100).toFixed(1) }}%</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Attempt No.</p>
                        <p class="text-2xl font-black text-slate-800 dark:text-white">#{{ activeSubmission?.attempt_number }}</p>
                    </div>
                    <div>
                        <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</p>
                        <app-badge [label]="activeSubmission?.status" [type]="activeSubmission?.status === 'evaluated' ? 'success' : 'warning'"></app-badge>
                    </div>
                </div>
            </div>

            <!-- Questions Review -->
            <div class="space-y-8">
                <div *ngFor="let q of activeSubmission?.answers; let i = index" 
                    class="p-8 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[2.5rem] shadow-soft relative overflow-hidden">
                    
                    <div class="absolute top-0 right-10 w-24 h-24 bg-slate-50 dark:bg-slate-800/30 rounded-full -mt-12 flex items-center justify-center pt-8">
                        <span class="text-xs font-black" [class.text-emerald-500]="q.is_correct == 1" [class.text-rose-500]="q.is_correct == 0">
                            {{ q.marks_obtained }} / {{ q.question_marks }}
                        </span>
                    </div>

                    <div class="flex items-start gap-6 mb-6">
                        <span class="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-xs text-slate-400">0{{i+1}}</span>
                        <div class="flex-1">
                            <p class="text-lg font-bold text-slate-800 dark:text-white leading-relaxed">{{ q.question_text }}</p>
                        </div>
                    </div>

                    <div class="pl-16 space-y-4">
                        <!-- For MCQ -->
                        <div *ngIf="q.question_type === 'mcq'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div *ngFor="let opt of q.options" 
                                [class.border-emerald-500]="opt.is_correct == 1"
                                [class.bg-emerald-50]="opt.is_correct == 1"
                                [class.dark:bg-emerald-900/10]="opt.is_correct == 1"
                                [class.border-rose-500]="q.selected_option_id == opt.id && opt.is_correct == 0"
                                [class.bg-rose-50]="q.selected_option_id == opt.id && opt.is_correct == 0"
                                [class.dark:bg-rose-900/10]="q.selected_option_id == opt.id && opt.is_correct == 0"
                                class="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <span class="text-sm font-medium">{{ opt.option_text }}</span>
                                <span *ngIf="opt.is_correct == 1" class="text-emerald-500">✓ Correct</span>
                                <span *ngIf="q.selected_option_id == opt.id && opt.is_correct == 0" class="text-rose-500">✗ Your Choice</span>
                                <span *ngIf="q.selected_option_id == opt.id && opt.is_correct == 1" class="text-emerald-500 font-black">★ Correct</span>
                            </div>
                        </div>

                        <!-- For Text -->
                        <div *ngIf="q.question_type === 'text' || q.question_type === 'task'">
                            <p class="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                {{ q.question_type === 'task' ? 'Task Description:' : 'Submitted Response:' }}
                            </p>
                            <div class="p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl italic text-slate-600 dark:text-slate-300">
                                {{ q.question_type === 'task' ? q.question_text : (q.answer_text || 'No response provided.') }}
                            </div>

                            <div *ngIf="q.remarks" class="mt-4 p-4 bg-primary-50 dark:bg-primary-900/10 border-l-4 border-primary-500 rounded-r-2xl">
                                <p class="text-[9px] font-black uppercase tracking-widest text-primary-600 mb-1">Faculty Feedback</p>
                                <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ q.remarks }}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </app-modal>
  `
})
export class StudentExamComponent implements OnInit {
    assignedExams: any[] = [];
    examResults: any[] = [];
    user: any = null;
    activeTab: 'assigned' | 'results' = 'assigned';

    // Review Logic
    isReviewModalOpen = false;
    activeSubmission: any = null;

    constructor(private dataService: DataService, private authService: AuthService, private router: Router) { }

    ngOnInit() {
        this.authService.currentUser.subscribe(u => {
            this.user = u;
            if (this.user) {
                this.loadAssignedExams();
                this.loadExamResults();
            }
        });
    }

    loadAssignedExams() {
        this.dataService.getAssignedExams().subscribe((exams: any[]) => {
            this.assignedExams = exams;
        });
    }

    loadExamResults() {
        this.dataService.getStudentResults().subscribe((results: any[]) => {
            this.examResults = results;
        });
    }

    takeExam(exam: any) {
        const examId = exam.id || exam.exam_id;
        this.router.navigate(['/public/exam', examId]);
    }

    review(submission: any) {
        this.dataService.getSubmissionDetails(submission.id).subscribe((res: any) => {
            this.activeSubmission = res;
            this.isReviewModalOpen = true;
        });
    }
}
