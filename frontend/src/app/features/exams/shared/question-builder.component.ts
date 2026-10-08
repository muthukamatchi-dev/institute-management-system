import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-question-builder',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-2xl space-y-4">
      <div class="flex flex-col gap-3">
        <!-- Question Type Selector Dropdown -->
        <div class="flex justify-between items-center bg-white dark:bg-slate-900 px-5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80">
          <label class="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Question Type</label>
          <div class="relative">
            <select [(ngModel)]="currentQuestion.question_type" (change)="onTypeChange()"
                    class="appearance-none bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl pl-3.5 pr-8 py-1.5 text-xs font-black uppercase tracking-wider text-slate-800 dark:text-slate-100 outline-none focus:ring-2 focus:ring-primary-500/20 cursor-pointer shadow-xs">
              <option value="mcq" *ngIf="examType === 'standard'" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold py-2">Multiple Choice (MCQ)</option>
              <option value="fillups" *ngIf="examType === 'standard'" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold py-2">Fill in the Blanks (Fillups)</option>
              <option value="match" *ngIf="examType === 'standard'" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold py-2">Match the Following (Match It)</option>
              <option value="true_false" *ngIf="examType === 'standard'" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold py-2">True or False</option>
              <option value="descriptive" *ngIf="examType === 'standard'" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold py-2">Descriptive (Text)</option>
              <option value="either_or" *ngIf="examType === 'standard'" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold py-2">Either Or</option>
              <option value="task" *ngIf="examType === 'performance'" class="bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 font-bold py-2">Exam Task</option>
            </select>
            <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 pointer-events-none">▼</span>
          </div>
        </div>

        <!-- Question Text / Statement Textarea -->
        <textarea *ngIf="currentQuestion.question_type !== 'either_or'" [(ngModel)]="currentQuestion.question_text" rows="3"
                  class="w-full px-5 py-3.5 bg-white dark:bg-slate-900 border-none rounded-xl text-sm text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/10 transition-all font-medium min-h-[90px]"
                  [placeholder]="getQuestionPlaceholder()"></textarea>

        <!-- Either Or Input Builder -->
        <div *ngIf="currentQuestion.question_type === 'either_or'" class="space-y-3 pt-1">
          <!-- Input Question 1 (A) -->
          <div class="space-y-1.5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-black">A</span>
              <label class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Input Question 1</label>
            </div>
            <textarea [(ngModel)]="currentQuestion.question_a" rows="2"
                      placeholder="Enter Question 1 (Option A)..."
                      class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"></textarea>
          </div>

          <!-- Divider: (or) -->
          <div class="flex items-center justify-center gap-3">
            <div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
            <span class="px-4 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-full text-xs font-black uppercase tracking-widest">(or)</span>
            <div class="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
          </div>

          <!-- Input Question 2 (B) -->
          <div class="space-y-1.5 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-100 dark:border-slate-800/80 shadow-xs">
            <div class="flex items-center gap-2">
              <span class="w-6 h-6 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-xs font-black">B</span>
              <label class="text-xs font-black text-slate-700 dark:text-slate-200 uppercase tracking-wider">Input Question 2</label>
            </div>
            <textarea [(ngModel)]="currentQuestion.question_b" rows="2"
                      placeholder="Enter Question 2 (Option B)..."
                      class="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-primary-500/20"></textarea>
          </div>
        </div>
      </div>

      <!-- TYPE 1: MCQ Options Builder -->
      <div *ngIf="currentQuestion.question_type === 'mcq'" class="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div *ngFor="let opt of [0,1,2,3]; let i = index" 
             [class.ring-2]="currentQuestion.options[i]?.is_correct"
             class="relative group ring-emerald-500/50 transition-all rounded-xl">
          <input type="text" [(ngModel)]="currentQuestion.options[i].option_text"
                 class="w-full pl-5 pr-10 py-3 bg-white dark:bg-slate-900 border-none rounded-xl text-xs font-medium outline-none text-slate-800 dark:text-slate-100"
                 [placeholder]="'Option ' + (i+1)">
          
          <button type="button" (click)="setCorrect(i)" 
                  [class.bg-emerald-500]="currentQuestion.options[i]?.is_correct"
                  [class.text-white]="currentQuestion.options[i]?.is_correct"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-800 text-xs transition-all hover:scale-105 cursor-pointer">
             {{ currentQuestion.options[i]?.is_correct ? '✓' : '' }}
          </button>
        </div>
      </div>

      <!-- TYPE 2: Fill in the Blanks (Fillups) Builder -->
      <div *ngIf="currentQuestion.question_type === 'fillups'" class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
        <label class="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Correct Answer for Blank</label>
        <input type="text" [(ngModel)]="currentQuestion.correct_answer"
               placeholder="e.g. Paris, Hardware, 3.14..."
               class="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-800 dark:text-white outline-none">
      </div>

      <!-- TYPE 3: Match the Following (Match It) Builder -->
      <div *ngIf="currentQuestion.question_type === 'match'" class="space-y-2">
        <label class="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-wider">Match Pairs (Column A ➔ Column B)</label>
        <div *ngFor="let pair of currentQuestion.match_pairs; let i = index" class="grid grid-cols-2 gap-2">
          <input type="text" [(ngModel)]="pair.left" [placeholder]="'Item A' + (i+1)" class="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white outline-none">
          <input type="text" [(ngModel)]="pair.right" [placeholder]="'Matches B' + (i+1)" class="px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-medium text-slate-800 dark:text-white outline-none">
        </div>
      </div>

      <!-- TYPE 4: True or False Builder -->
      <div *ngIf="currentQuestion.question_type === 'true_false'" class="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <span class="text-xs font-black text-slate-400 uppercase tracking-wider">Correct Statement Answer:</span>
        <div class="flex items-center gap-3">
          <button type="button" (click)="currentQuestion.correct_answer = 'True'"
                  [class.bg-emerald-600]="currentQuestion.correct_answer === 'True'"
                  [class.text-white]="currentQuestion.correct_answer === 'True'"
                  [class.bg-slate-100]="currentQuestion.correct_answer !== 'True'"
                  [class.dark:bg-slate-800]="currentQuestion.correct_answer !== 'True'"
                  class="px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer">
            <span>✓</span> True
          </button>
          <button type="button" (click)="currentQuestion.correct_answer = 'False'"
                  [class.bg-rose-600]="currentQuestion.correct_answer === 'False'"
                  [class.text-white]="currentQuestion.correct_answer === 'False'"
                  [class.bg-slate-100]="currentQuestion.correct_answer !== 'False'"
                  [class.dark:bg-slate-800]="currentQuestion.correct_answer !== 'False'"
                  class="px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer">
            <span>✕</span> False
          </button>
        </div>
      </div>

      <!-- TYPE 5: Descriptive (Text) Builder (No Evaluation Key required) -->

      <!-- Bottom Action Row (Marks & Submit) -->
      <div class="flex items-center justify-between pt-1">
        <div class="flex items-center gap-2 bg-white dark:bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-800">
          <label class="text-[11px] font-black text-slate-400 uppercase tracking-wider">Marks:</label>
          <input type="number" [(ngModel)]="currentQuestion.marks"
                 class="w-16 bg-transparent text-sm font-black text-slate-800 dark:text-white outline-none text-center">
        </div>
        <div class="flex items-center gap-2">
            <button *ngIf="editIndex !== null" (click)="cancelEdit()"
                    class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-extrabold text-xs uppercase tracking-wider rounded-xl hover:bg-slate-300 dark:hover:bg-slate-600 transition-all cursor-pointer">
              Cancel
            </button>
            <button (click)="onAdd()"
                    [class.bg-emerald-500]="editIndex === null"
                    [class.bg-primary-500]="editIndex !== null"
                    class="px-6 py-2 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl hover:opacity-90 shadow-md transition-all active:scale-95 cursor-pointer">
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
      question_a: '',
      question_b: '',
      marks: 1,
      correct_answer: 'True',
      options: [
        { option_text: '', is_correct: 0 },
        { option_text: '', is_correct: 0 },
        { option_text: '', is_correct: 0 },
        { option_text: '', is_correct: 0 }
      ],
      match_pairs: [
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' },
        { left: '', right: '' }
      ]
    };
  }

  onTypeChange() {
    if (this.currentQuestion.question_type === 'true_false' && !this.currentQuestion.correct_answer) {
      this.currentQuestion.correct_answer = 'True';
    }
  }

  getQuestionPlaceholder(): string {
    switch (this.currentQuestion.question_type) {
      case 'fillups': return 'Enter question statement with blank (e.g., The capital of France is ____)...';
      case 'match': return 'Enter matching instructions (e.g., Match the terms in Column A with Column B)...';
      case 'true_false': return 'Enter statement to evaluate as True or False...';
      case 'descriptive':
      case 'text': return 'Enter detailed problem statement or essay prompt...';
      case 'task': return 'Enter exam task description...';
      default: return 'Enter your question here...';
    }
  }

  setCorrect(index: number) {
    this.currentQuestion.options.forEach((o: any, i: number) => {
      o.is_correct = (i === index ? 1 : 0);
    });
  }

  editQuestion(index: number, question: any) {
    this.editIndex = index;
    this.currentQuestion = JSON.parse(JSON.stringify(question));
    if (this.currentQuestion.question_type === 'either_or') {
      if (!this.currentQuestion.question_a && !this.currentQuestion.question_b) {
        if (this.currentQuestion.options && this.currentQuestion.options.length >= 2) {
          this.currentQuestion.question_a = this.currentQuestion.options[0]?.option_text || '';
          this.currentQuestion.question_b = this.currentQuestion.options[1]?.option_text || '';
        } else if (this.currentQuestion.question_text) {
          const parts = this.currentQuestion.question_text.split(/\n?\(or\)\n?/i);
          if (parts.length >= 2) {
            this.currentQuestion.question_a = parts[0].replace(/^[Aa][\.\)]\s*/, '').trim();
            this.currentQuestion.question_b = parts[1].replace(/^[Bb][\.\)]\s*/, '').trim();
          } else {
            this.currentQuestion.question_a = this.currentQuestion.question_text;
          }
        }
      }
    }
    // Ensure 4 options for MCQ
    if (this.currentQuestion.question_type === 'mcq' && (!this.currentQuestion.options || this.currentQuestion.options.length < 4)) {
      if (!this.currentQuestion.options) this.currentQuestion.options = [];
      while (this.currentQuestion.options.length < 4) {
        this.currentQuestion.options.push({ option_text: '', is_correct: 0 });
      }
    }
    // Ensure 4 match pairs
    if (this.currentQuestion.question_type === 'match' && (!this.currentQuestion.match_pairs || this.currentQuestion.match_pairs.length < 4)) {
      if (!this.currentQuestion.match_pairs) this.currentQuestion.match_pairs = [];
      while (this.currentQuestion.match_pairs.length < 4) {
        this.currentQuestion.match_pairs.push({ left: '', right: '' });
      }
    }
  }

  cancelEdit() {
    this.editIndex = null;
    this.currentQuestion = this.resetQuestion();
  }

  onAdd() {
    if (this.currentQuestion.question_type === 'either_or') {
      const qA = this.currentQuestion.question_a ? this.currentQuestion.question_a.trim() : '';
      const qB = this.currentQuestion.question_b ? this.currentQuestion.question_b.trim() : '';
      if (!qA && !qB) return;
      this.currentQuestion.question_a = qA;
      this.currentQuestion.question_b = qB;
      this.currentQuestion.question_text = `A. ${qA}\n(or)\nB. ${qB}`;
      this.currentQuestion.options = [
        { option_text: qA, is_correct: 0 },
        { option_text: qB, is_correct: 0 }
      ];
    } else {
      if (!this.currentQuestion.question_text) return;
    }

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
