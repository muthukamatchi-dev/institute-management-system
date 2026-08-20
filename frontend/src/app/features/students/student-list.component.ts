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
  courses: Course[] = [];
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

  selectedStudentDetails: any = null;
  isDetailsModalOpen = false;

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
    this.courses$.subscribe(data => this.courses = data);
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
      courseId: '',
      batchId: '0',
      joiningDate: new Date().toISOString().split('T')[0],
      feeStatus: 'pending',
      status: 'active',
      referredBy: '',
      referralProfession: '',
      selectedSubjects: [],
      photo: ''
    };
  }

  resizeAndCompressImage(file: File, maxWidth: number, maxHeight: number, quality: number): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (event: any) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }
          } else {
            if (height > maxHeight) {
              width = Math.round((width * maxHeight) / height);
              height = maxHeight;
            }
          }

          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
            resolve(compressedBase64);
          } else {
            reject(new Error('Failed to get 2D context'));
          }
        };
        img.src = event.target.result;
      };
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  }

  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.resizeAndCompressImage(file, 300, 300, 0.7)
        .then(base64 => {
          this.newStudent.photo = base64;
        })
        .catch(err => {
          this.toastService.error('Error processing photo');
          console.error(err);
        });
    }
  }

  removePhoto() {
    this.newStudent.photo = '';
  }

  viewStudentDetails(student: any) {
    this.selectedStudentDetails = student;
    this.isDetailsModalOpen = true;
  }

  closeDetailsModal() {
    this.selectedStudentDetails = null;
    this.isDetailsModalOpen = false;
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http') || imagePath.startsWith('data:')) return imagePath;
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `${this.dataService.getServerUrl()}/${normalizedPath}`;
  }

  printIDCard() {
    const printContent = document.getElementById('student-id-card');
    if (!printContent) return;
    const windowUrl = 'about:blank';
    const uniqueName = new Date().getTime();
    const windowName = 'Print' + uniqueName;
    const prtWindow = window.open(windowUrl, windowName, 'left=100,top=100,width=450,height=650');
    if (prtWindow) {
      prtWindow.document.write(`
        <html>
          <head>
            <title>Print ID Card</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              body { margin: 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; background-color: #0f172a; }
            </style>
          </head>
          <body>
            <div class="scale-110">
              ${printContent.outerHTML}
            </div>
            <script>
              window.onload = function() {
                setTimeout(function() {
                  window.print();
                  window.close();
                }, 500);
              }
            </script>
          </body>
        </html>
      `);
      prtWindow.document.close();
      prtWindow.focus();
    }
  }

  totalElements: number = 0;
  serverTotalPages: number = 1;

  loadStudents() {
    this.dataService.getPagedStudents(this.currentPage, this.itemsPerPage, this.searchTerm, this.filterCourse, this.filterStatus)
      .subscribe(res => {
        this.students = res.content;
        this.totalElements = res.totalElements;
        this.serverTotalPages = res.totalPages;
      });
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadStudents();
  }

  filteredStudents() {
    return this.students;
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
    if (!this.students || this.students.length === 0) return [];
    const sorted = [...this.students];
    if (this.sortColumn) {
      sorted.sort((a: any, b: any) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sorted;
  }

  totalPages() {
    return this.serverTotalPages || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.loadStudents();
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadStudents();
    }
  }

  getStartCount() {
    if (this.totalElements === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndCount() {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalElements);
  }

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

  onEnrollmentTypeChange() {
    if (this.enrollmentType === 'one-to-one') {
      this.newStudent.batchId = '0';
    } else {
      this.newStudent.batchId = '';
    }
  }

  onCourseChange() {
    if (this.enrollmentType === 'batch') {
      this.newStudent.batchId = '';
    }
  }

  getFilteredBatches(batches: any[] | null): any[] {
    if (!batches) return [];
    return batches.filter(b => String(b.courseId) === String(this.newStudent.courseId));
  }

  editStudent(student: Student) {
    this.newStudent = {
      ...student,
      selectedSubjects: this.parseStudentSubjects(student.selectedSubjects)
    };
    // If it has a batch, show batchwise, otherwise if it's strictly course-only (0 or null batch) show one-to-one
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

    const payload = { ...this.newStudent };
    payload.selectedSubjects = JSON.stringify(payload.selectedSubjects || []);

    if (this.enrollmentType === 'batch') {
      this.batches$?.subscribe(batches => {
        if (payload.batchId && payload.batchId !== '0' && payload.batchId !== '1') {
          // Keep explicit batch selection
        } else {
          const selectedBatch = (batches || []).find(b => String(b.courseId) === String(payload.courseId));
          if (selectedBatch) {
            payload.batchId = selectedBatch.id;
          } else {
            payload.batchId = '0';
          }
        }
        this.executeSave(payload);
      });
    } else {
      payload.batchId = '0';
      this.executeSave(payload);
    }
  }

  private executeSave(payload: any) {
    this.dataService.addStudent(payload).subscribe({
      next: () => {
        this.toastService.success(payload.id ? 'Student record updated' : 'New student enrolled successfully');
        this.loadStudents();
        this.closeModal();

        // Show success celebration
        this.showSuccess = true;
        this.successStudentName = payload.name || 'New Student';
        setTimeout(() => {
          this.showSuccess = false;
        }, 3500);
      },
      error: (err) => {
        this.toastService.error(err.error?.message || 'Error saving student. Please try again.');
      }
    });
  }

  getSelectedCourse() {
    return this.courses.find(c => String(c.id) === String(this.newStudent.courseId));
  }

  isCurrentCourseStandard(): boolean {
    const c = this.getSelectedCourse();
    return !!(c && (c.courseType === 'standard' || c.course_type === 'standard'));
  }

  getSubjectsForCurrentCourse(): any[] {
    const c = this.getSelectedCourse();
    if (!c || !c.subjects) return [];
    if (Array.isArray(c.subjects)) return c.subjects;
    try {
      const parsed = JSON.parse(c.subjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  isSubjectSelected(subjectName: string): boolean {
    const selected = this.newStudent.selectedSubjects || [];
    return selected.includes(subjectName);
  }

  toggleSubjectSelection(subjectName: string) {
    if (!this.newStudent.selectedSubjects) {
      this.newStudent.selectedSubjects = [];
    }
    const index = this.newStudent.selectedSubjects.indexOf(subjectName);
    if (index > -1) {
      this.newStudent.selectedSubjects.splice(index, 1);
    } else {
      this.newStudent.selectedSubjects.push(subjectName);
    }
  }

  areAllSubjectsSelected(): boolean {
    const subjects = this.getSubjectsForCurrentCourse();
    if (subjects.length === 0) return false;
    const selected = this.newStudent.selectedSubjects || [];
    return subjects.every(s => selected.includes(s.name));
  }

  toggleSelectAllSubjects() {
    const subjects = this.getSubjectsForCurrentCourse();
    const allSelected = this.areAllSubjectsSelected();
    if (allSelected) {
      this.newStudent.selectedSubjects = [];
    } else {
      this.newStudent.selectedSubjects = subjects.map(s => s.name);
    }
  }

  getSelectedSubjectsSum(): number {
    const selected = this.newStudent.selectedSubjects || [];
    const subjects = this.getSubjectsForCurrentCourse();
    return subjects.reduce((sum, s) => {
      if (selected.includes(s.name)) {
        return sum + (Number(s.fees) || 0);
      }
      return sum;
    }, 0);
  }

  parseStudentSubjects(rawSubjects: any): any[] {
    if (!rawSubjects) return [];
    if (Array.isArray(rawSubjects)) return rawSubjects;
    try {
      const parsed = JSON.parse(rawSubjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (typeof rawSubjects === 'string') {
        return rawSubjects.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    }
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

          // Parse course subjects if standard course
          let courseSubjects: any[] = [];
          if (course.subjects) {
            if (Array.isArray(course.subjects)) {
              courseSubjects = course.subjects;
            } else {
              try {
                const parsed = JSON.parse(course.subjects);
                if (Array.isArray(parsed)) courseSubjects = parsed;
              } catch {}
            }
          }

          const subjectsVal = this.readImportValue(row, ['Subjects', 'subjects', 'Selected Subjects', 'selected_subjects', 'Subject', 'subject']);
          let selectedSubjects: string[] = [];
          if (course.courseType === 'standard' || course.course_type === 'standard') {
            if (subjectsVal) {
              if (subjectsVal.trim().toLowerCase() === 'all') {
                selectedSubjects = courseSubjects.map((s: any) => s.name);
              } else {
                const importSubjectNames = subjectsVal.split(',').map((s: string) => s.trim().toLowerCase()).filter(Boolean);
                selectedSubjects = courseSubjects
                  .filter((s: any) => importSubjectNames.includes(s.name.trim().toLowerCase()))
                  .map((s: any) => s.name);
              }
            } else {
              // Default to all subjects of the course if none specified
              selectedSubjects = courseSubjects.map((s: any) => s.name);
            }
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
              || new Date().toISOString().split('T')[0],
            selectedSubjects: JSON.stringify(selectedSubjects)
          };

          // Map Custom Fields
          const customValues: any = {};
          this.customFields.forEach(cf => {
            if (row[cf.field_label] !== undefined) {
              customValues[cf.id] = row[cf.field_label];
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
