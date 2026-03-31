import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Student, Course } from '../../models';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { Observable, firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../services/toast.service';

import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';
import { ExportHelper } from '../../shared/utils/export-helper';

@Component({
  selector: 'app-student-list',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ModalComponent, CustomFieldsRendererComponent],
  templateUrl: './student-list.component.html',
})
export class StudentListComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  students: Student[] = [];
  courses$: Observable<Course[]> | undefined;
  batches$: Observable<any[]> | undefined;
  searchTerm: string = '';
  filterCourse: string = '';
  filterStatus: string = 'active'; // Default to active
  sortColumn: string = 'regNumber';
  sortDirection: 'asc' | 'desc' = 'asc';
  isModalOpen = false;
  isImportModalOpen = false;
  isGuidanceOpen = false;
  importFile: File | null = null;
  customFields: any[] = [];
  regSettings: any = null;
  nextRegNumber = '';
  showExportMenu = false;
  activeActionStudentId: string | null = null;

  enrollmentType: 'batch' | 'one-to-one' = 'batch';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;

  newStudent: Partial<Student> = this.getInitialStudent();
  showSuccess = false;
  successStudentName = '';

  constructor(private dataService: DataService, private toastService: ToastService) { }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as HTMLElement | null;
    if (!target) {
      return;
    }

    if (!target.closest('.student-export-menu-container')) {
      this.showExportMenu = false;
    }

    if (!target.closest('.student-action-menu-container')) {
      this.activeActionStudentId = null;
    }
  }

  ngOnInit() {
    this.loadStudents();
    this.courses$ = this.dataService.getCourses();
    this.batches$ = this.dataService.getBatches();
    // Load register number settings
    this.dataService.getSettings().subscribe(s => this.regSettings = s);
    this.dataService.getCustomFields('student').subscribe(fields => {
      this.customFields = fields;
    });
  }

  getInitialStudent(): Partial<Student> {
    return {
      regNumber: '',
      name: '',
      fatherName: '',
      mobile: '',
      parentMobile: '',
      dob: '',
      qualification: '',
      email: '',
      courseId: '1',
      batchId: '1',
      joiningDate: new Date().toISOString().split('T')[0],
      feeStatus: 'pending',
      status: 'active',
      referredBy: '',
      referralProfession: ''
    };
  }

  loadStudents() {
    this.dataService.getStudents().subscribe(data => {
      this.students = data;
    });
  }

  filteredStudents() {
    let filtered = this.students.filter(s => {
      const search = this.searchTerm.toLowerCase();
      const matchesSearch = s.name.toLowerCase().includes(search) ||
        s.mobile.includes(search) || (s.email && s.email.toLowerCase().includes(search)) ||
        (s.regNumber && s.regNumber.toLowerCase().includes(search));
      const matchesCourse = this.filterCourse ? s.courseId == this.filterCourse : true;
      const matchesStatus = this.filterStatus === 'all' ? true : s.status === this.filterStatus;
      return matchesSearch && matchesCourse && matchesStatus;
    });

    if (this.sortColumn) {
      filtered.sort((a: any, b: any) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        // Special handling for alphanumeric Reg numbers if needed, but standard localeCompare is often better
        if (this.sortColumn === 'regNumber' || this.sortColumn === 'name') {
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

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  paginatedStudents() {
    const filtered = this.filteredStudents();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return filtered.slice(start, start + this.itemsPerPage);
  }

  totalPages() {
    return Math.ceil(this.filteredStudents().length / this.itemsPerPage) || 1;
  }

  nextPage() { if (this.currentPage < this.totalPages()) this.currentPage++; }
  prevPage() { if (this.currentPage > 1) this.currentPage--; }
  getStartCount() { return (this.currentPage - 1) * this.itemsPerPage + 1; }
  getEndCount() { return Math.min(this.currentPage * this.itemsPerPage, this.filteredStudents().length); }

  getFeeStatusType(status: string): any {
    switch (status) {
      case 'paid': return 'success';
      case 'partially_paid': return 'warning';
      case 'pending': return 'danger';
      default: return 'neutral';
    }
  }

  getStatusType(status: string): any {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'neutral';
      case 'inactive': return 'danger';
      case 'suspended': return 'warning';
      case 'discontinued': return 'danger';
      default: return 'neutral';
    }
  }

  markAsCompleted(student: Student) {
    if (confirm(`Mark ${student.name} as course completed?`)) {
      this.updateStatus(student, 'completed');
    }
  }

  updateStatus(student: Student, status: string) {
    const updated = { ...student, status: status };
    this.dataService.addStudent(updated).subscribe({
      next: () => {
        this.loadStudents();
        this.activeActionStudentId = null;
        this.toastService.success(`Student status updated to ${status}`);
      },
      error: (err) => this.toastService.error(err.error?.message || 'Error updating status')
    });
  }

  markByRegisterRange() {
    const from = prompt('Enter starting Register Number:');
    const to = prompt('Enter ending Register Number:');
    if (from && to) {
      this.dataService.markCompleted({ reg_from: from, reg_to: to }).subscribe(() => {
        this.loadStudents();
        this.toastService.success('Students in range marked as completed');
      });
    }
  }

  openAddModal() {
    this.newStudent = this.getInitialStudent();
    this.enrollmentType = 'batch';
    // Load next reg number if mode is auto
    if (!this.regSettings || this.regSettings.reg_mode === 'auto' || !this.regSettings.reg_mode) {
      this.dataService.getNextRegNumber().subscribe(res => {
        this.nextRegNumber = res.next;
        this.newStudent.regNumber = res.next;
      });
    } else {
      this.nextRegNumber = '';
      this.newStudent.regNumber = '';
    }
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  editStudent(student: Student) {
    this.newStudent = { ...student };
    // If it has a batch, show batchwise, otherwise if it's strictly course-only (0 or null batch) show one-to-one
    // But for simplicity, we let the user toggle.
    this.enrollmentType = student.batchId && student.batchId != '0' ? 'batch' : 'one-to-one';
    this.isModalOpen = true;
  }

  deleteStudent(id: string) {
    if (confirm('Are you sure you want to delete this student?')) {
      this.dataService.deleteStudent(id).subscribe({
        next: () => {
          this.loadStudents();
          this.toastService.success('Student record deleted');
        },
        error: (err) => this.toastService.error(err.error?.message || 'Failed to delete student')
      });
    }
  }

  saveStudent() {
    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    // Merge custom fields into newStudent payload
    if (this.customFieldsRenderer) {
      (this.newStudent as any).custom_fields = this.customFieldsRenderer.getValues();
    }

    if (this.enrollmentType === 'batch') {
      this.batches$?.subscribe(batches => {
        const selectedBatch = batches.find(b => b.id == this.newStudent.batchId);
        if (selectedBatch) {
          this.newStudent.courseId = selectedBatch.courseId;
        }
        this.executeSave();
      });
    } else {
      this.newStudent.batchId = '0';
      this.executeSave();
    }
  }

  private executeSave() {
    this.dataService.addStudent(this.newStudent).subscribe({
      next: () => {
        this.toastService.success(this.newStudent.id ? 'Student record updated' : 'New student enrolled successfully');
        this.loadStudents();
        this.closeModal();

        // Show success celebration
        this.showSuccess = true;
        this.successStudentName = this.newStudent.name || 'New Student';
        setTimeout(() => {
          this.showSuccess = false;
        }, 3500);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error saving student. Please try again.');
      }
    });
  }

  // --- Import / Export ---
  exportToExcel() {
    const rawData = this.filteredStudents().map(s => ({
      'Reg Number': s.regNumber,
      'Name': s.name,
      'Mobile': s.mobile,
      'Email': s.email,
      'Course': s.courseName,
      'Batch': s.batchName,
      'Joining Date': s.joiningDate,
      'Status': s.status
    }));

    const ws = ExportHelper.addExcelHeader(rawData, this.regSettings, 'STUDENT LIST REPORT');
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    XLSX.writeFile(wb, 'Students_List.xlsx');
  }

  async exportToPDF() {
    const doc = new jsPDF() as any;
    const data = this.filteredStudents().map(s => [
      String(s.regNumber || '-'),
      String(s.name || ''),
      String(s.mobile || ''),
      String(s.courseName || ''),
      String(s.joiningDate || '')
    ]);

    const startY = await ExportHelper.addPDFHeader(doc, this.regSettings, 'STUDENT LIST REPORT');

    autoTable(doc, {
      startY: startY,
      head: [['Reg #', 'Name', 'Mobile', 'Course', 'Date']],
      body: data,
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });

    doc.save('Students_List.pdf');
  }

  triggerImport() {
    this.isImportModalOpen = true;
    this.importFile = null;
  }

  onFileChange(event: any) {
    this.importFile = event.target.files[0];
  }

  processImport() {
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

      if (confirm(`Detected ${data.length} students. Proceed with sequential import?`)) {
        let imported = 0;
        const skippedRows: string[] = [];
        const courses = await firstValueFrom(this.courses$ || new Observable<Course[]>());
        const batches = await firstValueFrom(this.batches$ || new Observable<any[]>());

        const courseMap = new Map(
          courses.map(course => [this.normalizeImportValue(course.name), course])
        );
        const batchMap = new Map(
          batches.map(batch => [this.normalizeImportValue(batch.batchName), batch])
        );

        for (const [index, row] of data.entries()) {
          const courseName = this.readImportValue(row, ['Course', 'course', 'Course Name', 'course_name']);
          const batchName = this.readImportValue(row, ['Batch', 'batch', 'Batch Name', 'batch_name']);
          const studentName = this.readImportValue(row, ['Name', 'name']) || 'Unknown';
          const rowLabel = `Row ${index + 2} (${studentName})`;

          if (!courseName) {
            skippedRows.push(`${rowLabel}: missing Course.`);
            continue;
          }

          const course = courseMap.get(this.normalizeImportValue(courseName));
          if (!course) {
            skippedRows.push(`${rowLabel}: course "${courseName}" does not exist.`);
            continue;
          }

          let batchId: string | null = null;
          if (batchName) {
            const batch = batchMap.get(this.normalizeImportValue(batchName));
            if (!batch) {
              skippedRows.push(`${rowLabel}: batch "${batchName}" does not exist.`);
              continue;
            }
            if (String(batch.courseId) !== String(course.id)) {
              skippedRows.push(`${rowLabel}: batch "${batchName}" does not belong to course "${courseName}".`);
              continue;
            }
            batchId = batch.id;
          }

          const student: any = {
            regNumber: row['Reg Number'] || row['regNumber'] || row['reg_number'] || row['REG #'] || '',
            name: studentName,
            mobile: String(row['Mobile'] || row['mobile'] || ''),
            email: row['Email'] || row['email'] || '',
            fatherName: row['Father Name'] || row['father_name'] || '',
            dob: this.normalizeImportDate(row['Date of Birth'] || row['dob'] || row['Birth Date'] || ''),
            qualification: row['Qualification'] || '',
            courseId: course.id,
            batchId: batchId ?? '0',
            status: (row['Status'] || row['status'] || 'active').toLowerCase(),
            joiningDate: this.normalizeImportDate(row['Joining Date'] || row['joining_date'] || '')
              || new Date().toISOString().split('T')[0]
          };

          // Map Custom Fields
          const customValues: any = {};
          this.customFields.forEach(cf => {
            if (row[cf.label] !== undefined) {
              customValues[cf.id] = row[cf.label];
            }
          });
          if (Object.keys(customValues).length > 0) {
            (student as any).custom_fields = customValues;
          }

          try {
            await firstValueFrom(this.dataService.addStudent(student));
            imported++;
          } catch (err: any) {
            console.error('Failed to import student:', student.name, err);
            skippedRows.push(`${rowLabel}: ${err?.error?.message || 'failed to save.'}`);
          }
        }

        if (skippedRows.length > 0) {
          this.toastService.error(`Some student records were skipped. Check console for details.`);
        }

        if (imported > 0) {
          this.successStudentName = `${imported} Students`;
          this.loadStudents();
          this.isImportModalOpen = false;
          this.toastService.success(`${imported} students imported successfully.`);

          // Show success celebration
          this.showSuccess = true;
          setTimeout(() => {
            this.showSuccess = false;
          }, 3500);
        } else {
          this.toastService.error('No students were imported.');
        }
      }
    };
    reader.readAsBinaryString(this.importFile);
  }

  private readImportValue(row: any, keys: string[]): string {
    for (const key of keys) {
      const value = row[key];
      if (value !== undefined && value !== null && String(value).trim() !== '') {
        return String(value).trim();
      }
    }
    return '';
  }

  private normalizeImportValue(value: any): string {
    return String(value || '').trim().toLowerCase();
  }

  private normalizeImportDate(value: any): string {
    if (value === undefined || value === null || value === '') {
      return '';
    }

    if (typeof value === 'number') {
      const parsed = XLSX.SSF.parse_date_code(value);
      if (parsed) {
        const year = String(parsed.y).padStart(4, '0');
        const month = String(parsed.m).padStart(2, '0');
        const day = String(parsed.d).padStart(2, '0');
        return `${year}-${month}-${day}`;
      }
    }

    if (value instanceof Date && !Number.isNaN(value.getTime())) {
      return value.toISOString().split('T')[0];
    }

    const text = String(value).trim();
    if (!text) {
      return '';
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
      return text;
    }

    const slashMatch = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
    if (slashMatch) {
      let [, first, second, year] = slashMatch;
      const month = first.padStart(2, '0');
      const day = second.padStart(2, '0');
      const fullYear = year.length === 2 ? `20${year}` : year.padStart(4, '0');
      return `${fullYear}-${month}-${day}`;
    }

    const parsedDate = new Date(text);
    if (!Number.isNaN(parsedDate.getTime())) {
      return parsedDate.toISOString().split('T')[0];
    }

    return text;
  }
}
