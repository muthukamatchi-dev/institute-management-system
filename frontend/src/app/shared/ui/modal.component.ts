import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <!-- Backdrop -->
      <div class="absolute inset-0 bg-slate-900/40 dark:bg-slate-950/60 backdrop-blur-sm transition-opacity" (click)="close()"></div>
      
      <!-- Modal Content -->
      <div [class]="getModalSizeClass()" 
           class="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl relative w-full overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh] border border-transparent dark:border-slate-800">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 z-10">
          <h3 class="font-bold text-slate-800 dark:text-white text-lg">{{ title }}</h3>
          <button (click)="close()" class="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors">
            ✕
          </button>
        </div>
        
        <!-- Body (Scrollable) -->
        <div class="p-6 overflow-y-auto flex-1 dark:text-slate-300">
          <ng-content></ng-content>
        </div>
        
        <!-- Footer -->
        <div *ngIf="showFooter" class="px-6 py-4 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800/50 z-10">
          <button (click)="close()" class="px-4 py-2 text-slate-600 dark:text-slate-400 font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all">
            Cancel
          </button>
          <button (click)="submit()" class="px-6 py-2 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 shadow-lg shadow-primary-200 dark:shadow-none transition-all">
            {{ actionLabel }}
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
  @Input() size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | 'large' | 'huge' = 'lg';

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
      case 'large': return 'max-w-5xl';
      case 'huge': return 'max-w-[95vw] lg:max-w-[1600px]';
      default: return 'max-w-lg';
    }
  }

  close() {
    this.onClose.emit();
  }

  submit() {
    this.onSubmit.emit();
  }
}
