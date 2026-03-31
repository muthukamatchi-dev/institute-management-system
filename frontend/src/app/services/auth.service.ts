import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { User } from '../models';

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private apiUrl = 'http://localhost:8081/api';
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {
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
                    const { username, password, tenantId } = config.autoLogin;
                    localStorage.setItem('tenantId', tenantId || 'default');
                    this.login(username, password).subscribe();
                }
            })
            .catch(err => console.log('Auto-login skip', err));
    }

    login(username: string, password: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/login`, { username, password }).pipe(
            tap(res => {
                if (res.status === 'success') {
                    const user = res.user;
                    localStorage.setItem('currentUser', JSON.stringify(user));
                    localStorage.setItem('token', user.token);
                    // Ensure tenantId persists
                    if (!localStorage.getItem('tenantId')) {
                        localStorage.setItem('tenantId', 'default');
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
        localStorage.removeItem('tenantId'); // Also clear tenant on logout
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
