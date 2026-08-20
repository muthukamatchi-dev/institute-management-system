import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../models';
import { TenantService } from './tenant.service';

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
        private tenantService: TenantService
    ) {
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUserSubject.next(JSON.parse(savedUser));
        }

        // Auto Login if no user is saved
        if (!savedUser) {
            this.checkAutoLogin();
        }
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
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    const jwtToken = (user as any).jwt_token;
                    localStorage.setItem('token', jwtToken || user.token);
                    // Store tenant info from response
                    localStorage.setItem('tenantId', user.tenant_code || 'SYSTEM');
                    if (user.subdomain) {
                        localStorage.setItem('tenantSubdomain', user.subdomain);
                    }
                    this.currentUserSubject.next(user);
                }
            })
        );
    }

    logout() {
        // Call backend logout first
        this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe();

        localStorage.removeItem('currentUser');
        localStorage.removeItem('token');
        localStorage.removeItem('tenantId');
        localStorage.removeItem('tenantSubdomain');
        this.currentUserSubject.next(null);

        this.router.navigate(['/login']);
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }

    isLoggedIn(): boolean {
        return !!this.getToken();
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
