import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { BranchContextService } from '../../services/branch-context.service';
import { Observable, forkJoin, Subscription } from 'rxjs';
import jsPDF from 'jspdf';
import { ToastService } from '../../services/toast.service';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

interface ReportItem {
  id: string;
  title: string;
  description: string;
  icon: string;
  category: 'Financial' | 'Academic' | 'Student' | 'Operations';
  isLive: boolean;
}

import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { ExportHelper } from '../../shared/utils/export-helper';
import { BrandingHeaderComponent } from '../../shared/ui/branding-header.component';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: 'reports.component.html',
  styles: [`
    .fade-in {
      animation: fadeIn 0.4s ease-out;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .shadow-soft {
      box-shadow: 0 10px 40px -10px rgba(0,0,0,0.05);
    }
  `]
})
export class ReportsComponent implements OnInit {
  categories: ReportItem['category'][] = ['Financial', 'Academic', 'Student', 'Operations'];

  reports: ReportItem[] = [
    { id: 'profit-loss', title: 'Profit & Loss', description: 'Net earnings versus operational costs.', icon: '💰', category: 'Financial', isLive: true },
    { id: 'fees-diary', title: 'Fees Diary', description: 'Complete ledger of all collected fees.', icon: '📒', category: 'Financial', isLive: true },
    { id: 'expenses', title: 'Expenses Report', description: 'Detailed breakdown of institute costs.', icon: '💸', category: 'Financial', isLive: true },

    { id: 'attendance-glancer', title: 'Attendance Glancer', description: 'Bird-eye view of student presence.', icon: '👀', category: 'Academic', isLive: true },
    { id: 'batch-performance', title: 'Batch Performance', description: 'Syllabus progress and test scores.', icon: '🎯', category: 'Academic', isLive: true },
    { id: 'course-index', title: 'Course Revenue Index', description: 'Which courses are driving growth.', icon: '💎', category: 'Academic', isLive: true },

    { id: 'enrollment-trends', title: 'Enrollment Trends', description: 'New registrations over time mapped.', icon: '📈', category: 'Student', isLive: true },
    { id: 'student-demographics', title: 'Student Map', description: 'Geographic and background analysis.', icon: '🗺️', category: 'Student', isLive: true },

    { id: 'system-logs', title: 'Audit Logs', description: 'System-wide activity and changes.', icon: '🛡️', category: 'Operations', isLive: true },
    { id: 'staff-activity', title: 'Staff Worklog', description: 'Monitoring administrative efficiency.', icon: '👥', category: 'Operations', isLive: true }
  ];

  activeReport: string | null = null;

  // Data for Working Reports
  receipts: any[] = [];
  diarySearch: string = '';
  totalRevenue: number = 0;

  attendanceStats = { totalClasses: 0, present: 0, absent: 0, avg: 0 };
  attendanceChart: any[] = [];
  attendanceReportData: any[] = [];
  topAttendees: any[] = [];

  // Attendance Filters
  timeframe: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'yesterday' | 'last_week' | 'last_month' | 'academic_year' = 'month';
  attendanceTarget: 'batch' | 'one-to-one' | 'course' = 'batch';
  selectedCourseId: any = 'all';
  selectedBatchId: any = 'all';
  selectedStudentId: any = null;
  customStartDate: string = '';
  customEndDate: string = '';
  reportSearch: string = '';

  // Advanced filters state
  studentNameFilter: string = '';
  regNumberFilter: string = '';
  studentIdFilter: string = '';
  attendanceStatusFilter: string = 'all';
  percentFilter: string = 'all';
  minPercent: number | null = null;
  maxPercent: number | null = null;
  genderFilter: string = 'all';
  activeStatusFilter: string = 'all';
  specialFilter: string = 'all';
  subjectFilter: string = 'all';
  thresholdFilter: number = 75;
  consecDaysFilter: number = 3;
  lateLimitFilter: number = 3;
  leaveLimitFilter: number = 3;

