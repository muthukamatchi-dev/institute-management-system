import { inject } from '@angular/core';
import { CanActivateFn, CanActivateChildFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Auth Guard
 * Protects authenticated routes.
 * If user is not logged in or session is expired for the day, redirects to /login.
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true;
  }

  // Not logged in or session expired: redirect to login page
  const returnUrl = state.url && state.url !== '/' && state.url !== '/dashboard' ? state.url : undefined;
  return router.createUrlTree(['/login'], returnUrl ? { queryParams: { returnUrl } } : {});
};

export const authChildGuard: CanActivateChildFn = (childRoute, state) => {
  return authGuard(childRoute, state);
};

/**
 * Guest Guard
 * Prevents authenticated users with a valid active session from navigating to /login.
 * Redirects them directly to /dashboard or their respective landing page.
 */
export const guestGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return true;
  }

  const user = authService.currentUserValue;
  const role = (user?.role_name || user?.role || '').trim().toLowerCase();

  if (role === 'super admin' || role === 'super_admin') {
    return router.createUrlTree(['/super-admin']);
  } else if (role === 'student') {
    return router.createUrlTree(['/my-progress']);
  } else if (role === 'staff') {
    return router.createUrlTree(['/staff/my-attendance']);
  }

  return router.createUrlTree(['/dashboard']);
};
