import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';
import { TenantService } from '../../services/tenant.service';

/**
 * Auth Interceptor — Subdomain-Aware
 * 
 * Sends the detected subdomain as X-Tenant-Subdomain header.
 * The backend uses the Host header for primary subdomain resolution,
 * but this header serves as a reliable fallback for API calls.
 */
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const tenantService = inject(TenantService);
    const token = authService.getToken();
    const branchId = localStorage.getItem('selectedBranchId') || 'all';
    const subdomain = tenantService.getSubdomain();

    let headers: { [name: string]: string } = {
        'X-Branch-ID': branchId
    };

    const isAuthEndpoint = req.url.includes('/login') || req.url.includes('/logout');

    // Send subdomain for tenant resolution whenever on a tenant subdomain (e.g., apple-academy.localhost)
    if (subdomain) {
        headers['X-Tenant-Subdomain'] = subdomain;
    }

    // Legacy support: also send X-Tenant-ID if available (from stored tenant_code) for non-auth requests
    const tenantId = localStorage.getItem('tenantId');
    if (tenantId && tenantId !== 'default' && !isAuthEndpoint) {
        headers['X-Tenant-ID'] = tenantId;
    }

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    req = req.clone({
        setHeaders: headers
    });

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Avoid infinite loop if logout request itself returns 401
            // Also avoid redirecting if we are on a public page
            const isPublicRoute = window.location.hash.includes('/public/') || window.location.pathname.includes('/public/');
            const isAuthRequest = req.url.includes('/login') || req.url.includes('/logout');
            const isFindInstitute = req.url.includes('/find-institute') || req.url.includes('/tenant-info');

            if ((error.status === 401 || error.status === 403) && !isAuthRequest && !isPublicRoute && !isFindInstitute) {
                authService.logout();
            }
            return throwError(() => error);
        })
    );
};