  // Pagination & Sorting state
  page: number = 0;
  size: number = 10;
  totalElements: number = 0;
  totalPages: number = 1;
  sortColumn: string = 'student_name';
  sortDirection: string = 'ASC';

  // Column Visibility
  visibleColumns: {
    name: boolean;
    regNumber: boolean;
    batch: boolean;
    sessions: boolean;
    pa: boolean;
    percentage: boolean;
    [key: string]: boolean;
  } = {
    name: true,
    regNumber: true,
    batch: true,
    sessions: true,
    pa: true,
    percentage: true
  };

  // Analytics Widgets data
  perfectAttendance: any[] = [];
  lowestAttendance: any[] = [];
  frequentlyAbsent: any[] = [];
  consecutiveAbsentees: any[] = [];
  monthlyComparison: any[] = [];

  batches: any[] = [];
  allStudents: any[] = [];
  courses: any[] = [];

  profitLossData: any = null;
  expensesData: any[] = [];
  batchPerformanceData: any[] = [];
  courseRevenueData: any[] = [];
  enrollmentTrendsData: any[] = [];
  studentMapData: any[] = [];
  auditLogsData: any[] = [];
  staffWorklogData: any[] = [];
  settings: any;

  get totalExpensesAmount(): number {
    return this.expensesData.reduce((sum, e) => sum + Number(e.amount), 0);
  }

  selectedBranchId: any = 'all';
  activeBranches: any[] = [];
  isMultiBranchEnabled: boolean = false;

  constructor(
    private dataService: DataService,
    private route: ActivatedRoute,
    private toastService: ToastService,
    private branchContextService: BranchContextService
  ) { }

  growthInsight: string = '+12%';
  growthPeriod: string = 'this month';

  ngOnInit() {
    // Hide header branch selector while in reports
    this.branchContextService.setHeaderHidden(true);

    // Subscribe to branch context
    this.branchContextService.isEnabled$.subscribe(enabled => this.isMultiBranchEnabled = enabled);
    this.branchContextService.branches$.subscribe(branches => this.activeBranches = branches);

    // 1. Fetch all necessary data first to avoid race conditions
    forkJoin({
      batches: this.dataService.getBatches(),
      students: this.dataService.getStudents(),
      courses: this.dataService.getCourses(),
      settings: this.dataService.getSettings(),
      stats: this.dataService.getStats()
    }).subscribe(({ batches, students, courses, settings, stats }) => {
      this.batches = batches;
      this.allStudents = students;
      this.courses = courses;
      this.settings = settings;
      
      if (stats && (stats as any).growthInsight) {
        const parts = (stats as any).growthInsight.split(' ');
        this.growthInsight = parts[0];
        this.growthPeriod = parts.slice(1).join(' ');
      }

      // 2. Handle Query Parameters AFTER data is loaded
      this.route.queryParams.subscribe(params => {
        if (params['report']) {
          // Normalizing report name (supporting hyphen or space)
          const reportName = params['report'].replace(' ', '-');
          this.activeReport = reportName;

          if (reportName === 'attendance-glancer') {
            if (params['batchId']) {
              this.selectedBatchId = String(params['batchId']);
              this.attendanceTarget = params['target'] || 'batch';
              this.selectedStudentId = 'all';

              // Auto-select course for this batch
              const batch = this.batches.find(b => String(b.id) === this.selectedBatchId);
              if (batch) {
                this.selectedCourseId = String(batch.courseId);
              }
            } else if (params['courseId']) {
              this.selectedCourseId = String(params['courseId']);
              this.selectedBatchId = 'all';
            }
          }

      this.loadCurrentReport();
        }
      });
    });
  }

  ngOnDestroy() {
    // Restore header branch selector when leaving reports
    this.branchContextService.setHeaderHidden(false);
  }

  onBranchFilterChange() {
    this.loadCurrentReport();
  }

