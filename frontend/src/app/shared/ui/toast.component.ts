import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, Toast } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-8 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-4 pointer-events-none w-full max-w-2xl px-6">
      <div *ngFor="let toast of toasts"
           class="pointer-events-auto group relative w-full overflow-hidden flex items-start p-0 rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] border backdrop-blur-md transition-all duration-500 animate-in slide-in-from-top-12 fade-in"
           [ngClass]="getToastStyles(toast.type)">
        
        <!-- Lumina Vertical Accent Stripe -->
        <div class="w-2 self-stretch shrink-0" [ngClass]="getAccentStyles(toast.type)"></div>

        <!-- Content Area -->
        <div class="flex-1 py-4 pl-5">
           <div class="flex items-center gap-3 mb-1">
              <!-- Icon -->
              <span class="text-lg leading-none" [ngClass]="getTextStyles(toast.type)">
                {{ getIcon(toast.type) }}
              </span>
              <!-- Title -->
              <h4 class="text-sm font-bold tracking-tight" [ngClass]="getTextStyles(toast.type)">
                {{ getTitle(toast) }}
              </h4>
           </div>
           <!-- Message -->
           <p class="text-[13px] opacity-80 leading-relaxed max-w-[90%]" [ngClass]="getTextStyles(toast.type)">
             {{ toast.message }}
           </p>
        </div>

        <!-- Close Action -->
        <button (click)="remove(toast.id)" 
                class="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-all opacity-40 group-hover:opacity-100">
           <span class="text-xs font-bold" [ngClass]="getTextStyles(toast.type)">✕</span>
        </button>

        <!-- Elegant Timer Line (Bottom) -->
        <div class="absolute bottom-0 left-2 right-0 h-[2px] bg-black/5 dark:bg-white/5">
          <div class="h-full transition-all linear origin-left"
               [ngClass]="getAccentStyles(toast.type)"
               [style.animation]="'toast-progress ' + (toast.duration || 4000) + 'ms linear forwards'">
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes toast-progress {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
    .animate-in {
      animation: enter 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }
    @keyframes enter {
      from { transform: translateY(-30px); opacity: 0; filter: blur(5px); }
      to { transform: translateY(0); opacity: 1; filter: blur(0); }
    }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private sub: Subscription | null = null;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.sub = this.toastService.toasts$.subscribe(toasts => {
      this.toasts = toasts;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  remove(id: number) {
    this.toastService.remove(id);
  }

  getIcon(type: Toast['type']) {
    switch (type) {
      case 'success': return '✓';
      case 'error': return '⚠';
      case 'warning': return '⚠';
      case 'info': return 'ℹ';
    }
  }

  getTitle(toast: Toast) {
    if (toast.type === 'success') return 'Action Successful';
    if (toast.type === 'error') return 'System Alert';
    if (toast.type === 'warning') return 'Notice';
    return 'Information';
  }

  getToastStyles(type: Toast['type']) {
    switch (type) {
      case 'success': return 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500/10';
      case 'error': return 'bg-rose-50 dark:bg-rose-950/40 border-rose-500/10';
      case 'warning': return 'bg-amber-50 dark:bg-amber-950/40 border-amber-500/10';
      case 'info': return 'bg-blue-50 dark:bg-blue-950/40 border-blue-500/10';
    }
  }

  getAccentStyles(type: Toast['type']) {
    switch (type) {
      case 'success': return 'bg-emerald-500';
      case 'error': return 'bg-rose-500';
      case 'warning': return 'bg-amber-500';
      case 'info': return 'bg-blue-500';
    }
  }

  getTextStyles(type: Toast['type']) {
    switch (type) {
      case 'success': return 'text-emerald-900 dark:text-emerald-200';
      case 'error': return 'text-rose-900 dark:text-rose-200';
      case 'warning': return 'text-amber-900 dark:text-amber-200';
      case 'info': return 'text-blue-900 dark:text-blue-200';
    }
  }
}
