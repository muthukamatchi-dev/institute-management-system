import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <span [class]="getClasses()">
      {{ label }}
    </span>
  `
})
export class BadgeComponent {
  @Input() label: string = '';
  @Input() type: 'success' | 'warning' | 'danger' | 'info' | 'neutral' = 'neutral';

  getClasses() {
    const base = 'px-2.5 py-0.5 rounded-full text-xs font-semibold inline-flex items-center';
    const types = {
      success: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400',
      warning: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
      danger: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400',
      info: 'bg-sky-100 dark:bg-sky-900/30 text-sky-700 dark:text-sky-400',
      neutral: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-400'
    };
    return `${base} ${types[this.type]}`;
  }
}