  getReportsByCategory(cat: string) {
    return this.reports.filter(r => r.category === cat);
  }

  openReport(report: ReportItem) {
    this.activeReport = report.id;
    if (report.id === 'attendance-glancer') {
      this.loadFiltersFromStorage();
    }
    this.loadCurrentReport();
  }

  closeReport() {
    this.activeReport = null;
  }

  getActiveReportData() {
    return this.reports.find(r => r.id === this.activeReport);
  }

  loadCurrentReport() {
    if (!this.activeReport) return;

    switch (this.activeReport) {
      case 'fees-diary': this.loadFeesDiary(); break;
      case 'attendance-glancer': this.loadAttendanceReport(); break;
      case 'profit-loss': this.loadProfitLoss(); break;
      case 'expenses': this.loadExpenses(); break;
      case 'batch-performance': this.loadBatchPerformance(); break;
      case 'course-index': this.loadCourseRevenue(); break;
      case 'enrollment-trends': this.loadEnrollmentTrends(); break;
      case 'student-demographics': this.loadStudentMap(); break;
      case 'system-logs': this.loadAuditLogs(); break;
      case 'staff-activity': this.loadStaffWorklog(); break;
    }
  }

  exportReport() {
    if (!this.activeReport) return;

    let dataToExport: any[] = [];
    let reportTitle = this.getActiveReportData()?.title || 'System Report';
    let fileName = `${this.activeReport}_report_${new Date().toISOString().split('T')[0]}.xlsx`;

    switch (this.activeReport) {
      case 'fees-diary': dataToExport = this.receipts; break;
      case 'expenses': dataToExport = this.expensesData; break;
      case 'batch-performance': dataToExport = this.batchPerformanceData; break;
      case 'course-index': dataToExport = this.courseRevenueData; break;
      case 'enrollment-trends': dataToExport = this.enrollmentTrendsData; break;
      case 'student-demographics': dataToExport = this.studentMapData; break;
      case 'system-logs': dataToExport = this.auditLogsData; break;
      case 'staff-activity': dataToExport = this.staffWorklogData; break;
    }

    if (dataToExport.length === 0) {
      this.toastService.warning('No data available to export.');
      return;
    }

    const ws = ExportHelper.addExcelHeader(dataToExport, this.settings, reportTitle.toUpperCase());
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Report Data');
    XLSX.writeFile(wb, fileName);
    this.toastService.success(`${reportTitle} exported to Excel`);
  }

