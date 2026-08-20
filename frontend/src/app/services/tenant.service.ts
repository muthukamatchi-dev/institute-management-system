import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface TenantInfo {
    is_main_domain: boolean;
    tenant_name?: string;
    subdomain?: string;
    status?: string;
    is_trial_active?: boolean;
    trial_end_date?: string;
    message?: string;
}

/**
 * TenantService — Subdomain-based tenant detection
 * 
 * Detects the current tenant from the browser URL hostname.
 * Examples:
 *   abcschool.classivo.app  → subdomain = "abcschool"
 *   abcschool.localhost     → subdomain = "abcschool"
 *   localhost               → main domain (no tenant)
 *   classivo.app            → main domain (no tenant)
 */
@Injectable({
    providedIn: 'root'
})
export class TenantService {
    private apiUrl = 'http://localhost:8081/api';

    private subdomainSubject = new BehaviorSubject<string | null>(null);
    public subdomain$ = this.subdomainSubject.asObservable();

    private tenantInfoSubject = new BehaviorSubject<TenantInfo | null>(null);
    public tenantInfo$ = this.tenantInfoSubject.asObservable();

    private _subdomain: string | null = null;
    private _isMainDomain: boolean = true;

    // Configure this to match your production domain
    private appDomain = 'localhost';

    constructor(private http: HttpClient) {
        this.detectSubdomain();
    }

    /**
     * Detect subdomain from the current browser URL.
     */
    private detectSubdomain(): void {
        const hostname = window.location.hostname;

        // Handle localhost-based dev (abcschool.localhost)
        if (hostname.endsWith('.localhost') || hostname.endsWith('.127.0.0.1')) {
            const sub = hostname.substring(0, hostname.lastIndexOf('.'));
            if (sub && sub !== 'www') {
                this._subdomain = sub.toLowerCase();
                this._isMainDomain = false;
            }
        }
        // Handle IP address — no subdomain
        else if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
            this._subdomain = null;
            this._isMainDomain = true;
        }
        // Handle bare localhost or bare app domain
        else if (hostname === 'localhost' || hostname === this.appDomain) {
            this._subdomain = null;
            this._isMainDomain = true;
        }
        // Handle subdomain.appDomain (e.g., abcschool.classivo.app)
        else if (hostname.endsWith('.' + this.appDomain)) {
            const sub = hostname.substring(0, hostname.length - this.appDomain.length - 1);
            if (sub && sub !== 'www') {
                this._subdomain = sub.toLowerCase();
                this._isMainDomain = false;
            }
        }
        // Generic: hostname has 3+ parts (e.g., abcschool.myapp.com)
        else {
            const parts = hostname.split('.');
            if (parts.length >= 3) {
                const candidate = parts[0];
                if (candidate !== 'www') {
                    this._subdomain = candidate.toLowerCase();
                    this._isMainDomain = false;
                }
            }
        }

        this.subdomainSubject.next(this._subdomain);
        console.log(`[TenantService] Hostname: ${hostname} | Subdomain: ${this._subdomain} | Main domain: ${this._isMainDomain}`);
    }

    /**
     * Get the detected subdomain (null if on main domain).
     */
    getSubdomain(): string | null {
        return this._subdomain;
    }

    /**
     * Is this the main domain (no subdomain)?
     */
    isMainDomain(): boolean {
        return this._isMainDomain;
    }

    /**
     * Get the API base URL dynamically based on the current hostname.
     * In production, the API is on the same domain. In dev, it's localhost:8081.
     */
    getApiUrl(): string {
        // In production, you'd return something like:
        // return `https://api.${this.appDomain}`;
        // For local dev:
        return this.apiUrl;
    }

    /**
     * Fetch tenant info (branding, name) from the backend.
     * The backend resolves the tenant from the Host header subdomain.
     */
    loadTenantInfo(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/auth/tenant-info`).pipe(
            tap(res => {
                if (res?.status === 'success' && res?.data) {
                    this.tenantInfoSubject.next(res.data);
                }
            }),
            catchError(err => {
                console.warn('[TenantService] Failed to load tenant info:', err);
                return of(null);
            })
        );
    }

    /**
     * Search for institutes (used on main domain "Find Your Institute" page).
     */
    searchInstitutes(query: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/auth/find-institute`, { query });
    }

    /**
     * Get the full URL for a tenant's subdomain.
     */
    getTenantUrl(subdomain: string): string {
        const protocol = window.location.protocol;
        const port = window.location.port;

        if (this.appDomain === 'localhost') {
            // Local dev: abcschool.localhost:4200
            const portPart = port ? `:${port}` : '';
            return `${protocol}//${subdomain}.localhost${portPart}`;
        }

        // Production: abcschool.classivo.app
        return `${protocol}//${subdomain}.${this.appDomain}`;
    }
}
