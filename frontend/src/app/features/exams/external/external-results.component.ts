import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { ToastService } from '../../../services/toast.service';

@Component({
    selector: 'app-external-results',
    standalone: true,
    imports: [CommonModule, FormsModule, BadgeComponent],
    template: `
    <div class="min-h-screen bg-slate-50 dark:bg-slate-950 p-6 lg:p-12">
        <div class="max-w-5xl mx-auto space-y-12">
            <!-- Header -->
            <div class="flex items-center justify-between">
                <button (click)="goBack()" class="flex items-center gap-3 text-slate-400 hover:text-rose-500 transition-all group">
                    <span class="w-10 h-10 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-all">←</span>
                    <span class="text-[10px] font-black uppercase tracking-widest">Back to Exams</span>
                </button>
                <div class="text-right">
                    <p class="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-1">Detailed Scorecard</p>
                    <h1 class="text-2xl font-black text-slate-900 dark:text-white">{{ submission?.name }}</h1>
                </div>
            </div>

            <!-- Summary Card -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-8 p-10 bg-white dark:bg-slate-900 rounded-[3rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                <div class="md:col-span-2 space-y-6">
                    <div>
                        <h2 class="text-4xl font-black text-slate-900 dark:text-white mb-2">{{ submission?.title }}</h2>
                        <div class="flex items-center gap-6 text-slate-500 font-bold text-sm">
                            <span class="flex items-center gap-2">📧 {{ submission?.email }}</span>
                            <span class="w-2 h-2 rounded-full bg-slate-200"></span>
                            <span>Attempt #{{ submission?.attempt_number }}</span>
                        </div>
                    </div>
                    <div class="flex gap-4">
                        <app-badge [label]="submission?.is_evaluated == 1 ? 'Evaluated' : 'Pending Review'" [type]="submission?.is_evaluated == 1 ? 'success' : 'warning'"></app-badge>
                        <app-badge [label]="getVerdict()" [type]="getVerdict() === 'PASSED' ? 'success' : 'danger'"></app-badge>
                    </div>
                </div>
                <div class="flex flex-col items-center md:items-end justify-center border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-8 md:pt-0">
                    <div class="text-7xl font-black text-slate-900 dark:text-white tabular-nums">{{ submission?.score }}<span class="text-2xl text-slate-400 font-black">/{{ submission?.total_marks }}</span></div>
                    <p class="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-4">Calculated Marks</p>
                </div>
            </div>

            <!-- Answers Feed -->
            <div class="space-y-12 pb-20">
                <div *ngFor="let ans of submission?.answers; let i = index" class="group transition-all">
                    <div class="flex gap-8">
                        <div class="flex flex-col items-center">
                            <div class="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-black">{{ i+1 }}</div>
                            <div *ngIf="i < submission.answers.length - 1" class="w-1 flex-1 bg-slate-200 dark:bg-slate-800 my-4 rounded-full"></div>
                        </div>

                        <div class="flex-1 space-y-8 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">{{ ans.question_type }}</span>
                                    <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Question Content</span>
                                </div>
                                    <div class="flex items-center gap-6">
                                        <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks</label>
                                        <div class="flex items-center gap-3">
                                        <input type="number" [(ngModel)]="ans.marks_obtained"
                                            [disabled]="isReadOnly() || ans.question_type === 'mcq' || submission?.status_eval === 'evaluated'"
                                            [max]="ans.question_marks"
                                            min="0"
                                            step="0.01"
                                            (change)="recalculateTotal()"
                                            class="w-16 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-xl font-black text-center text-lg focus:ring-2 ring-rose-500 outline-none border-none">
                                        <span class="text-xs font-black text-slate-400">/ {{ ans.question_marks }}</span>
                                        </div>
                                    </div>
                                </div>

                            <h4 class="text-2xl font-bold text-slate-800 dark:text-white leading-relaxed">{{ ans.question_text }}</h4>

                            <div class="bg-slate-50 dark:bg-slate-950/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Candidate Response</p>
                                
                                <div *ngIf="ans.question_type === 'mcq'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div *ngFor="let opt of ans.options" class="flex items-center gap-4 p-5 rounded-2xl border-2 transition-all" 
                                        [class.bg-emerald-500/5]="opt.is_correct == 1" 
                                        [class.border-emerald-500/20]="opt.is_correct == 1"
                                        [class.bg-rose-500/5]="ans.selected_option_id == opt.id && opt.is_correct == 0"
                                        [class.border-rose-500/20]="ans.selected_option_id == opt.id && opt.is_correct == 0"
                                        [class.border-transparent]="ans.selected_option_id != opt.id && opt.is_correct == 0">
                                        
                                        <div class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black transition-all"
                                            [class.bg-emerald-500]="opt.is_correct == 1" [class.text-white]="opt.is_correct == 1"
                                            [class.bg-rose-500]="ans.selected_option_id == opt.id && opt.is_correct == 0" [class.text-white]="ans.selected_option_id == opt.id && opt.is_correct == 0"
                                            [class.bg-slate-200]="ans.selected_option_id != opt.id && opt.is_correct == 0" [class.dark:bg-slate-800]="ans.selected_option_id != opt.id && opt.is_correct == 0">
                                            {{ ans.selected_option_id == opt.id ? '✓' : '' }}
                                        </div>
                                        
                                        <span class="font-bold flex-1" [class.text-emerald-600]="opt.is_correct == 1" [class.text-rose-600]="ans.selected_option_id == opt.id && opt.is_correct == 0">
                                            {{ opt.option_text }}
                                        </span>
                                    </div>
                                </div>

                                <div *ngIf="ans.question_type === 'text' || ans.question_type === 'task'">
                                    <p class="text-xl text-slate-700 dark:text-slate-300 font-serif leading-relaxed italic whitespace-pre-wrap">
                                        "{{ ans.answer_text || 'Zero input recorded.' }}"
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="flex justify-center pt-10" *ngIf="!isReadOnly()">
                    <button (click)="saveEvaluation()" class="px-16 py-6 bg-rose-600 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-[11px] shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                        Finalize Report
                    </button>
                </div>
            </div>
        </div>
    </div>
    `
})
export class ExternalResultsComponent implements OnInit {
    submission: any = null;
    mode: 'view' | 'edit' = 'edit';

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private dataService: DataService,
        private toastService: ToastService
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        this.route.queryParamMap.subscribe(params => {
            this.mode = params.get('mode') === 'view' ? 'view' : 'edit';
        });
        if (id) {
            this.loadDetails(id);
        }
    }

    loadDetails(id: string) {
        this.dataService.getExternalSubmissionDetails(id).subscribe((res: any) => {
            this.submission = res.data;
            this.recalculateTotal();
        });
    }

    getVerdict() {
        if (!this.submission) return 'PENDING';
        const percentage = (this.submission.score / this.submission.total_marks) * 100;
        return percentage >= this.submission.pass_percentage ? 'PASSED' : 'FAILED';
    }

    saveEvaluation() {
        const invalid = this.submission.answers.find((a: any) =>
            Number(a.marks_obtained) > (Number(a.question_marks) || 0) || Number(a.marks_obtained) < 0
        );

        if (invalid) {
            this.toastService.warning(`Marks for question "${invalid.question_text}" cannot exceed ${invalid.question_marks} or be less than 0.`);
            return;
        }

        const evaluations = this.submission.answers.map((a: any) => ({
            answer_id: a.id,
            marks: a.marks_obtained,
            is_correct: a.question_type === 'mcq' ? a.is_correct : (Number(a.marks_obtained) > 0 ? 1 : 0)
        }));

        this.dataService.evaluateExternalExam({
            submission_id: this.submission.id,
            evaluations: evaluations
        }).subscribe({
            next: () => {
                this.toastService.success('Scorecard finalized successfully!');
                this.loadDetails(this.submission.id);
            },
            error: (err) => {
                this.toastService.error(err.error?.message || 'Failed to finalize external evaluation');
            }
        });
    }

    recalculateTotal() {
        if (!this.submission?.answers) return;
        const total = this.submission.answers.reduce((acc: number, a: any) =>
            acc + (Number(a.marks_obtained) || 0), 0);
        this.submission.score = total;
    }

    isReadOnly() {
        return this.mode === 'view';
    }

    goBack() {
        this.router.navigate(['/exams/external']);
    }
}
