import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login.component';
import { LayoutComponent } from './shared/components/layout.component';

export const routes: Routes = [
    { path: 'login', component: LoginComponent },
    {
        path: 'find-institute',
        loadComponent: () => import('./features/auth/find-institute.component').then(m => m.FindInstituteComponent)
    },
    {
        path: '',
        component: LayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
            },
            {
                path: 'day-book',
                loadComponent: () => import('./features/day-book/day-book.component').then(m => m.DayBookComponent)
            },
            {
                path: 'students',
                loadComponent: () => import('./features/students/student-list.component').then(m => m.StudentListComponent)
            },
            {
                path: 'courses',
                loadComponent: () => import('./features/courses/course-list.component').then(m => m.CourseListComponent)
            },
            {
                path: 'batches',
                loadComponent: () => import('./features/batches/batch-list.component').then(m => m.BatchListComponent)
            },
            {
                path: 'staff',
                loadComponent: () => import('./features/staff/staff-list.component').then(m => m.StaffListComponent)
            },
            {
                path: 'fees',
                loadComponent: () => import('./features/fees/fee-list.component').then(m => m.FeeListComponent)
            },
            {
                path: 'attendance',
                loadComponent: () => import('./features/attendance/attendance.component').then(m => m.AttendanceComponent)
            },
            {
                path: 'reports',
                loadComponent: () => import('./features/reports/reports.component').then(m => m.ReportsComponent)
            },
            {
                path: 'profile',
                loadComponent: () => import('./features/profile/profile.component').then(m => m.ProfileComponent)
            },
            {
                path: 'settings',
                loadComponent: () => import('./features/settings/settings.component').then(m => m.SettingsComponent)
            },
            {
                path: 'expenses',
                loadComponent: () => import('./features/expenses/expenses.component').then(m => m.ExpensesComponent)
            },
            {
                path: 'study-material',
                loadComponent: () => import('./features/study-material/study-material.component').then(m => m.StudyMaterialComponent)
            },
            {
                path: 'my-study-material',
                loadComponent: () => import('./features/study-material/student-study-material.component').then(m => m.StudentStudyMaterialComponent)
            },
            {
                path: 'exams/questions',
                loadComponent: () => import('./features/exams/question-bank/question-bank.component').then(m => m.QuestionBankComponent)
            },
            {
                path: 'exams/internal',
                loadComponent: () => import('./features/exams/internal/internal-exam.component').then(m => m.InternalExamComponent)
            },
            {
                path: 'exams/external',
                loadComponent: () => import('./features/exams/external/external-exam.component').then(m => m.ExternalExamComponent)
            },
            {
                path: 'exams/entries',
                loadComponent: () => import('./features/exams/entries/exam-entries.component').then(m => m.ExamEntriesComponent)
            },
            {
                path: 'exams/external/results/:id',
                loadComponent: () => import('./features/exams/external/external-results.component').then(m => m.ExternalResultsComponent)
            },
            {
                path: 'my-exams',
                loadComponent: () => import('./features/exams/student-exam.component').then(m => m.StudentExamComponent)
            },
            {
                path: 'my-progress',
                loadComponent: () => import('./features/students/my-progress.component').then(m => m.MyProgressComponent)
            },
            // Staff Routes
            {
                path: 'staff/my-attendance',
                loadComponent: () => import('./features/staff/staff-my-attendance.component').then(m => m.StaffMyAttendanceComponent)
            },
            {
                path: 'staff/schedule',
                loadComponent: () => import('./features/staff/staff-schedule.component').then(m => m.StaffScheduleComponent)
            },
            {
                path: 'staff/students',
                loadComponent: () => import('./features/staff/staff-students.component').then(m => m.StaffStudentsComponent)
            },
            {
                path: 'staff/courses',
                loadComponent: () => import('./features/staff/staff-courses.component').then(m => m.StaffCoursesComponent)
            },
            {
                path: 'staff/batches',
                loadComponent: () => import('./features/staff/staff-batches.component').then(m => m.StaffBatchesComponent)
            },
            {
                path: 'staff/attendance',
                loadComponent: () => import('./features/staff/staff-attendance.component').then(m => m.StaffAttendanceComponent)
            },
            // Super Admin
            {
                path: 'super-admin',
                loadComponent: () => import('./features/super-admin/super-admin.component').then(m => m.SuperAdminComponent)
            }
        ]
    },
    {
        path: 'internal/exam/:examId',
        loadComponent: () => import('./features/exams/public-exam-portal.component').then(m => m.PublicExamPortalComponent),
        data: { examAccess: 'internal' }
    },
    {
        path: 'public/exam/:examId',
        loadComponent: () => import('./features/exams/public-exam-portal.component').then(m => m.PublicExamPortalComponent),
        data: { examAccess: 'external' }
    },
    { path: '**', redirectTo: 'dashboard' }
];
