import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity" (click)="!isSubmitting && close()"></div>
      
      <!-- Modal Content -->
      <div [class]="getModalSizeClass()" 
           class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[94vh] border border-transparent dark:border-slate-800">
        
        <!-- Header -->
        <div class="px-6 py-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
          <h3 class="font-bold text-slate-800 dark:text-white text-lg">{{ title }}</h3>
          <div class="flex items-center gap-2">
            <ng-content select="[modal-header-actions]"></ng-content>
            <button (click)="close()" [disabled]="isSubmitting" class="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
              ✕
            </button>
          </div>
        </div>
        
        <!-- Body (Scrollable if overflowing) -->
        <div class="p-4 sm:p-5 overflow-y-auto flex-1 dark:text-slate-300 custom-scrollbar">
          <ng-content></ng-content>
        </div>
        
        <!-- Footer -->
        <div *ngIf="showFooter" class="px-6 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 z-10">
          <button (click)="close()" [disabled]="isSubmitting" class="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            Cancel
          </button>
          <button (click)="submit()" [disabled]="isSubmitting" class="px-6 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-none transition-all cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed flex items-center gap-2">
            <svg *ngIf="isSubmitting" class="animate-spin -ml-1 h-4 w-4 text-white inline-block" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span>{{ actionLabel }}</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ModalComponent {
  @Input() isOpen: boolean = false;
  @Input() title: string = 'Modal Title';
  @Input() actionLabel: string = 'Save Changes';
  @Input() showFooter: boolean = true;
  @Input() isSubmitting: boolean = false;
  @Input() size: string = 'lg';

  @Output() onClose = new EventEmitter<void>();
  @Output() onSubmit = new EventEmitter<void>();

  getModalSizeClass() {
    switch (this.size) {
      case 'sm': return 'max-w-sm';
      case 'md': return 'max-w-md';
      case 'lg': return 'max-w-lg';
      case 'xl': return 'max-w-xl';
      case '2xl': return 'max-w-2xl';
      case '3xl': return 'max-w-3xl';
      case '4xl': return 'max-w-4xl';
      case '5xl': return 'max-w-5xl';
      case '6xl': return 'max-w-6xl';
      case '7xl': return 'max-w-7xl';
      case 'large': return 'max-w-5xl';
      case 'xlarge': return 'max-w-6xl';
      case '2xlarge': return 'max-w-7xl';
      case 'huge': return 'max-w-[95vw] lg:max-w-[1600px] h-[88vh]';
      default: return this.size?.startsWith('max-w-') ? this.size : 'max-w-lg';
    }
  }

  close() {
    if (this.isSubmitting) return;
    this.onClose.emit();
  }

  submit() {
    if (this.isSubmitting) return;
    this.onSubmit.emit();
  }
}
