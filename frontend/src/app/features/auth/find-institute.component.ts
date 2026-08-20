import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantService } from '../../services/tenant.service';

interface InstituteResult {
    name: string;
    subdomain: string;
}

@Component({
    selector: 'app-find-institute',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 sm:p-8 selection:bg-primary-500/30 overflow-hidden relative">
        <!-- Background -->
        <div class="absolute inset-0 pointer-events-none">
            <div class="absolute top-1/3 -left-20 w-80 h-80 bg-primary-600/15 rounded-full blur-[120px] animate-float-3d"></div>
            <div class="absolute bottom-1/3 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[140px] animate-float-3d-slow"></div>
        </div>

        <div class="w-full max-w-[500px] relative z-10 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            <!-- Logo -->
            <div class="text-center mb-8">
                <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-700 rounded-full text-white text-3xl shadow-[0_0_40px_rgba(var(--color-primary-500),0.3)] mb-4 transform transition-all duration-700 hover:scale-110 active:scale-95 cursor-default">
                    <span class="font-black drop-shadow-lg">C</span>
                </div>
                <h1 class="text-3xl sm:text-4xl font-black tracking-tight bg-gradient-to-b from-white to-slate-400 bg-clip-text text-transparent mb-2">
                    Find Your Institute
                </h1>
                <p class="text-slate-500 text-sm font-medium">Search for your institute to access your account</p>
            </div>

            <!-- Search Card -->
            <div class="bg-slate-900/80 backdrop-blur-xl rounded-[2rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.8)] border border-white/5 p-8 sm:p-10 w-full ring-1 ring-white/10">
                <!-- Search Input -->
                <div class="relative group mb-6">
                    <span class="absolute left-5 top-1/2 -translate-y-1/2 text-lg opacity-40 group-focus-within:opacity-100 transition-all">🔍</span>
                    <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="onSearch()" id="find-institute-search"
                        class="w-full pl-14 pr-6 py-4 bg-slate-800/50 rounded-2xl text-[15px] font-bold text-white placeholder-slate-500 focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500/30 transition-all outline-none border-2 border-slate-700/50 focus:bg-slate-800"
                        placeholder="Search by institute name..." autofocus>
                </div>

                <!-- Loading -->
                <div *ngIf="searching" class="text-center py-6">
                    <div class="inline-flex items-center gap-2 text-slate-400 text-sm font-medium">
                        <span class="w-2 h-2 bg-primary-500 rounded-full animate-ping"></span>
                        Searching...
                    </div>
                </div>

                <!-- Results -->
                <div *ngIf="!searching && results.length > 0" class="space-y-3">
                    <p class="text-slate-500 text-[10px] font-bold uppercase tracking-widest mb-3">{{ results.length }} Institute(s) Found</p>
                    <a *ngFor="let institute of results" (click)="goToInstitute(institute)" 
                        class="flex items-center gap-4 p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 hover:border-primary-500/30 hover:bg-slate-800 transition-all cursor-pointer group">
                        <div class="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-primary-500/20 to-primary-600/20 rounded-xl flex items-center justify-center text-lg group-hover:from-primary-500/30 group-hover:to-primary-600/30 transition-all">
                            🏫
                        </div>
                        <div class="flex-1 min-w-0">
                            <p class="text-white font-bold text-sm truncate">{{ institute.name }}</p>
                            <p class="text-slate-500 text-[11px] font-medium">{{ institute.subdomain }}.classivo.app</p>
                        </div>
                        <div class="flex-shrink-0 text-primary-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            →
                        </div>
                    </a>
                </div>

                <!-- No Results -->
                <div *ngIf="!searching && searched && results.length === 0" class="text-center py-8">
                    <p class="text-slate-500 text-4xl mb-3">🔍</p>
                    <p class="text-slate-400 text-sm font-bold">No institutes found</p>
                    <p class="text-slate-600 text-xs mt-1">Try a different search term</p>
                </div>

                <!-- Help text -->
                <div *ngIf="!searching && !searched" class="text-center py-6">
                    <p class="text-slate-600 text-xs font-medium">Type at least 2 characters to search</p>
                </div>
            </div>

            <!-- Back to Login -->
            <div class="text-center mt-6">
                <button (click)="goToLogin()"
                    class="text-slate-500 text-[11px] font-bold hover:text-slate-300 transition-colors uppercase tracking-wider">
                    ← Back to Login
                </button>
            </div>

            <!-- Footer -->
            <div class="mt-10 text-center text-slate-800">
                <p class="text-[9px] font-bold uppercase tracking-[0.4em]">© 2024 Classivo. All rights reserved.</p>
            </div>
        </div>
    </div>
    `
})
export class FindInstituteComponent {
    searchQuery = '';
    results: InstituteResult[] = [];
    searching = false;
    searched = false;
    private searchTimeout: any = null;

    constructor(
        private tenantService: TenantService,
        private router: Router
    ) { }

    onSearch() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }

        const query = this.searchQuery.trim();
        if (query.length < 2) {
            this.results = [];
            this.searched = false;
            return;
        }

        this.searching = true;
        this.searchTimeout = setTimeout(() => {
            this.tenantService.searchInstitutes(query).subscribe({
                next: (res) => {
                    this.searching = false;
                    this.searched = true;
                    this.results = (res?.data || []) as InstituteResult[];
                },
                error: () => {
                    this.searching = false;
                    this.searched = true;
                    this.results = [];
                }
            });
        }, 400);
    }

    goToInstitute(institute: InstituteResult) {
        const url = this.tenantService.getTenantUrl(institute.subdomain);
        window.location.href = url;
    }

    goToLogin() {
        this.router.navigate(['/login']);
    }
}
