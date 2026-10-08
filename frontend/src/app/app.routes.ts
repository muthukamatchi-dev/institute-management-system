import { Routes } from '@angular/router';
import { inject } from '@angular/core';
import { DeviceService } from './services/device.service';
import { authGuard, authChildGuard, guestGuard } from './core/guards/auth.guard';

/**
 * Device-aware route loader helper.
 * Dynamically resolves to either Desktop or Mobile standalone component depending on DeviceService.isMobile.
 */
function deviceRoute(
  desktopImport: () => Promise<any>,
  mobileImport: () => Promise<any>
) {
  return () => {
    const deviceService = inject(DeviceService);
    const isMobile = deviceService.isMobile;
    const loader = isMobile ? mobileImport : desktopImport;
    return loader().then(m => {
      // Find exported component class (either default or named export)
      const exportKeys = Object.keys(m);
      const componentKey = exportKeys.find(k => k.endsWith('Component')) || exportKeys[0];
      return m[componentKey];
    });
  };
}

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: deviceRoute(
      () => import('./features/auth/login.component'),
      () => import('./features/auth/login-mobile.component')
    )
  },
  {
    path: 'find-institute',
    loadComponent: deviceRoute(
      () => import('./features/auth/find-institute.component'),
      () => import('./features/auth/find-institute-mobile.component')
    )
  },
  {
    path: '',
    canActivate: [authGuard],
    canActivateChild: [authChildGuard],
    loadComponent: deviceRoute(
      () => import('./shared/components/layout.component'),
      () => import('./shared/components/layout-mobile.component')
    ),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: deviceRoute(
          () => import('./features/dashboard/dashboard.component'),
          () => import('./features/dashboard/dashboard-mobile.component')
        )
      },
      {
        path: 'enquiries',
        loadComponent: deviceRoute(
          () => import('./features/enquiries/enquiries.component'),
          () => import('./features/enquiries/enquiries-mobile.component')
        )
      },
      {
        path: 'day-book',
        loadComponent: deviceRoute(
          () => import('./features/day-book/day-book.component'),
          () => import('./features/day-book/day-book-mobile.component')
        )
      },
      {
        path: 'students',
        loadComponent: deviceRoute(
          () => import('./features/students/student-list.component'),
          () => import('./features/students/student-list-mobile.component')
        )
      },
      {
        path: 'courses',
        loadComponent: deviceRoute(
          () => import('./features/courses/course-list.component'),
          () => import('./features/courses/course-list-mobile.component')
        )
      },
      {
        path: 'programs',
        loadComponent: deviceRoute(
          () => import('./features/programs/program-list.component'),
          () => import('./features/programs/program-list-mobile.component')
        )
      },
      {
        path: 'programs/:id/builder',
        loadComponent: deviceRoute(
          () => import('./features/programs/program-builder.component'),
          () => import('./features/programs/program-builder-mobile.component')
        )
      },
      {
        path: 'batches',
        loadComponent: deviceRoute(
          () => import('./features/batches/batch-list.component'),
          () => import('./features/batches/batch-list-mobile.component')
        )
      },
      {
        path: 'staff',
        loadComponent: deviceRoute(
          () => import('./features/staff/staff-list.component'),
          () => import('./features/staff/staff-list-mobile.component')
        )
      },
      {
        path: 'fees',
        loadComponent: deviceRoute(
          () => import('./features/fees/fee-list.component'),
          () => import('./features/fees/fee-list-mobile.component')
        )
      },
      {
        path: 'attendance',
        loadComponent: deviceRoute(
          () => import('./features/attendance/attendance.component'),
          () => import('./features/attendance/attendance-mobile.component')
        )
      },
      {
        path: 'attendance/student-dashboard',
        loadComponent: deviceRoute(
          () => import('./features/attendance/attendance.component'),
          () => import('./features/attendance/attendance-mobile.component')
        )
      },
      {
        path: 'attendance/staff-dashboard',
        loadComponent: deviceRoute(
          () => import('./features/attendance/attendance.component'),
          () => import('./features/attendance/attendance-mobile.component')
        )
      },
      {
        path: 'attendance/file',
        loadComponent: deviceRoute(
          () => import('./features/attendance/attendance.component'),
          () => import('./features/attendance/attendance-mobile.component')
        )
      },
      {
        path: 'reports',
        loadComponent: deviceRoute(
          () => import('./features/reports/reports.component'),
          () => import('./features/reports/reports-mobile.component')
        )
      },
      {
        path: 'profile',
        loadComponent: deviceRoute(
          () => import('./features/profile/profile.component'),
          () => import('./features/profile/profile-mobile.component')
        )
      },
      {
        path: 'settings',
        loadComponent: deviceRoute(
          () => import('./features/settings/settings.component'),
          () => import('./features/settings/settings-mobile.component')
        )
      },
      {
        path: 'expenses',
        loadComponent: deviceRoute(
          () => import('./features/expenses/expenses.component'),
          () => import('./features/expenses/expenses-mobile.component')
        )
      },
      {
        path: 'study-material',
        loadComponent: deviceRoute(
          () => import('./features/study-material/study-material.component'),
          () => import('./features/study-material/study-material-mobile.component')
        )
      },
      {
        path: 'my-study-material',
        loadComponent: deviceRoute(
          () => import('./features/study-material/student-study-material.component'),
          () => import('./features/study-material/student-study-material-mobile.component')
        )
      },
      {
        path: 'exams/questions',
        loadComponent: deviceRoute(
          () => import('./features/exams/question-bank/question-bank.component'),
          () => import('./features/exams/question-bank/question-bank-mobile.component')
        )
      },
      {
        path: 'exams/internal',
        loadComponent: deviceRoute(
          () => import('./features/exams/internal/internal-exam.component'),
          () => import('./features/exams/internal/internal-exam-mobile.component')
        )
      },
      {
        path: 'exams/external',
        loadComponent: deviceRoute(
          () => import('./features/exams/external/external-exam.component'),
          () => import('./features/exams/external/external-exam-mobile.component')
        )
      },
      {
        path: 'exams/entries',
        loadComponent: deviceRoute(
          () => import('./features/exams/entries/exam-entries.component'),
          () => import('./features/exams/entries/exam-entries-mobile.component')
        )
      },
      {
        path: 'exams/external/results/:id',
        loadComponent: deviceRoute(
          () => import('./features/exams/external/external-results.component'),
          () => import('./features/exams/external/external-results-mobile.component')
        )
      },
      {
        path: 'my-exams',
        loadComponent: deviceRoute(
          () => import('./features/exams/student-exam.component'),
          () => import('./features/exams/student-exam-mobile.component')
        )
      },
      {
        path: 'my-progress',
        loadComponent: deviceRoute(
          () => import('./features/students/my-progress.component'),
          () => import('./features/students/my-progress-mobile.component')
        )
      },
      // Staff Routes
      {
        path: 'staff/my-attendance',
        loadComponent: deviceRoute(
          () => import('./features/staff/staff-my-attendance.component'),
          () => import('./features/staff/staff-my-attendance-mobile.component')
        )
      },
      {
        path: 'staff/schedule',
        loadComponent: deviceRoute(
          () => import('./features/staff/staff-schedule.component'),
          () => import('./features/staff/staff-schedule-mobile.component')
        )
      },
      {
        path: 'staff/students',
        loadComponent: deviceRoute(
          () => import('./features/staff/staff-students.component'),
          () => import('./features/staff/staff-students-mobile.component')
        )
      },
      {
        path: 'staff/courses',
        loadComponent: deviceRoute(
          () => import('./features/staff/staff-courses.component'),
          () => import('./features/staff/staff-courses-mobile.component')
        )
      },
      {
        path: 'staff/batches',
        loadComponent: deviceRoute(
          () => import('./features/staff/staff-batches.component'),
          () => import('./features/staff/staff-batches-mobile.component')
        )
      },
      {
        path: 'staff/attendance',
        loadComponent: deviceRoute(
          () => import('./features/staff/staff-attendance.component'),
          () => import('./features/staff/staff-attendance-mobile.component')
        )
      },
      // Super Admin
      {
        path: 'super-admin',
        loadComponent: deviceRoute(
          () => import('./features/super-admin/super-admin.component'),
          () => import('./features/super-admin/super-admin-mobile.component')
        )
      }
    ]
  },
  {
    path: 'internal/exam/:examId',
    loadComponent: deviceRoute(
      () => import('./features/exams/public-exam-portal.component'),
      () => import('./features/exams/public-exam-portal-mobile.component')
    ),
    data: { examAccess: 'internal' }
  },
  {
    path: 'public/exam/:examId',
    loadComponent: deviceRoute(
      () => import('./features/exams/public-exam-portal.component'),
      () => import('./features/exams/public-exam-portal-mobile.component')
    ),
    data: { examAccess: 'external' }
  },
  { path: '**', redirectTo: 'dashboard' }
];