  getReportFilters() {
    let start = '';
    let end = '';
    const now = new Date();

    switch (this.timeframe) {
      case 'today':
        start = end = now.toISOString().split('T')[0];
        break;
      case 'yesterday':
        const yesterday = new Date();
        yesterday.setDate(now.getDate() - 1);
        start = end = yesterday.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() + 6));
        start = weekStart.toISOString().split('T')[0];
        end = weekEnd.toISOString().split('T')[0];
        break;
      case 'last_week':
        const lastWeekStart = new Date();
        lastWeekStart.setDate(now.getDate() - now.getDay() - 7);
        const lastWeekEnd = new Date();
        lastWeekEnd.setDate(now.getDate() - now.getDay() - 1);
        start = lastWeekStart.toISOString().split('T')[0];
        end = lastWeekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
        break;
      case 'last_month':
        const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        start = lastMonthDate.toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        start = new Date(now.getFullYear(), quarter * 3, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), (quarter + 1) * 3, 0).toISOString().split('T')[0];
        break;
      case 'year':
        start = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
        break;
      case 'academic_year':
        const currentYear = now.getFullYear();
        if (now.getMonth() >= 5) { // June or later
          start = `${currentYear}-06-01`;
          end = `${currentYear + 1}-05-31`;
        } else {
          start = `${currentYear - 1}-06-01`;
          end = `${currentYear}-05-31`;
        }
        break;
      case 'custom':
        start = this.customStartDate;
        end = this.customEndDate;
        break;
    }
    return { start, end };
  }

  loadFeesDiary() {
    const dates = this.getReportFilters();
    const filters = {
      ...dates,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getFeesDiary(filters).subscribe(data => {
      this.receipts = data;
      this.totalRevenue = this.receipts.reduce((sum, r) => sum + r.amount, 0);
    });
  }

  loadProfitLoss() {
    const dates = this.getReportFilters();
    const filters = {
      ...dates,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getProfitLoss(filters).subscribe(data => this.profitLossData = data);
  }

  loadExpenses() {
    const dates = this.getReportFilters();
    const filters = {
      ...dates,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getExpensesReport(filters).subscribe(data => this.expensesData = data);
  }

  loadBatchPerformance() {
    const filters = {
      course_id: this.selectedCourseId,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getBatchPerformance(filters).subscribe(data => this.batchPerformanceData = data);
  }

  loadCourseRevenue() {
    const dates = this.getReportFilters();
    const filters = {
      ...dates,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getCourseRevenue(filters).subscribe(data => this.courseRevenueData = data);
  }

  loadEnrollmentTrends() {
    const filters = {
      year: new Date().getFullYear(),
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getEnrollmentTrends(filters).subscribe(data => this.enrollmentTrendsData = data);
  }

  loadStudentMap() {
    const filters = {
      course_id: this.selectedCourseId,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getStudentMap(filters).subscribe(data => this.studentMapData = data);
  }

  loadAuditLogs() {
    const filters = {
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getAuditLogs(filters).subscribe(data => this.auditLogsData = data);
  }

  loadStaffWorklog() {
    const filters = {
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getStaffWorklog(filters).subscribe(data => this.staffWorklogData = data);
  }

  filteredReceipts() {
    const s = this.diarySearch.toLowerCase();
    return this.receipts.filter(r =>
      r.receiptNo.toLowerCase().includes(s) ||
      r.studentName.toLowerCase().includes(s)
    );
  }

  loadAttendanceReport() {
    this.saveFiltersToStorage();
    const dates = this.getReportFilters();

    const filters: any = {
      start: dates.start,
      end: dates.end,
      course_id: this.selectedCourseId,
      batch_id: this.selectedBatchId,
      student_id: this.selectedStudentId,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId,
      type: this.attendanceTarget,
      page: this.page,
      size: this.size,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    // Add extra filters if they are set
    if (this.studentNameFilter) filters.studentName = this.studentNameFilter;
    if (this.regNumberFilter) filters.regNumber = this.regNumberFilter;
    if (this.studentIdFilter) filters.studentId = this.studentIdFilter;
    if (this.attendanceStatusFilter !== 'all') filters.attendanceStatus = this.attendanceStatusFilter;
    if (this.percentFilter !== 'all') filters.percentFilter = this.percentFilter;
    if (this.minPercent !== null) filters.minPercent = this.minPercent;
    if (this.maxPercent !== null) filters.maxPercent = this.maxPercent;
    if (this.genderFilter !== 'all') filters.gender = this.genderFilter;
    if (this.activeStatusFilter !== 'all') filters.activeStatus = this.activeStatusFilter;
    if (this.specialFilter !== 'all') filters.specialFilter = this.specialFilter;
    if (this.subjectFilter !== 'all') filters.subject = this.subjectFilter;
    if (this.thresholdFilter !== null) filters.threshold = this.thresholdFilter;
    if (this.consecDaysFilter !== null) filters.consecDays = this.consecDaysFilter;
    if (this.lateLimitFilter !== null) filters.lateLimit = this.lateLimitFilter;
    if (this.leaveLimitFilter !== null) filters.leaveLimit = this.leaveLimitFilter;

    // Load statistics/chart/ranking data
    this.loadAttendanceAnalytics();

    this.dataService.getAttendanceReport(filters).subscribe(data => {
      this.attendanceReportData = data.content || [];
      this.totalElements = data.totalElements || 0;
      this.totalPages = data.totalPages || 1;
      this.processAttendanceStats(this.attendanceReportData);
    });
  }

  loadAttendanceAnalytics() {
    const dates = this.getReportFilters();
    const filters: any = {
      start: dates.start,
      end: dates.end,
      course_id: this.selectedCourseId,
      batch_id: this.selectedBatchId,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId
    };
    this.dataService.getAttendanceAnalytics(filters).subscribe(data => {
      this.perfectAttendance = data.perfectAttendance || [];
      this.lowestAttendance = data.lowestAttendance || [];
      this.frequentlyAbsent = data.frequentlyAbsent || [];
      this.consecutiveAbsentees = data.consecutiveAbsentees || [];
      this.monthlyComparison = data.monthlyComparison || [];
      
      // Update charts and headers
      if (this.monthlyComparison && this.monthlyComparison.length > 0) {
        this.attendanceChart = this.monthlyComparison.map(m => ({
          label: m.month,
          value: m.percentage
        }));
      }
    });
  }

  processAttendanceStats(data: any[]) {
    if (!data.length) {
      this.attendanceStats = { totalClasses: 0, present: 0, absent: 0, avg: 0 };
      this.topAttendees = [];
      return;
    }

    const total = data.reduce((sum, item) => sum + item.total_sessions, 0);
    const present = data.reduce((sum, item) => sum + item.present_count, 0);
    const absent = data.reduce((sum, item) => sum + item.absent_count, 0);

    this.attendanceStats = {
      totalClasses: total,
      present: present,
      absent: absent,
      avg: total > 0 ? Math.round((present / total) * 100) : 0
    };

    // Sort for Top Attendees
    this.topAttendees = [...data]
      .sort((a, b) => b.percentage - a.percentage)
      .slice(0, 5);
  }

  filteredAttendance() {
    // Client-side quick filter/search fallback on the already paginated content
    const s = this.reportSearch.toLowerCase();
    return this.attendanceReportData.filter(item =>
      item.student_name.toLowerCase().includes(s) ||
      (item.batch_name && item.batch_name.toLowerCase().includes(s)) ||
      (item.course_name && item.course_name.toLowerCase().includes(s))
    );
  }

  get allSubjects(): string[] {
    const list: string[] = [];
    this.courses.forEach(c => {
      if (c.subjects) {
        let subs: string[] = [];
        if (typeof c.subjects === 'string') {
          subs = c.subjects.split(',').map((s: string) => s.trim());
        } else if (Array.isArray(c.subjects)) {
          subs = c.subjects;
        }
        subs.forEach(s => {
          if (s && !list.includes(s)) list.push(s);
        });
      }
    });
    return list;
  }

  applyQuickFilter(filterType: string) {
    this.page = 0;
    // Reset other filters
    this.percentFilter = 'all';
    this.specialFilter = 'all';
    this.attendanceStatusFilter = 'all';

    switch (filterType) {
      case 'today':
        this.timeframe = 'today';
        break;
      case 'week':
        this.timeframe = 'week';
        break;
      case 'month':
        this.timeframe = 'month';
        break;
      case 'below_75':
        this.percentFilter = 'below_75';
        break;
      case 'below_60':
        this.percentFilter = 'below_60';
        break;
      case 'perfect':
        this.percentFilter = 'perfect';
        break;
      case 'frequently_absent':
        this.specialFilter = 'consecutive_absent';
        break;
    }
    this.loadAttendanceReport();
  }

  resetFilters() {
    this.timeframe = 'month';
    this.attendanceTarget = 'batch';
    this.selectedCourseId = 'all';
    this.selectedBatchId = 'all';
    this.selectedStudentId = null;
    this.customStartDate = '';
    this.customEndDate = '';
    this.reportSearch = '';
    this.studentNameFilter = '';
    this.regNumberFilter = '';
    this.studentIdFilter = '';
    this.attendanceStatusFilter = 'all';
    this.percentFilter = 'all';
    this.minPercent = null;
    this.maxPercent = null;
    this.genderFilter = 'all';
    this.activeStatusFilter = 'all';
    this.specialFilter = 'all';
    this.subjectFilter = 'all';
    this.thresholdFilter = 75;
    this.consecDaysFilter = 3;
    this.lateLimitFilter = 3;
    this.leaveLimitFilter = 3;
    this.page = 0;
    this.sortColumn = 'student_name';
    this.sortDirection = 'ASC';
    this.loadAttendanceReport();
  }

  // Pagination
  nextPage() {
    if (this.page < this.totalPages - 1) {
      this.page++;
      this.loadAttendanceReport();
    }
  }

  prevPage() {
    if (this.page > 0) {
      this.page--;
      this.loadAttendanceReport();
    }
  }

  goToPage(p: number) {
    this.page = p;
    this.loadAttendanceReport();
  }

  // Sorting
  sortBy(col: string) {
    if (this.sortColumn === col) {
      this.sortDirection = this.sortDirection === 'ASC' ? 'DESC' : 'ASC';
    } else {
      this.sortColumn = col;
      this.sortDirection = 'ASC';
    }
    this.page = 0;
    this.loadAttendanceReport();
  }

  // Column visibility
  toggleColumn(col: string) {
    this.visibleColumns[col] = !this.visibleColumns[col];
  }

  // Persistence
  saveFiltersToStorage() {
    const filterState = {
      timeframe: this.timeframe,
      attendanceTarget: this.attendanceTarget,
      selectedCourseId: this.selectedCourseId,
      selectedBatchId: this.selectedBatchId,
      selectedStudentId: this.selectedStudentId,
      customStartDate: this.customStartDate,
      customEndDate: this.customEndDate,
      reportSearch: this.reportSearch,
      studentNameFilter: this.studentNameFilter,
      regNumberFilter: this.regNumberFilter,
      studentIdFilter: this.studentIdFilter,
      attendanceStatusFilter: this.attendanceStatusFilter,
      percentFilter: this.percentFilter,
      minPercent: this.minPercent,
      maxPercent: this.maxPercent,
      genderFilter: this.genderFilter,
      activeStatusFilter: this.activeStatusFilter,
      specialFilter: this.specialFilter,
      subjectFilter: this.subjectFilter,
      thresholdFilter: this.thresholdFilter,
      consecDaysFilter: this.consecDaysFilter,
      lateLimitFilter: this.lateLimitFilter,
      leaveLimitFilter: this.leaveLimitFilter,
      page: this.page,
      size: this.size,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };
    localStorage.setItem('attendance_report_filters', JSON.stringify(filterState));
  }

  loadFiltersFromStorage() {
    const saved = localStorage.getItem('attendance_report_filters');
    if (saved) {
      try {
        const state = JSON.parse(saved);
        this.timeframe = state.timeframe ?? this.timeframe;
        this.attendanceTarget = state.attendanceTarget ?? this.attendanceTarget;
        this.selectedCourseId = state.selectedCourseId ?? this.selectedCourseId;
        this.selectedBatchId = state.selectedBatchId ?? this.selectedBatchId;
        this.selectedStudentId = state.selectedStudentId ?? this.selectedStudentId;
        this.customStartDate = state.customStartDate ?? this.customStartDate;
        this.customEndDate = state.customEndDate ?? this.customEndDate;
        this.reportSearch = state.reportSearch ?? this.reportSearch;
        this.studentNameFilter = state.studentNameFilter ?? this.studentNameFilter;
        this.regNumberFilter = state.regNumberFilter ?? this.regNumberFilter;
        this.studentIdFilter = state.studentIdFilter ?? this.studentIdFilter;
        this.attendanceStatusFilter = state.attendanceStatusFilter ?? this.attendanceStatusFilter;
        this.percentFilter = state.percentFilter ?? this.percentFilter;
        this.minPercent = state.minPercent ?? this.minPercent;
        this.maxPercent = state.maxPercent ?? this.maxPercent;
        this.genderFilter = state.genderFilter ?? this.genderFilter;
        this.activeStatusFilter = state.activeStatusFilter ?? this.activeStatusFilter;
        this.specialFilter = state.specialFilter ?? this.specialFilter;
        this.subjectFilter = state.subjectFilter ?? this.subjectFilter;
        this.thresholdFilter = state.thresholdFilter ?? this.thresholdFilter;
        this.consecDaysFilter = state.consecDaysFilter ?? this.consecDaysFilter;
        this.lateLimitFilter = state.lateLimitFilter ?? this.lateLimitFilter;
        this.leaveLimitFilter = state.leaveLimitFilter ?? this.leaveLimitFilter;
        this.page = state.page ?? this.page;
        this.size = state.size ?? this.size;
        this.sortColumn = state.sortColumn ?? this.sortColumn;
        this.sortDirection = state.sortDirection ?? this.sortDirection;
      } catch (e) {
        console.error('Error loading filters', e);
      }
    }
  }

  async getExportData(): Promise<any[]> {
    const dates = this.getReportFilters();
    const filters: any = {
      start: dates.start,
      end: dates.end,
      course_id: this.selectedCourseId,
      batch_id: this.selectedBatchId,
      student_id: this.selectedStudentId,
      branch_id: this.selectedBranchId === 'all' ? null : this.selectedBranchId,
      type: this.attendanceTarget,
      page: 0,
      size: -1,
      sortColumn: this.sortColumn,
      sortDirection: this.sortDirection
    };

    if (this.studentNameFilter) filters.studentName = this.studentNameFilter;
    if (this.regNumberFilter) filters.regNumber = this.regNumberFilter;
    if (this.studentIdFilter) filters.studentId = this.studentIdFilter;
    if (this.attendanceStatusFilter !== 'all') filters.attendanceStatus = this.attendanceStatusFilter;
    if (this.percentFilter !== 'all') filters.percentFilter = this.percentFilter;
    if (this.minPercent !== null) filters.minPercent = this.minPercent;
    if (this.maxPercent !== null) filters.maxPercent = this.maxPercent;
    if (this.genderFilter !== 'all') filters.gender = this.genderFilter;
    if (this.activeStatusFilter !== 'all') filters.activeStatus = this.activeStatusFilter;
    if (this.specialFilter !== 'all') filters.specialFilter = this.specialFilter;
    if (this.subjectFilter !== 'all') filters.subject = this.subjectFilter;
    if (this.thresholdFilter !== null) filters.threshold = this.thresholdFilter;
    if (this.consecDaysFilter !== null) filters.consecDays = this.consecDaysFilter;
    if (this.lateLimitFilter !== null) filters.lateLimit = this.lateLimitFilter;
    if (this.leaveLimitFilter !== null) filters.leaveLimit = this.leaveLimitFilter;

    const res = await this.dataService.getAttendanceReport(filters).toPromise();
    return res.content || [];
  }

  async exportToPDF() {
    const doc = new jsPDF('landscape') as any;
    const reportTitle = `Attendance Report - ${this.timeframe.toUpperCase()}`;

    const data = await this.getExportData();
    const tableData = data.map(item => [
      item.student_name,
      item.reg_number,
      item.batch_name || 'N/A',
      item.total_sessions,
      item.present_count,
      item.absent_count,
      item.late_count,
      item.leave_count,
      `${item.percentage}%`
    ]);

    const startY = await ExportHelper.addPDFHeader(doc, this.settings, reportTitle.toUpperCase());

    (doc as any).autoTable({
      startY: startY,
      head: [['Student Name', 'Reg #', 'Batch', 'Sessions', 'Present', 'Absent', 'Late', 'Leave', '%']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] },
      styles: { fontSize: 8 }
    });

    doc.save(`Attendance_Report_${this.timeframe}_${new Date().getTime()}.pdf`);
    this.toastService.success('Attendance report exported to PDF');
  }

  async exportToExcel() {
    const reportTitle = `Attendance Report - ${this.timeframe.toUpperCase()}`;
    const data = await this.getExportData();
    const tableData = data.map(item => ({
      'Student Name': item.student_name,
      'Registration #': item.reg_number,
      'Batch': item.batch_name || 'N/A',
      'Total Sessions': item.total_sessions,
      'Present': item.present_count,
      'Absent': item.absent_count,
      'Late': item.late_count,
      'Leave': item.leave_count,
      'Attendance %': `${item.percentage}%`
    }));

    const ws = ExportHelper.addExcelHeader(tableData, this.settings, reportTitle.toUpperCase());
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    XLSX.writeFile(wb, `Attendance_Report_${this.timeframe}_${new Date().getTime()}.xlsx`);
    this.toastService.success('Attendance report exported to Excel');
  }

  async exportToCSV() {
    const data = await this.getExportData();
    if (data.length === 0) {
      this.toastService.warning('No data available to export.');
      return;
    }
    const headers = ['Student Name', 'Registration #', 'Batch', 'Total Sessions', 'Present', 'Absent', 'Late', 'Leave', 'Attendance %'];
    const rows = data.map(item => [
      `"${item.student_name.replace(/"/g, '""')}"`,
      `"${item.reg_number}"`,
      `"${item.batch_name || 'N/A'}"`,
      item.total_sessions,
      item.present_count,
      item.absent_count,
      item.late_count,
      item.leave_count,
      `${item.percentage}%`
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Attendance_Report_${this.timeframe}_${new Date().getTime()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    this.toastService.success('Attendance report exported to CSV');
  }

  async printReport() {
    const data = await this.getExportData();
    if (data.length === 0) {
      this.toastService.warning('No data available to print.');
      return;
    }
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    let tableRows = '';
    data.forEach(item => {
      tableRows += `
        <tr>
          <td>${item.student_name}</td>
          <td>${item.reg_number}</td>
          <td>${item.batch_name || 'N/A'}</td>
          <td style="text-align: center;">${item.total_sessions}</td>
          <td style="text-align: center;">${item.present_count}</td>
          <td style="text-align: center;">${item.absent_count}</td>
          <td style="text-align: center;">${item.late_count}</td>
          <td style="text-align: center;">${item.leave_count}</td>
          <td style="text-align: right;">${item.percentage}%</td>
        </tr>
      `;
    });

    printWindow.document.write(`
      <html>
        <head>
          <title>Attendance Report - ${this.timeframe.toUpperCase()}</title>
          <style>
            body { font-family: 'Inter', sans-serif; padding: 20px; color: #334155; }
            h2 { color: #1e293b; margin-bottom: 5px; }
            p { font-size: 12px; color: #64748b; margin-top: 0; margin-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin-top: 10px; }
            th, td { border: 1px solid #e2e8f0; padding: 10px; font-size: 12px; text-align: left; }
            th { background-color: #f8fafc; font-weight: bold; color: #475569; }
            tr:nth-child(even) { background-color: #f8fafc; }
          </style>
        </head>
        <body onload="window.print(); window.close();">
          <h2>Attendance Report</h2>
          <p>Generated on ${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')} | Timeframe: ${this.timeframe.toUpperCase()}</p>
          <table>
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Registration #</th>
                <th>Batch</th>
                <th style="text-align: center;">Sessions</th>
                <th style="text-align: center;">Present</th>
                <th style="text-align: center;">Absent</th>
                <th style="text-align: center;">Late</th>
                <th style="text-align: center;">Leave</th>
                <th style="text-align: right;">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  trackByIndex(index: number, item: any): number {
    return index;
  }
}
