import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-branding-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex flex-col items-center text-center space-y-3 p-6 sm:p-8 bg-slate-50/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800 mb-6 rounded-3xl shadow-xs">
        <div *ngIf="settings?.logo_path" class="shrink-0 mb-1">
            <img [src]="getImageUrl(settings.logo_path)" 
                 class="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-2xl shadow-sm mx-auto border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 p-1">
        </div>
        
        <div class="space-y-2 max-w-3xl">
            <h1 class="text-2xl sm:text-3xl font-academic font-bold text-slate-900 dark:text-white tracking-widest uppercase leading-tight">
                {{ settings?.institute_name || settings?.name || 'Institute Name' }}
            </h1>
            
            <div class="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs font-semibold text-slate-600 dark:text-slate-400 font-paper-sans">
                <span *ngIf="settings?.address">{{ settings.address }}</span>
                <span *ngIf="settings?.address && (settings?.email || settings?.phone)" class="text-slate-300 dark:text-slate-600 font-bold">•</span>
                <span *ngIf="settings?.email">Email: {{ settings.email }}</span>
                <span *ngIf="settings?.email && settings?.phone" class="text-slate-300 dark:text-slate-600 font-bold">•</span>
                <span *ngIf="settings?.phone">Ph: {{ settings.phone }}</span>
            </div>
            
            <div *ngIf="title" class="inline-block mt-3 px-5 py-1 bg-primary-600 text-white text-[11px] font-bold uppercase tracking-[0.25em] rounded-full shadow-sm font-paper-sans">
                {{ title }}
            </div>
        </div>
    </div>
  `
})
export class BrandingHeaderComponent {
  @Input() settings: any;
  @Input() title: string = '';

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `http://localhost:8081/${normalizedPath}`;
  }
}
