import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-branding-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex items-center gap-8 p-10 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 mb-8 rounded-[2rem] shadow-sm">
        <div *ngIf="settings?.logo_path" class="flex-shrink-0">
            <img [src]="'http://localhost:8081/' + settings.logo_path" 
                 class="w-24 h-24 object-contain rounded-2xl shadow-md border border-slate-50 dark:border-slate-800">
        </div>
        
        <div class="flex-1 text-left space-y-2">
            <h1 class="text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-none mb-2">
                {{ settings?.institute_name || 'Institute Name' }}
            </h1>
            
            <div class="flex flex-col gap-1 text-sm font-bold text-slate-500 dark:text-slate-400">
                <p *ngIf="settings?.address" class="flex items-center gap-2">
                    <span class="text-primary-500">📍</span> {{ settings.address }}
                </p>
                <div class="flex flex-wrap gap-x-6 gap-y-1">
                    <span *ngIf="settings?.email" class="flex items-center gap-2">
                        <span class="text-primary-500">✉️</span> {{ settings.email }}
                    </span>
                    <span *ngIf="settings?.phone" class="flex items-center gap-2">
                        <span class="text-primary-500">📞</span> {{ settings.phone }}
                    </span>
                </div>
            </div>
            
            <div *ngIf="title" class="inline-block mt-4 px-5 py-1.5 bg-primary-600 text-white text-[10px] font-black uppercase tracking-[0.2em] rounded-full shadow-lg shadow-primary-500/20">
                {{ title }}
            </div>
        </div>
    </div>
  `
})
export class BrandingHeaderComponent {
  @Input() settings: any;
  @Input() title: string = '';
}
