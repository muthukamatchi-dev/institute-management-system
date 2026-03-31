import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { DataService } from './services/data.service';
import { ThemeService } from './services/theme.service';
import { AuthService } from './services/auth.service';
import { ToastComponent } from './shared/ui/toast.component';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, ToastComponent],
    template: `
        <div style="background: #2563eb; color: white; padding: 4px 12px; font-size: 10px; position: fixed; top: 0; left: 0; z-index: 99999; border-bottom-right-radius: 8px;">
            CMS PRO ACTIVE
        </div>
        <app-toast></app-toast>
        <router-outlet></router-outlet>
    `,
    styles: []
})
export class AppComponent implements OnInit {
    title = 'institute-demo';

    constructor(
        private dataService: DataService,
        private themeService: ThemeService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.authService.currentUser.subscribe(user => {
            if (user) {
                this.dataService.getSettings().subscribe({
                    next: s => {
                        if (s) this.themeService.applySettings(s);
                    },
                    error: () => {
                        // Silently ignore settings fetch errors on app init
                        // The auth interceptor will handle 401/403 by redirecting to login if needed
                    }
                });
            }
        });
    }
}
