import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-slate-50 dark:bg-slate-800/50 p-8 rounded-[2.5rem] space-y-6">
      <div class="flex flex-col gap-4">
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 px-6 py-3 rounded-2xl">
          <label class="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Question Type</label>
          <select [(ngModel)]="currentQuestion.question_type"
                  class="bg-slate-50 dark:bg-slate-800 border-none rounded-xl px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-700 dark:text-white outline-none cursor-pointer">
            <option value="mcq" *ngIf="examType === 'standard'">Multiple Choice (MCQ)</option>
            <option value="text" *ngIf="examType === 'standard'">Subjective (Text)</option>
            <option value="task" *ngIf="examType === 'performance'">Exam Task</option>
          </select>
        </div>
        <textarea [(ngModel)]="currentQuestion.question_text" rows="3"
                  class="w-full px-6 py-5 bg-white dark:bg-slate-900 border-none rounded-2xl text-lg text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/10 transition-all font-medium"
                  [placeholder]="examType === 'performance' ? 'Enter task description here...' : 'Enter your question here...'"></textarea>
      </div>

      <!-- MCQ Options Builder -->
      <div *ngIf="currentQuestion.question_type === 'mcq'" class="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div *ngFor="let opt of [0,1,2,3]; let i = index" 
             [class.ring-2]="currentQuestion.options[i]?.is_correct"
             class="relative group ring-emerald-500/50 transition-all rounded-2xl">
          <input type="text" [(ngModel)]="currentQuestion.options[i].option_text"
                 class="w-full pl-6 pr-12 py-4 bg-white dark:bg-slate-900 border-none rounded-2xl text-base font-medium outline-none"
                 [placeholder]="'Option ' + (i+1)">
          
          <button (click)="setCorrect(i)" 
                  [class.bg-emerald-500]="currentQuestion.options[i]?.is_correct"
                  [class.text-white]="currentQuestion.options[i]?.is_correct"
                  class="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 text-xs transition-all hover:scale-110">
             {{ currentQuestion.options[i]?.is_correct ? '✓' : '' }}
          </button>
        </div>
      </div>

      <div class="flex items-center justify-between pt-2">
        <div class="flex items-center gap-4 bg-white dark:bg-slate-900 px-4 py-2 rounded-2xl border border-slate-100 dark:border-slate-800">
          <label class="text-xs font-black text-slate-400 uppercase tracking-widest">Marks:</label>
          <input type="number" [(ngModel)]="currentQuestion.marks"
                 class="w-20 bg-transparent text-lg font-black text-slate-800 dark:text-white outline-none text-center">
        </div>
        <div class="flex items-center gap-2">
            <button *ngIf="editIndex !== null" (click)="cancelEdit()"
                    class="px-6 py-4 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all">
              Cancel
            </button>
            <button (click)="onAdd()"
                    class="px-10 py-4"
                    [class.bg-emerald-500]="editIndex === null"
                    [class.bg-primary-500]="editIndex !== null"
                    class="text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:opacity-90 shadow-xl transition-all active:scale-95 p-3">
              {{ editIndex !== null ? 'Update Question' : 'Insert Question' }}
            </button>
        </div>
      </div>
    </div>
  `
})
export class QuestionBuilderComponent {
  private _examType: 'standard' | 'performance' = 'standard';
  @Input()
  set examType(value: 'standard' | 'performance') {
    const changed = this._examType !== value;
    this._examType = value;
    if (changed) {
      this.currentQuestion = this.resetQuestion();
    }
  }
  get examType() { return this._examType; }

  @Output() onQuestionAdd = new EventEmitter<any>();
  @Output() onQuestionUpdate = new EventEmitter<{ index: number, question: any }>();

  _currentQuestion: any;
  get currentQuestion() {
    if (!this._currentQuestion) {
      this._currentQuestion = this.resetQuestion();
    }
    return this._currentQuestion;
  }
  set currentQuestion(val) { this._currentQuestion = val; }

  editIndex: number | null = null;

  resetQuestion() {
    return {
      question_type: this.examType === 'performance' ? 'task' : 'mcq',
      question_text: '',
      marks: 1,
      options: [
        { option_text: '', is_correct: 0 },
        { option_text: '', is_correct: 0 },
        { option_text: '', is_correct: 0 },
        { option_text: '', is_correct: 0 }
      ]
    };
  }

  setCorrect(index: number) {
    this.currentQuestion.options.forEach((o: any, i: number) => {
      o.is_correct = (i === index ? 1 : 0);
    });
  }

  editQuestion(index: number, question: any) {
    this.editIndex = index;
    this.currentQuestion = JSON.parse(JSON.stringify(question));
    // Ensure 4 options for MCQ
    if (this.currentQuestion.question_type === 'mcq' && this.currentQuestion.options.length < 4) {
      while (this.currentQuestion.options.length < 4) {
        this.currentQuestion.options.push({ option_text: '', is_correct: 0 });
      }
    }
  }

  cancelEdit() {
    this.editIndex = null;
    this.currentQuestion = this.resetQuestion();
  }

  onAdd() {
    if (!this.currentQuestion.question_text) return;

    // Ensure marks are numeric to prevent string concatenation issues
    this.currentQuestion.marks = Number(this.currentQuestion.marks) || 0;

    if (this.editIndex !== null) {
      this.onQuestionUpdate.emit({
        index: this.editIndex,
        question: { ...this.currentQuestion }
      });
      this.cancelEdit();
    } else {
      this.onQuestionAdd.emit({ ...this.currentQuestion });
      this.currentQuestion = this.resetQuestion();
    }
  }
}
