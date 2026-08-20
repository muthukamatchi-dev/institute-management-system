import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { FeeRecord, Student, Batch } from '../../models';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { Observable, firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';
import { ExportHelper } from '../../shared/utils/export-helper';

@Component({
  selector: 'app-fee-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ModalComponent, FormsModule, CustomFieldsRendererComponent],
  templateUrl: './fee-list.component.html',
})
export class FeeListComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  fees: FeeRecord[] = [];
  students: Student[] = [];
  sortColumn = 'regNumber';
  sortDirection: 'asc' | 'desc' = 'desc';
  searchTerm = '';
  statusFilter = 'active'; // Default to active

  isCollectModalOpen = false;
  isReceiptModalOpen = false;
  selectedStudentId = '';
  selectedStudentName = '';
  selectedFeeInfo: FeeRecord | null = null;
  isDetailsModalOpen = false;
  feeHistory: any[] = [];
  reminderData = {
    date: '',
    enabled: false
  };

  isImportModalOpen = false;
  isGuidanceOpen = false;
  importFile: File | null = null;
  customFields: any[] = [];
  settings: any;
  studentSearchQuery = '';
  showStudentDropdown = false;

  feesMode: 'batchwise' | 'one-to-one' = 'one-to-one';
  selectedBatchId = '';
  fromDate = '';
  toDate = '';
  batches: Batch[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  paymentData = {
    studentId: '',
    amount: 0,
    method: 'Cash',
    refNo: '',
    date: new Date().toISOString().split('T')[0]
  };

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    this.loadFees();
    this.dataService.getStudents().subscribe(data => this.students = data);
    this.dataService.getBatches().subscribe(data => this.batches = data);
    this.dataService.getSettings().subscribe(s => this.settings = s);
    this.dataService.getCustomFields('collect_fee').subscribe(fields => {
      this.customFields = fields;
    });
  }

  loadFees() {
    this.dataService.getFees().subscribe(data => this.fees = data);
  }

  sortedFees() {
    let filtered = this.fees.filter(f => {
      // Mode Filter
      if (this.feesMode === 'batchwise' && this.selectedBatchId) {
        if (f.batchId != this.selectedBatchId) return false;
      }

      // Search Filter
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = this.feesMode === 'one-to-one' ?
        ((f.studentName?.toLowerCase() || '').includes(search) ||
          (f.regNumber?.toLowerCase() || '').includes(search)) : true;

      if (!matchesSearch) return false;

      // Date Filter
      if (this.fromDate && f.lastPaymentDate && f.lastPaymentDate < this.fromDate) return false;
      if (this.toDate && f.lastPaymentDate && f.lastPaymentDate > this.toDate) return false;

      // Status Filter
      if (this.statusFilter !== 'all') {
        if (f.studentStatus !== this.statusFilter) return false;
      }

      return true;
    });

    if (this.sortColumn) {
      filtered.sort((a: any, b: any) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];

        if (this.sortColumn === 'regNumber' || this.sortColumn === 'studentName' || this.sortColumn === 'courseName') {
          return this.sortDirection === 'asc'
            ? String(valA).localeCompare(String(valB), undefined, { numeric: true, sensitivity: 'base' })
            : String(valB).localeCompare(String(valA), undefined, { numeric: true, sensitivity: 'base' });
        }

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return filtered;
  }

  paginatedFees() {
    const filtered = this.sortedFees();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages() {
    return Math.ceil(this.sortedFees().length / this.itemsPerPage) || 1;
  }

  nextPage() { if (this.currentPage < this.totalPages()) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  getStartCount() { return (this.currentPage - 1) * this.itemsPerPage + 1; }
  getEndCount() { return Math.min(this.currentPage * this.itemsPerPage, this.sortedFees().length); }

  resetDates() {
    this.fromDate = '';
    this.toDate = '';
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  getStatusType(status: string): any {
    switch (status) {
      case 'paid': return 'success';
      case 'partially_paid':
      case 'partial': return 'warning';
      case 'pending': return 'danger';
      default: return 'neutral';
    }
  }

  viewDetails(fee: FeeRecord) {
    this.selectedFeeInfo = fee;
    this.isDetailsModalOpen = true;
    if (fee.studentId) {
      this.loadFeeHistory(fee.studentId);
    }
    
    // Load existing reminder
    this.reminderData = {
      date: (fee as any).reminder_date || '',
      enabled: !!(fee as any).is_reminder_enabled
    };
  }

  loadFeeHistory(studentId: string) {
    this.dataService.getStudentReceipts(studentId).subscribe(history => {
      this.feeHistory = history;
    });
  }

  saveReminder() {
    if (!this.selectedFeeInfo) return;
    
    const payload = {
      student_id: this.selectedFeeInfo.studentId,
      reminder_date: this.reminderData.date || null,
      is_enabled: this.reminderData.enabled ? 1 : 0
    };

    this.dataService.saveFeeReminder(payload).subscribe({
      next: () => {
        this.toastService.success('Fee reminder updated');
        // Update local object to reflect change without full reload
        if (this.selectedFeeInfo) {
          (this.selectedFeeInfo as any).reminder_date = payload.reminder_date;
          (this.selectedFeeInfo as any).is_reminder_enabled = payload.is_enabled;
        }
      },
      error: () => this.toastService.error('Failed to set reminder')
    });
  }

  viewReceipt(fee: FeeRecord) {
    this.viewDetails(fee);
  }

  deleteReceipt(receipt: any) {
    if (!confirm(`Are you sure you want to delete payment receipt ${receipt.receiptNo} of ₹${receipt.amount}?`)) {
      return;
    }
    
    this.dataService.deleteReceipt(receipt.id).subscribe({
      next: (res: any) => {
        if (res?.status === 'error') {
          this.toastService.error(res?.message || 'Failed to delete payment');
          return;
        }
        this.toastService.success('Payment deleted successfully!');
        
        // Reload fees list
        this.loadFees();
        
        // Reload history for details modal
        if (this.selectedFeeInfo && this.selectedFeeInfo.studentId) {
          this.loadFeeHistory(this.selectedFeeInfo.studentId);
          setTimeout(() => {
            if (this.selectedFeeInfo) {
              const updatedFee = this.fees.find(f => f.studentId === this.selectedFeeInfo?.studentId);
              if (updatedFee) {
                this.selectedFeeInfo = updatedFee;
              }
            }
          }, 300);
        }
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Error deleting payment';
        this.toastService.error(errorMsg);
      }
    });
  }

  getMonthlyPayable(fee: FeeRecord): number {
    if (!fee) return 0;
    if (fee.monthly_amount && fee.monthly_amount > 0) {
      return Number(fee.monthly_amount);
    }
    if (fee.course_fee_flat && fee.course_fee_flat > 0) {
      return Number(fee.course_fee_flat);
    }
    const units = fee.course_units || 1;
    return Math.round(fee.totalAmount / units);
  }

  isMonthlyBilling(fee: FeeRecord): boolean {
    if (!fee || !fee.course_fee_period) return false;
    const p = fee.course_fee_period.toLowerCase();
    return p.includes('month');
  }

  setQuickAmount(multiplier: number) {
    if (!this.selectedFeeInfo) return;
    if (multiplier === -1) {
      this.paymentData.amount = this.selectedFeeInfo.balanceAmount;
    } else {
      const monthlyPayable = this.getMonthlyPayable(this.selectedFeeInfo);
      this.paymentData.amount = Math.min(monthlyPayable * multiplier, this.selectedFeeInfo.balanceAmount);
    }
  }

  getPeriodLabel(fee: FeeRecord | null): string {
    if (!fee || !fee.course_fee_period) return 'Period';
    const p = fee.course_fee_period.toLowerCase().trim();
    if (p.includes('day') || p.includes('daily')) return 'Day';
    if (p.includes('week') || p.includes('weekly')) return 'Week';
    if (p.includes('month') || p.includes('monthly')) return 'Month';
    if (p.includes('year') || p.includes('yearly')) return 'Year';
    return 'Period';
  }

  setQuickAmountToPayable() {
    if (!this.selectedFeeInfo) return;
    this.paymentData.amount = this.selectedFeeInfo.this_period_payable !== undefined
      ? this.selectedFeeInfo.this_period_payable
      : this.selectedFeeInfo.balanceAmount;
  }

  openCollectModal(fee?: FeeRecord) {
    if (fee) {
      this.selectedFeeInfo = fee;
      const defaultAmount = fee.this_period_payable !== undefined
        ? fee.this_period_payable
        : fee.balanceAmount;

      this.paymentData = {
        studentId: fee.studentId,
        amount: defaultAmount,
        method: 'Cash',
        refNo: '',
        date: new Date().toISOString().split('T')[0]
      };
      this.selectedStudentName = fee.studentName || '';
    } else {
      this.selectedFeeInfo = null;
      this.paymentData = {
        studentId: '',
        amount: 0,
        method: 'Cash',
        refNo: '',
        date: new Date().toISOString().split('T')[0]
      };
      this.selectedStudentId = '';
      this.selectedStudentName = '';
      this.studentSearchQuery = '';
    }
    this.isCollectModalOpen = true;
  }

  get filteredStudentOptions() {
    if (!this.studentSearchQuery) return this.students;
    const q = this.studentSearchQuery.toLowerCase();
    return this.students.filter(s =>
      (s.name?.toLowerCase() || '').includes(q) ||
      (s.regNumber?.toLowerCase() || '').includes(q) ||
      (s.batchName?.toLowerCase() || '').includes(q)
    );
  }

  selectStudent(student: Student) {
    this.selectedStudentId = student.id;
    this.selectedStudentName = student.name;
    const regPart = student.regNumber ? student.regNumber + ' - ' : '';
    const namePart = student.name;
    const batchPart = student.batchName ? ' - ' + student.batchName : '';
    this.studentSearchQuery = `${regPart}${namePart}${batchPart}`;
    this.showStudentDropdown = false;

    // Auto-update balance info
    const feeInfo = this.fees.find(f => f.studentId === student.id);
    if (feeInfo) {
      this.selectedFeeInfo = feeInfo;
      this.paymentData.amount = feeInfo.this_period_payable !== undefined
        ? feeInfo.this_period_payable
        : feeInfo.balanceAmount;
    } else {
      this.selectedFeeInfo = null;
      this.paymentData.amount = 0;
    }
  }

  savePayment() {
    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    const finalData: any = {
      ...this.paymentData,
      studentId: this.paymentData.studentId || this.selectedStudentId
    };

    if (!finalData.studentId || finalData.amount <= 0) return;

    if (this.selectedFeeInfo && finalData.amount > this.selectedFeeInfo.balanceAmount) {
      this.toastService.error(`Payment amount (${finalData.amount}) cannot exceed balance amount (${this.selectedFeeInfo.balanceAmount})`);
      return;
    }

    // Merge custom fields
    if (this.customFieldsRenderer) {
      finalData.custom_fields = this.customFieldsRenderer.getValues();
    }

    this.dataService.collectFee(finalData).subscribe({
      next: (res: any) => {
        if (res?.status === 'error') {
          this.toastService.error(res?.message || 'Failed to collect payment');
          return;
        }
        this.loadFees();
        this.isCollectModalOpen = false;
        this.toastService.success('Payment collected successfully!');
      },
      error: (err: any) => {
        const errorMsg = err?.error?.message || err?.message || 'Error collecting payment';
        this.toastService.error(errorMsg);
      }
    });
  }

  viewHistory() {
    this.toastService.info('Payment History feature coming soon!');
  }

  // --- Import / Export ---
  exportToExcel() {
    const rawData = this.sortedFees().map(f => ({
      'Student Name': f.studentName,
      'Course': f.courseName,
      'Total Fees': f.totalAmount,
      'Paid Amount': f.paidAmount,
      'Balance': f.balanceAmount,
      'Last Payment': f.lastPaymentDate,
      'Status': f.status
    }));

    const ws = ExportHelper.addExcelHeader(rawData, this.settings, 'FEE COLLECTION REPORT');
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'FeeRegister');
    XLSX.writeFile(wb, 'Fee_List.xlsx');
  }

  async exportToPDF() {
    const doc = new jsPDF() as any;
    const data = this.sortedFees().map(f => [
      String(f.studentName || ''),
      String(f.totalAmount || 0),
      String(f.paidAmount || 0),
      String(f.balanceAmount || 0),
      String(f.status || '')
    ]);

    const startY = await ExportHelper.addPDFHeader(doc, this.settings, 'FEE COLLECTION REPORT');

    autoTable(doc, {
      startY: startY,
      head: [['Student', 'Total (₹)', 'Paid (₹)', 'Balance (₹)', 'Status']],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [16, 185, 129] } // Emerald-600 for finance
    });

    doc.save('Fee_Records.pdf');
  }

  triggerImport() {
    this.isImportModalOpen = true;
    this.importFile = null;
  }

  onFileChange(event: any) {
    this.importFile = event.target.files[0];
  }

  async processImport() {
    if (!this.importFile) {
      this.toastService.warning('Please select a file first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) {
        this.toastService.warning('The uploaded file is empty.');
        return;
      }

      if (confirm(`Detected ${data.length} payment records. Proceed with sequential processing?`)) {
        let imported = 0;
        for (const row of data) {
          const payment = {
            studentId: row['Student ID'] || row['student_id'] || '',
            amount: Number(row['Amount'] || row['amount'] || 0),
            method: row['Method'] || row['method'] || 'Cash',
            refNo: row['Reference'] || row['ref_no'] || ''
          };

          // Map Custom Fields
          const customValues: any = {};
          this.customFields.forEach(cf => {
            if (row[cf.label] !== undefined) {
              customValues[cf.id] = row[cf.label];
            }
          });
          if (Object.keys(customValues).length > 0) {
            (payment as any).custom_fields = customValues;
          }

          if (payment.studentId && payment.amount > 0) {
            try {
              await firstValueFrom(this.dataService.collectFee(payment));
              imported++;
            } catch (err) {
              console.error('Failed to import payment:', payment.studentId, err);
            }
          }
        }
        this.loadFees();
        this.isImportModalOpen = false;
        if (imported > 0) {
          this.toastService.success(`${imported} payment records processed.`);
        } else {
          this.toastService.error('No payment records were processed.');
        }
      }
    };
    reader.readAsBinaryString(this.importFile);
  }

  toggleGuidance() {
    this.isGuidanceOpen = !this.isGuidanceOpen;
  }
}
