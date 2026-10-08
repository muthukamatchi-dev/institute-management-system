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
                <div class="flex items-center gap-4">
                    <button *ngIf="isReadOnly()" (click)="mode = 'edit'"
                        class="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all flex items-center gap-2 active:scale-95">
                        <span>✏️</span> Edit / Evaluate Marks
                    </button>
                    <button *ngIf="!isReadOnly()" (click)="mode = 'view'"
                        class="px-5 py-2.5 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-black uppercase tracking-wider transition-all">
                        View Only
                    </button>
                    <div class="text-right">
                        <p class="text-[10px] font-black text-rose-500 uppercase tracking-[0.3em] mb-1">Detailed Scorecard</p>
                        <h1 class="text-2xl font-black text-slate-900 dark:text-white">{{ submission?.name }}</h1>
                    </div>
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
            <div class="space-y-10 pb-20">
                <div *ngFor="let ans of submission?.answers; let i = index" class="group transition-all">
                    <!-- Section Header / Break Item -->
                    <div *ngIf="isSectionItem(ans)"
                        class="p-6 bg-slate-100 dark:bg-slate-800/80 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-xs">
                        <div class="flex items-center gap-3">
                            <span class="px-3 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/30 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                SECTION
                            </span>
                            <h3 class="text-xl font-black text-slate-800 dark:text-white uppercase tracking-wider">
                                {{ ans.question_text }}
                            </h3>
                        </div>
                    </div>

                    <!-- Regular Question Item -->
                    <div *ngIf="!isSectionItem(ans)" class="flex gap-8">
                        <div class="flex flex-col items-center">
                            <div class="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center text-xl font-black">
                                {{ getQuestionNumberForList(submission?.answers, i) }}
                            </div>
                            <div *ngIf="i < submission.answers.length - 1" class="w-1 flex-1 bg-slate-200 dark:bg-slate-800 my-4 rounded-full"></div>
                        </div>

                        <div class="flex-1 space-y-8 bg-white dark:bg-slate-900 p-10 rounded-[2.5rem] border border-slate-100 dark:border-slate-800 shadow-soft">
                            <div class="flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <span class="text-[10px] font-black uppercase tracking-widest px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-lg">
                                        {{ ans.question_type }}
                                    </span>
                                    <span *ngIf="!isStaffInterventionQuestion(ans)" class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-400">
                                        Auto-Graded
                                    </span>
                                    <span *ngIf="isStaffInterventionQuestion(ans)" class="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
                                        Staff Review
                                    </span>
                                </div>
                                <div class="flex items-center gap-4">
                                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marks</label>
                                    <div class="flex items-center gap-2">
                                        <!-- Editable for Staff Intervention Questions (Descriptive, Either-Or, Text) when in edit mode -->
                                        <div *ngIf="isStaffInterventionQuestion(ans) && !isReadOnly()" class="flex items-center gap-1.5">
                                            <button type="button"
                                                (click)="adjustMarks(ans, -0.5)"
                                                [disabled]="(ans.marks_obtained || 0) <= 0"
                                                title="Subtract 0.5 mark"
                                                class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none font-black text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 shadow-sm">
                                                -½
                                            </button>
                                            <input type="number"
                                                [(ngModel)]="ans.marks_obtained"
                                                (ngModelChange)="onMarksChange(ans)"
                                                [max]="ans.question_marks"
                                                min="0"
                                                step="0.5"
                                                placeholder="0"
                                                class="w-16 px-2 py-1.5 bg-slate-100 dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-700 focus:border-rose-500 rounded-xl font-black text-center text-base text-slate-900 dark:text-white outline-none">
                                            <button type="button"
                                                (click)="adjustMarks(ans, 0.5)"
                                                [disabled]="(ans.marks_obtained || 0) >= (ans.question_marks || 0)"
                                                title="Add 0.5 mark"
                                                class="w-8 h-8 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:pointer-events-none font-black text-xs text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all active:scale-95 shadow-sm">
                                                +½
                                            </button>
                                        </div>

                                        <!-- Read-only or Auto-graded badge -->
                                        <span *ngIf="!isStaffInterventionQuestion(ans) || isReadOnly()"
                                            class="min-w-14 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-xl font-black text-center text-base text-slate-800 dark:text-white inline-block">
                                            {{ ans.marks_obtained ?? 0 }}
                                        </span>
                                        <span class="text-xs font-black text-slate-400">/ {{ ans.question_marks }}</span>
                                    </div>
                                </div>
                            </div>

                            <h4 class="text-2xl font-bold text-slate-800 dark:text-white leading-relaxed">{{ ans.question_text }}</h4>

                            <div class="bg-slate-50 dark:bg-slate-950/50 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 space-y-6">
                                <p class="text-[10px] font-black text-slate-400 uppercase tracking-widest">Candidate Response</p>
                                
                                <!-- MCQ Response -->
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

                                <!-- Fillups Response: Both Student Typed and Correct Answer -->
                                <div *ngIf="isFillupQuestion(ans)" class="space-y-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="p-5 rounded-2xl border-2"
                                            [class.border-emerald-500/40]="isFillupCorrect(ans)"
                                            [class.bg-emerald-500/5]="isFillupCorrect(ans)"
                                            [class.border-rose-500/40]="!isFillupCorrect(ans)"
                                            [class.bg-rose-500/5]="!isFillupCorrect(ans)">
                                            <div class="flex items-center justify-between mb-2">
                                                <span class="text-[10px] font-black uppercase tracking-widest text-slate-400">✍️ Candidate's Typed Answer</span>
                                                <span *ngIf="isFillupCorrect(ans)" class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600">✓ Matches</span>
                                                <span *ngIf="!isFillupCorrect(ans)" class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-rose-500/10 text-rose-600">✕ Incorrect</span>
                                            </div>
                                            <p class="text-lg font-bold text-slate-800 dark:text-white">{{ ans.answer_text || '(No answer typed)' }}</p>
                                        </div>
                                        <div class="p-5 rounded-2xl border-2 border-emerald-500/30 bg-emerald-500/5">
                                            <span class="text-[10px] font-black uppercase tracking-widest text-emerald-600 block mb-2">🎯 Correct Answer Key</span>
                                            <p class="text-lg font-bold text-emerald-700 dark:text-emerald-300">{{ ans.correct_answer || '(No key recorded)' }}</p>
                                        </div>
                                    </div>
                                </div>

                                <!-- Descriptive / Task / Text -->
                                <div *ngIf="ans.question_type === 'text' || ans.question_type === 'task' || ans.question_type === 'descriptive'">
                                    <p class="text-xl text-slate-700 dark:text-slate-300 font-serif leading-relaxed italic whitespace-pre-wrap">
                                        "{{ ans.answer_text || 'Zero input recorded.' }}"
                                    </p>
                                </div>

                                <!-- Either / Or Response -->
                                <div *ngIf="ans.question_type === 'either_or'" class="space-y-4">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="p-4 bg-primary-500/5 border border-primary-500/20 rounded-2xl">
                                            <span class="text-xs font-black text-primary-500 uppercase block mb-1">Option A</span>
                                            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ getEitherOrA(ans) }}</p>
                                        </div>
                                        <div class="p-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl">
                                            <span class="text-xs font-black text-indigo-500 uppercase block mb-1">Option B</span>
                                            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">{{ getEitherOrB(ans) }}</p>
                                        </div>
                                    </div>
                                    <div class="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800">
                                        <span class="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-2">Submitted Response:</span>
                                        <p class="text-base text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">{{ ans.answer_text || 'No response provided.' }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Footer Action -->
                <div class="flex justify-center gap-4 pt-10">
                    <button *ngIf="isReadOnly()" (click)="mode = 'edit'"
                        class="px-12 py-5 bg-rose-600 hover:bg-rose-500 text-white rounded-[2rem] font-black uppercase tracking-[0.25em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                        <span>✏️</span> Evaluate / Edit Marks Now
                    </button>
                    <button *ngIf="!isReadOnly()" (click)="saveEvaluation()"
                        class="px-16 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[2rem] font-black uppercase tracking-[0.3em] text-xs shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-4">
                        <span>✓</span> Finalize & Save Evaluation
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

    isSectionItem(q: any): boolean {
        if (!q) return false;
        if (q.is_section_title || q.is_section_break) return true;
        const type = (q.question_type || '').toLowerCase();
        if (type === 'section_header' || type === 'section_break' || type === 'section') return true;
        const text = (q.question_text || '').trim();
        const marks = Number(q.marks || q.question_marks || q.max_marks) || 0;
        if (marks === 0 && (
            /^section\b/i.test(text) || 
            /^part\b/i.test(text) || 
            /^[ivxlcdm]+\.\s*(answer|choose|fill|match)/i.test(text)
        )) {
            return true;
        }
        return false;
    }

    getQuestionNumberForList(questions: any[] | undefined, targetIndex: number): number {
        if (!questions) return 1;
        let count = 0;
        for (let i = 0; i <= targetIndex; i++) {
            const q = questions[i];
            if (q && !this.isSectionItem(q)) {
                count++;
            }
        }
        return count || 1;
    }

    isStaffInterventionQuestion(ans: any): boolean {
        if (!ans || this.isSectionItem(ans)) return false;
        const type = (ans.question_type || '').toLowerCase();
        return type === 'descriptive' || type === 'either_or' || type === 'text' || type === 'task';
    }

    isFillupQuestion(ans: any): boolean {
        if (!ans) return false;
        const type = (ans.question_type || '').toLowerCase();
        return type === 'fillups' || type === 'fill_in_the_blanks' || type === 'fill';
    }

    isFillupCorrect(ans: any): boolean {
        if (!ans) return false;
        const student = (ans.answer_text || '').trim().toLowerCase();
        const expected = (ans.correct_answer || '').trim().toLowerCase();
        return student.length > 0 && expected.length > 0 && student === expected;
    }

    getEitherOrA(q: any): string {
        if (!q) return '';
        if (q.question_a) return q.question_a;
        if (q.options && q.options.length > 0 && q.options[0]?.option_text) return q.options[0].option_text;
        if (q.question_text) {
            const parts = q.question_text.split(/\n?\(or\)\n?/i);
            return parts[0].replace(/^[Aa][\.\)]\s*/, '').trim();
        }
        return '';
    }

    getEitherOrB(q: any): string {
        if (!q) return '';
        if (q.question_b) return q.question_b;
        if (q.options && q.options.length > 1 && q.options[1]?.option_text) return q.options[1].option_text;
        if (q.question_text) {
            const parts = q.question_text.split(/\n?\(or\)\n?/i);
            if (parts.length > 1) return parts[1].replace(/^[Bb][\.\)]\s*/, '').trim();
        }
        return '';
    }

    adjustMarks(ans: any, delta: number) {
        const current = Number(ans.marks_obtained) || 0;
        const max = Number(ans.question_marks) || 0;
        let next = Math.round((current + delta) * 10) / 10;
        if (next < 0) next = 0;
        if (next > max) next = max;
        ans.marks_obtained = next;
        this.recalculateTotal();
    }

    onMarksChange(ans: any) {
        const val = Number(ans.marks_obtained);
        const max = Number(ans.question_marks) || 0;
        if (val > max) {
            ans.marks_obtained = max;
        } else if (val < 0) {
            ans.marks_obtained = 0;
        }
        this.recalculateTotal();
    }

    loadDetails(id: string) {
        this.dataService.getExternalSubmissionDetails(id).subscribe((res: any) => {
            this.submission = res.data;
            if (this.submission && this.submission.answers) {
                this.submission.answers.forEach((ans: any) => {
                    if (this.isSectionItem(ans)) {
                        ans.marks_obtained = 0;
                        ans.is_correct = null;
                    } else if (this.isFillupQuestion(ans)) {
                        const correct = this.isFillupCorrect(ans);
                        ans.is_correct = correct ? 1 : 0;
                        const qMarks = Number(ans.question_marks) || 1;
                        if (ans.marks_obtained == null) {
                            ans.marks_obtained = correct ? qMarks : 0;
                        } else {
                            ans.marks_obtained = Number(ans.marks_obtained);
                        }
                    } else {
                        if (ans.marks_obtained == null) {
                            ans.marks_obtained = 0;
                        } else {
                            ans.marks_obtained = Number(ans.marks_obtained);
                        }
                    }
                });
            }
            this.recalculateTotal();
        });
    }

    getVerdict() {
        if (!this.submission) return 'PENDING';
        const percentage = (this.submission.score / this.submission.total_marks) * 100;
        return percentage >= this.submission.pass_percentage ? 'PASSED' : 'FAILED';
    }

    saveEvaluation() {
        const invalid = this.submission?.answers?.find((a: any) =>
            !this.isSectionItem(a) && (Number(a.marks_obtained) > (Number(a.question_marks) || 0) || Number(a.marks_obtained) < 0)
        );

        if (invalid) {
            this.toastService.warning(`Marks for question "${invalid.question_text}" cannot exceed ${invalid.question_marks} or be less than 0.`);
            return;
        }

        const evaluations = this.submission.answers.map((a: any) => {
            if (this.isSectionItem(a)) {
                return { answer_id: a.id, marks: 0, is_correct: null };
            }
            if (this.isFillupQuestion(a)) {
                const correct = this.isFillupCorrect(a);
                const qMarks = Number(a.question_marks) || 1;
                return { answer_id: a.id, marks: correct ? qMarks : 0, is_correct: correct ? 1 : 0 };
            }
            return {
                answer_id: a.id,
                marks: a.marks_obtained,
                is_correct: a.question_type === 'mcq' ? a.is_correct : (Number(a.marks_obtained) > 0 ? 1 : 0)
            };
        });

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
            acc + (this.isSectionItem(a) ? 0 : (Number(a.marks_obtained) || 0)), 0);
        this.submission.score = total;
    }

    isReadOnly() {
        return this.mode === 'view';
    }

    goBack() {
        this.router.navigate(['/exams/external']);
    }
}
