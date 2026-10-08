import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../models';
import { TenantService } from './tenant.service';
import { PlanService } from './plan.service';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8081/api';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser = this.currentUserSubject.asObservable();
    public get currentUserValue(): User | null {
        return this.currentUserSubject.value;
    }

    constructor(
        private http: HttpClient,
        private router: Router,
        private tenantService: TenantService,
        private planService: PlanService
    ) {
        // A browser session is required to remain logged in.
        // When the user starts the system / opens the browser fresh, sessionStorage is empty,
        // so we clear any stale localStorage data and force the login page.
        const hasActiveSession = sessionStorage.getItem('active_session') === 'true';

        if (hasActiveSession && this.isSessionValidToday()) {
            const savedUser = localStorage.getItem('currentUser');
            if (savedUser) {
                try {
                    this.currentUserSubject.next(JSON.parse(savedUser));
                } catch {
                    this.clearSession();
                }
            }
        } else {
            // New day, fresh browser start, or expired session: clear and require login
            this.clearSession();
        }

        // Auto Login if configured (default disabled)
        if (!this.currentUserSubject.value) {
            this.checkAutoLogin();
        }
    }

    public isTokenExpired(token: string | null): boolean {
        if (!token) return true;
        try {
            const parts = token.split('.');
            if (parts.length !== 3) {
                return false;
            }
            let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
            while (base64.length % 4) {
                base64 += '=';
            }
            const payload = JSON.parse(decodeURIComponent(escape(atob(base64))));
            if (!payload.exp) {
                return false;
            }
            return (payload.exp * 1000) <= Date.now();
        } catch {
            return true;
        }
    }

    public isSessionValidToday(): boolean {
        const token = localStorage.getItem('token');
        const user = localStorage.getItem('currentUser');
        if (!token || !user) return false;

        const loginDate = localStorage.getItem('loginDate');
        if (!loginDate) return false;

        const today = new Date().toLocaleDateString('en-CA');
        if (loginDate !== today) {
            return false;
        }

        if (this.isTokenExpired(token)) {
            return false;
        }

        return true;
    }

    public clearSession() {
        sessionStorage.removeItem('active_session');
        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('loginDate');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantSubdomain');
        localStorage.removeItem('selectedBranchId');
        this.planService.clearPlan();
        this.currentUserSubject.next(null);
    }

    private checkAutoLogin() {
        // Fetch config.json from public directory
        fetch('config.json')
            .then(res => res.json())
            .then(config => {
                if (config.autoLogin?.enabled) {
                    const { username, password } = config.autoLogin;
                    this.login(username, password).subscribe();
                }
            })
            .catch(err => console.log('Auto-login skip', err));
    }

    /**
     * Login — no tenant code needed.
     * Tenant is resolved by the backend from the subdomain in the Host header.
     */
    login(username: string, password: string): Observable<any> {
        const payload: any = { username, password };

        return this.http.post<any>(`${this.apiUrl}/auth/login`, payload).pipe(
            tap(res => {
                if (res.status === 'success') {
                    const user = res.user;
                    // Mark current browser session active
                    sessionStorage.setItem('active_session', 'true');
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    const jwtToken = (user as any).jwt_token;
                    localStorage.setItem('token', jwtToken || user.token);
                    // Store today's date so session expires when starting system the next day
                    const today = new Date().toLocaleDateString('en-CA');
                    localStorage.setItem('loginDate', today);
                    // Store tenant info from response
                    localStorage.setItem('tenantId', user.tenant_code || 'SYSTEM');
                    if (user.subdomain) {
                        localStorage.setItem('tenantSubdomain', user.subdomain);
                    }
                    // Store plan for feature gating
                    const plan = (user as any).plan || 'basic';
                    this.planService.setPlan(plan);
                    this.currentUserSubject.next(user);
                }
            })
        );
    }

    logout() {
        // Call backend logout first
        this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
            error: () => {}
        });

        this.clearSession();
        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        const hasActiveSession = sessionStorage.getItem('active_session') === 'true';
        return hasActiveSession && this.isSessionValidToday() && !!this.currentUserSubject.value;
    }

    setTenantId(id: string) {
        localStorage.setItem('tenantId', id);
    }

    getTenantId(): string {
        return localStorage.getItem('tenantId') || 'default';
    }

    validateTenant(tenantCode: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/validate-tenant`, { tenant_code: tenantCode });
    }

    isSuperAdmin(): boolean {
        const user = this.currentUserSubject.value;
        if (!user) return false;
        const role = (user.role_name || user.role || '').trim().toLowerCase();
        return role === 'super admin' || role === 'super_admin';
    }

    changePassword(newPassword: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/change_password`, { new_password: newPassword });
    }

    updateProfile(data: { name: string, email: string }): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/update_profile`, data).pipe(
            tap(res => {
                if (res.status === 'success') {
                    const currentUser = this.currentUserSubject.value;
                    if (currentUser) {
                        const newUser = { ...currentUser, name: data.name, email: data.email };
                        this.currentUserSubject.next(newUser);
                        localStorage.setItem('currentUser', JSON.stringify(newUser));
                    }
                }
            })
        );
    }
}
