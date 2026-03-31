import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-exam-timer',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="flex items-center gap-3 bg-slate-900 rounded-2xl px-6 py-3 border border-slate-800 shadow-xl">
      <div class="w-10 h-10 rounded-full bg-primary-500/20 flex items-center justify-center text-primary-400 animate-pulse">
        ⏱️
      </div>
      <div>
        <p class="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Time Remaining</p>
        <p class="text-xl font-black font-mono text-white tracking-wider tabular-nums leading-none" [class.text-rose-500]="isWarning">
          {{ formattedTime }}
        </p>
      </div>
    </div>
  `
})
export class ExamTimerComponent implements OnInit, OnDestroy {
    @Input() durationMinutes: number = 0;
    @Output() onTimeUp = new EventEmitter<void>();
    @Output() onTick = new EventEmitter<number>();

    remainingSeconds: number = 0;
    private timer: any;

    ngOnInit() {
        this.remainingSeconds = this.durationMinutes * 60;
        this.startTimer();
    }

    ngOnDestroy() {
        if (this.timer) clearInterval(this.timer);
    }

    startTimer() {
        this.timer = setInterval(() => {
            if (this.remainingSeconds > 0) {
                this.remainingSeconds--;
                this.onTick.emit(this.remainingSeconds);
            } else {
                clearInterval(this.timer);
                this.onTimeUp.emit();
            }
        }, 1000);
    }

    get formattedTime(): string {
        const mins = Math.floor(this.remainingSeconds / 60);
        const secs = this.remainingSeconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    get isWarning(): boolean {
        return this.remainingSeconds < 300; // Less than 5 mins
    }
}
