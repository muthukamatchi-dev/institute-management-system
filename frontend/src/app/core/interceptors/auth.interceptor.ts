import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const token = authService.getToken();
    const tenantId = localStorage.getItem('tenantId') || 'default';
    const branchId = localStorage.getItem('selectedBranchId') || 'all';

    let headers: { [name: string]: string } = {
        'X-Tenant-ID': tenantId,
        'X-Branch-ID': branchId
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    req = req.clone({
        setHeaders: headers
    });

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Avoid infinite loop if logout request itself returns 401
            // Also avoid redirecting if we are on a public page (like public exam portal)
            const isPublicRoute = window.location.hash.includes('/public/') || window.location.pathname.includes('/public/');
            const isAuthRequest = req.url.includes('/login') || req.url.includes('/logout');
            if ((error.status === 401 || error.status === 403) && !isAuthRequest && !isPublicRoute) {
                authService.logout();
            }
            return throwError(() => error);
        })
    );
};
