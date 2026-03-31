import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Observable, forkJoin } from 'rxjs';
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
  timeframe: 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' = 'month';
  attendanceTarget: 'batch' | 'one-to-one' | 'course' = 'batch';
  selectedCourseId: any = 'all';
  selectedBatchId: any = 'all';
  selectedStudentId: any = null;
  customStartDate: string = '';
  customEndDate: string = '';
  reportSearch: string = '';

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

  constructor(private dataService: DataService, private route: ActivatedRoute, private toastService: ToastService) { }

  ngOnInit() {
    // 1. Fetch all necessary data first to avoid race conditions
    forkJoin({
      batches: this.dataService.getBatches(),
      students: this.dataService.getStudents(),
      courses: this.dataService.getCourses(),
      settings: this.dataService.getSettings()
    }).subscribe(({ batches, students, courses, settings }) => {
      this.batches = batches;
      this.allStudents = students;
      this.courses = courses;
      this.settings = settings;

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

  getReportsByCategory(cat: string) {
    return this.reports.filter(r => r.category === cat);
  }

  openReport(report: ReportItem) {
    this.activeReport = report.id;
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
      case 'week':
        const weekStart = new Date(now.setDate(now.getDate() - now.getDay()));
        const weekEnd = new Date(now.setDate(now.getDate() + 6));
        start = weekStart.toISOString().split('T')[0];
        end = weekEnd.toISOString().split('T')[0];
        break;
      case 'month':
        start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        end = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
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
      case 'custom':
        start = this.customStartDate;
        end = this.customEndDate;
        break;
    }
    return { start, end };
  }

  loadFeesDiary() {
    this.dataService.getReceipts().subscribe(data => {
      this.receipts = data;
      this.totalRevenue = data.reduce((sum, r) => sum + r.amount, 0);
    });
  }

  loadProfitLoss() {
    const dates = this.getReportFilters();
    this.dataService.getProfitLoss(dates).subscribe(data => this.profitLossData = data);
  }

  loadExpenses() {
    const dates = this.getReportFilters();
    this.dataService.getExpensesReport(dates).subscribe(data => this.expensesData = data);
  }

  loadBatchPerformance() {
    this.dataService.getBatchPerformance({ course_id: this.selectedCourseId }).subscribe(data => this.batchPerformanceData = data);
  }

  loadCourseRevenue() {
    const dates = this.getReportFilters();
    this.dataService.getCourseRevenue(dates).subscribe(data => this.courseRevenueData = data);
  }

  loadEnrollmentTrends() {
    this.dataService.getEnrollmentTrends({ year: new Date().getFullYear() }).subscribe(data => this.enrollmentTrendsData = data);
  }

  loadStudentMap() {
    this.dataService.getStudentMap({ course_id: this.selectedCourseId }).subscribe(data => this.studentMapData = data);
  }

  loadAuditLogs() {
    this.dataService.getAuditLogs({}).subscribe(data => this.auditLogsData = data);
  }

  loadStaffWorklog() {
    this.dataService.getStaffWorklog({}).subscribe(data => this.staffWorklogData = data);
  }

  filteredReceipts() {
    const s = this.diarySearch.toLowerCase();
    return this.receipts.filter(r =>
      r.receiptNo.toLowerCase().includes(s) ||
      r.studentName.toLowerCase().includes(s)
    );
  }

  loadAttendanceReport() {
    const dates = this.getReportFilters();

    const filters = {
      start_date: dates.start,
      end_date: dates.end,
      course_id: this.selectedCourseId,
      batch_id: this.selectedBatchId,
      student_id: this.selectedStudentId,
      type: this.attendanceTarget
    };

    this.dataService.getAttendanceReport(filters).subscribe(data => {
      this.attendanceReportData = data;
      this.processAttendanceStats(data);
    });
  }

  processAttendanceStats(data: any[]) {
    if (!data.length) {
      this.attendanceStats = { totalClasses: 0, present: 0, absent: 0, avg: 0 };
      this.attendanceChart = [];
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

    // Mock chart data based on distribution or something similar
    this.attendanceChart = data.slice(0, 7).map(item => ({
      label: item.student_name.split(' ')[0],
      value: item.percentage
    }));
  }

  filteredAttendance() {
    const s = this.reportSearch.toLowerCase();
    return this.attendanceReportData.filter(item =>
      item.student_name.toLowerCase().includes(s) ||
      (item.batch_name && item.batch_name.toLowerCase().includes(s)) ||
      (item.course_name && item.course_name.toLowerCase().includes(s))
    );
  }

  async exportToPDF() {
    const doc = new jsPDF() as any;
    const reportTitle = `Attendance Report - ${this.timeframe.toUpperCase()}`;

    const tableData = this.filteredAttendance().map(item => [
      item.student_name,
      item.reg_number,
      item.batch_name || 'N/A',
      item.total_sessions,
      item.present_count,
      item.absent_count,
      `${item.percentage}%`
    ]);

    const startY = await ExportHelper.addPDFHeader(doc, this.settings, reportTitle.toUpperCase());

    (doc as any).autoTable({
      startY: startY,
      head: [['Student Name', 'Reg #', 'Batch', 'Sessions', 'Present', 'Absent', '%']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [79, 70, 229] }, // Primary color
      styles: { fontSize: 9 }
    });

    doc.save(`Attendance_Report_${this.timeframe}_${new Date().getTime()}.pdf`);
    this.toastService.success('Attendance report exported to PDF');
  }

  exportToExcel() {
    const reportTitle = `Attendance Report - ${this.timeframe.toUpperCase()}`;
    const data = this.filteredAttendance().map(item => ({
      'Student Name': item.student_name,
      'Registration #': item.reg_number,
      'Batch': item.batch_name || 'N/A',
      'Total Sessions': item.total_sessions,
      'Present': item.present_count,
      'Absent': item.absent_count,
      'Attendance %': `${item.percentage}%`
    }));

    const ws = ExportHelper.addExcelHeader(data, this.settings, reportTitle.toUpperCase());
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');

    XLSX.writeFile(wb, `Attendance_Report_${this.timeframe}_${new Date().getTime()}.xlsx`);
    this.toastService.success('Attendance report exported to Excel');
  }
}
