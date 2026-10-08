import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { ViewChild } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-enquiries',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, DatePickerComponent, CustomFieldsRendererComponent, SearchableSelectComponent],
  templateUrl: './enquiries.component.html'
})
export class EnquiriesComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  enquiries: any[] = [];
  courses: any[] = [];
  courseOptionsForFilter: { id: string | number; name: string }[] = [{ id: '', name: 'All Courses' }];
  staffList: any[] = [];
  loading = false;
  saving = false;

  currentPage: number = 1;
  itemsPerPage: number = 10;

  // Filters
  searchTerm = '';
  filterStatus = '';
  filterType = '';
  filterCourse = '';

  // Enquiry Modal State
  isModalOpen = false;
  currentEnquiry: any = this.getInitialEnquiry();

  // ===== Student Enrollment Modal State =====
  isStudentModalOpen = false;
  studentSaving = false;
  convertingEnquiry: any = null; // The enquiry being converted
  studentCurrentStep: 1 | 2 = 1;
  createdStudent: any = null;
  studentCourses: any[] = [];
  batches$: Observable<any[]> | undefined;
  regSettings: any = null;
  nextRegNumber = '';
  customFields: any[] = [];
  enrollmentType: 'batch' | 'one-to-one' = 'batch';
  showStudentSuccess = false;
  successStudentName = '';

  newStudent: any = this.getInitialStudent();

  // Add Course Modal (for step 2)
  isAddCourseModalOpen = false;
  newCourseEnrollment: any = {
    courseId: '',
    batchId: '0',
    joiningDate: new Date().toISOString().split('T')[0],
    status: 'active',
    selectedSubjects: []
  };

  constructor(
    protected dataService: DataService,
    protected toastService: ToastService,
    protected router: Router,
    protected http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadEnquiries();
    this.loadCourses();
    this.loadStaff();
    this.batches$ = this.dataService.getBatches();
    this.dataService.getSettings().subscribe(s => this.regSettings = s);
    this.dataService.getCustomFields('student').subscribe(fields => {
      this.customFields = fields;
    });
  }

  getInitialEnquiry() {
    return {
      id: null,
      name: '',
      mobile: '',
      email: '',
      address: '',
      courseId: '',
      courseName: '',
      enquiryType: 'walk-in',
      status: 'new',
      followUpDate: new Date().toISOString().split('T')[0],
      assignedStaffId: '',
      assignedStaffName: '',
      referenceSource: 'walk-in',
      notes: ''
    };
  }

  getInitialStudent() {
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

  loadEnquiries() {
    this.loading = true;
    this.dataService.getEnquiries().subscribe({
      next: (data) => {
        this.enquiries = data || [];
        this.currentPage = 1;
        this.loading = false;
      },
      error: () => {
        this.toastService.error('Failed to load enquiries');
        this.loading = false;
      }
    });
  }

  loadCourses() {
    this.dataService.getCourses().subscribe({
      next: (data) => {
        this.courses = data || [];
        this.courseOptionsForFilter = [
          { id: '', name: 'All Courses' },
          ...(this.courses || []).map(c => ({ id: c.id, name: c.name }))
        ];
      }
    });
  }

  loadStaff() {
    this.dataService.getStaff().subscribe({
      next: (data) => { this.staffList = data || []; }
    });
  }

  allFilteredEnquiries(): any[] {
    return this.enquiries.filter(e => {
      const matchesSearch = !this.searchTerm ||
        (e.name && e.name.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (e.mobile && e.mobile.includes(this.searchTerm)) ||
        (e.email && e.email.toLowerCase().includes(this.searchTerm.toLowerCase())) ||
        (e.courseName && e.courseName.toLowerCase().includes(this.searchTerm.toLowerCase()));

      const matchesStatus = !this.filterStatus || e.status === this.filterStatus;
      const matchesType = !this.filterType || e.enquiryType === this.filterType;
      const matchesCourse = !this.filterCourse || String(e.courseId) === String(this.filterCourse);

      return matchesSearch && matchesStatus && matchesType && matchesCourse;
    });
  }

  filteredEnquiries(): any[] {
    const list = this.allFilteredEnquiries();
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return list.slice(start, start + this.itemsPerPage);
  }

  onFilterChange() {
    this.currentPage = 1;
  }

  totalPages(): number {
    return Math.ceil(this.allFilteredEnquiries().length / this.itemsPerPage) || 1;
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  getStartCount(): number {
    const total = this.allFilteredEnquiries().length;
    if (total === 0) return 0;
    return (this.currentPage - 1) * this.itemsPerPage + 1;
  }

  getEndCount(): number {
    const total = this.allFilteredEnquiries().length;
    return Math.min(this.currentPage * this.itemsPerPage, total);
  }

  // Summary Metrics
  get totalCount(): number {
    return this.enquiries.length;
  }

  get newCount(): number {
    return this.enquiries.filter(e => e.status === 'new').length;
  }

  get followUpCount(): number {
    return this.enquiries.filter(e => e.status === 'follow-up' || e.status === 'in-progress').length;
  }

  get convertedCount(): number {
    return this.enquiries.filter(e => e.status === 'converted').length;
  }

  openAddModal() {
    this.currentEnquiry = this.getInitialEnquiry();
    this.isModalOpen = true;
  }

  editEnquiry(e: any) {
    this.currentEnquiry = {
      ...e,
      courseId: e.courseId ? String(e.courseId) : '',
      assignedStaffId: e.assignedStaffId ? String(e.assignedStaffId) : '',
      followUpDate: e.followUpDate || new Date().toISOString().split('T')[0]
    };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
  }

  onCourseChange() {
    if (this.currentEnquiry.courseId) {
      const selected = this.courses.find(c => String(c.id) === String(this.currentEnquiry.courseId));
      if (selected) {
        this.currentEnquiry.courseName = selected.name;
      }
    }
  }

  onStaffChange() {
    if (this.currentEnquiry.assignedStaffId) {
      const selected = this.staffList.find(s => String(s.id) === String(this.currentEnquiry.assignedStaffId));
      if (selected) {
        this.currentEnquiry.assignedStaffName = selected.name;
      }
    }
  }

  saveEnquiry() {
    if (!this.currentEnquiry.name || !this.currentEnquiry.name.trim()) {
      this.toastService.warning('Please enter customer/candidate name.');
      return;
    }

    this.saving = true;
    if (this.currentEnquiry.id) {
      this.dataService.updateEnquiry(this.currentEnquiry.id, this.currentEnquiry).subscribe({
        next: () => {
          this.toastService.success('Enquiry updated successfully!');
          this.saving = false;
          this.isModalOpen = false;
          this.loadEnquiries();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to update enquiry.');
          this.saving = false;
        }
      });
    } else {
      this.dataService.createEnquiry(this.currentEnquiry).subscribe({
        next: () => {
          this.toastService.success('New enquiry logged successfully!');
          this.saving = false;
          this.isModalOpen = false;
          this.loadEnquiries();
        },
        error: (err) => {
          this.toastService.error(err.error?.message || 'Failed to create enquiry.');
          this.saving = false;
        }
      });
    }
  }

  changeStatus(e: any, newStatus: string) {
    this.dataService.updateEnquiryStatus(e.id, newStatus).subscribe({
      next: () => {
        e.status = newStatus;
        this.toastService.success(`Status updated to '${newStatus}'`);
      },
      error: () => this.toastService.error('Failed to update status')
    });
  }

  deleteEnquiry(e: any) {
    if (!confirm(`Are you sure you want to delete enquiry for "${e.name}"?`)) return;
    this.dataService.deleteEnquiry(e.id).subscribe({
      next: () => {
        this.toastService.success('Enquiry record deleted.');
        this.loadEnquiries();
      },
      error: () => this.toastService.error('Failed to delete enquiry.')
    });
  }

  getWhatsAppUrl(mobile: string): string {
    if (!mobile) return '';
    const cleanNumber = mobile.replace(/\D/g, '');
    const formatted = cleanNumber.length === 10 ? '91' + cleanNumber : cleanNumber;
    return `https://wa.me/${formatted}`;
  }

  // ===== Convert to Student: Open enrollment modal with prefilled data =====
  convertToStudent(e: any) {
    this.convertingEnquiry = e;
    this.newStudent = this.getInitialStudent();
    this.enrollmentType = 'batch';
    this.studentCurrentStep = 1;
    this.createdStudent = null;
    this.studentCourses = [];

    // Pre-fill from enquiry data
    this.newStudent.name = e.name || '';
    this.newStudent.mobile = e.mobile || '';
    this.newStudent.email = e.email || '';
    this.newStudent.courseId = e.courseId ? String(e.courseId) : '';

    // Load next reg number if auto mode
    if (!this.regSettings || this.regSettings.reg_mode === 'auto' || !this.regSettings.reg_mode) {
      this.dataService.getNextRegNumber().subscribe(res => {
        this.nextRegNumber = res.next;
        this.newStudent.regNumber = res.next;
      });
    } else {
      this.nextRegNumber = '';
      this.newStudent.regNumber = '';
    }

    this.isStudentModalOpen = true;
  }

  closeStudentModal() {
    this.isStudentModalOpen = false;
    this.studentCurrentStep = 1;
    this.convertingEnquiry = null;
  }

  // Photo handling
  onPhotoChange(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.resizeAndCompressImage(file, 300, 300, 0.7)
        .then(base64 => {
          this.newStudent.photo = base64;
        })
        .catch(() => {
          this.toastService.error('Error processing photo');
        });

      const formData = new FormData();
      formData.append('image', file);
      if (this.newStudent.id) {
        formData.append('student_id', this.newStudent.id.toString());
      }
      this.http.post<any>('/api/institute/upload_student_image', formData).subscribe({
        next: (res: any) => {
          if (res && res.data && res.data.path) {
            this.newStudent.photo = res.data.path;
          }
        },
        error: () => { }
      });
    }
  }

  removePhoto() {
    this.newStudent.photo = '';
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
            if (width > maxWidth) { height = Math.round((height * maxWidth) / width); width = maxWidth; }
          } else {
            if (height > maxHeight) { width = Math.round((width * maxHeight) / height); height = maxHeight; }
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
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

  // Step 1 → Step 2: Save student profile
  goToStudentStep2() {
    if (this.studentSaving) return;
    if (!this.newStudent.name || !this.newStudent.name.trim()) {
      this.toastService.warning('Please enter Student Name.');
      return;
    }
    if (!this.newStudent.mobile || !this.newStudent.mobile.trim()) {
      this.toastService.warning('Please enter Personal Mobile.');
      return;
    }
    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    if (this.customFieldsRenderer) {
      this.newStudent.custom_fields = this.customFieldsRenderer.getValues();
    }

    const payload = { ...this.newStudent };
    payload.selectedSubjects = JSON.stringify(payload.selectedSubjects || []);
    if (!payload.id) delete payload.id;
    if (!payload.courseId || payload.courseId === '') delete payload.courseId;
    if (!payload.batchId || payload.batchId === '' || payload.batchId === '0') delete payload.batchId;

    this.studentSaving = true;
    this.dataService.addStudent(payload).subscribe({
      next: (res: any) => {
        this.studentSaving = false;
        const studentObj = res.data || res.student || { ...payload, id: res.id || payload.id };
        this.createdStudent = studentObj;
        this.loadStudentCourses(studentObj.id);
        this.studentCurrentStep = 2;
        this.toastService.success('Student profile saved! You can now add course(s).');

        // Mark the enquiry as converted
        if (this.convertingEnquiry?.id) {
          this.dataService.updateEnquiryStatus(this.convertingEnquiry.id, 'converted').subscribe({
            next: () => {
              this.convertingEnquiry.status = 'converted';
              this.loadEnquiries();
            },
            error: () => { }
          });
        }
      },
      error: (err: any) => {
        this.studentSaving = false;
        this.toastService.error(err.error?.message || 'Error saving student profile.');
      }
    });
  }

  loadStudentCourses(studentId: any) {
    if (!studentId) return;
    this.dataService.getStudentCourses(studentId).subscribe({
      next: (courses) => { this.studentCourses = courses; },
      error: () => { this.studentCourses = []; }
    });
  }

  finishStudentWizard() {
    const name = this.createdStudent?.name || this.newStudent.name || 'New Student';
    this.closeStudentModal();
    this.showStudentSuccess = true;
    this.successStudentName = name;
    setTimeout(() => {
      this.showStudentSuccess = false;
    }, 3500);
  }

  onStudentEnrollmentTypeChange() {
    if (this.enrollmentType === 'one-to-one') {
      this.newStudent.batchId = '0';
    } else {
      this.newStudent.batchId = '';
    }
  }

  onStudentCourseChange() {
    if (this.enrollmentType === 'batch') {
      this.newStudent.batchId = '';
    }
  }

  getFilteredBatches(batches: any[] | null): any[] {
    if (!batches) return [];
    return batches.filter(b => String(b.courseId) === String(this.newStudent.courseId));
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
    } catch { return []; }
  }

  isSubjectSelected(subjectName: string): boolean {
    return (this.newStudent.selectedSubjects || []).includes(subjectName);
  }

  toggleSubjectSelection(subjectName: string) {
    if (!this.newStudent.selectedSubjects) this.newStudent.selectedSubjects = [];
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
    return subjects.every(s => (this.newStudent.selectedSubjects || []).includes(s.name));
  }

  toggleSelectAllSubjects() {
    const subjects = this.getSubjectsForCurrentCourse();
    if (this.areAllSubjectsSelected()) {
      this.newStudent.selectedSubjects = [];
    } else {
      this.newStudent.selectedSubjects = subjects.map(s => s.name);
    }
  }

  getSelectedSubjectsSum(): number {
    const selected = this.newStudent.selectedSubjects || [];
    const subjects = this.getSubjectsForCurrentCourse();
    return subjects.reduce((sum: number, s: any) => {
      if (selected.includes(s.name)) return sum + (Number(s.fees) || 0);
      return sum;
    }, 0);
  }

  // Add Course Modal (Step 2)
  openAdditionalCourseModal() {
    this.newCourseEnrollment = {
      courseId: '',
      batchId: '0',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'active',
      selectedSubjects: []
    };
    this.isAddCourseModalOpen = true;
  }

  closeAdditionalCourseModal() {
    this.isAddCourseModalOpen = false;
  }

  onAdditionalCourseChange() {
    this.newCourseEnrollment.batchId = '0';
    this.newCourseEnrollment.selectedSubjects = [];
  }

  getAdditionalCourseFilteredBatches(batches: any[] | null): any[] {
    if (!batches) return [];
    return batches.filter(b => String(b.courseId) === String(this.newCourseEnrollment.courseId));
  }

  getAdditionalSelectedCourse(): any {
    return this.courses.find(c => String(c.id) === String(this.newCourseEnrollment.courseId));
  }

  isAdditionalCourseStandard(): boolean {
    const c = this.getAdditionalSelectedCourse();
    return !!(c && (c.courseType === 'standard' || c.course_type === 'standard'));
  }

  getSubjectsForAdditionalCourse(): any[] {
    const c = this.getAdditionalSelectedCourse();
    if (!c || !c.subjects) return [];
    if (Array.isArray(c.subjects)) return c.subjects;
    try {
      const parsed = JSON.parse(c.subjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  }

  isAdditionalSubjectSelected(name: string): boolean {
    return (this.newCourseEnrollment.selectedSubjects || []).includes(name);
  }

  toggleAdditionalSubject(name: string) {
    if (!this.newCourseEnrollment.selectedSubjects) this.newCourseEnrollment.selectedSubjects = [];
    const idx = this.newCourseEnrollment.selectedSubjects.indexOf(name);
    if (idx > -1) {
      this.newCourseEnrollment.selectedSubjects.splice(idx, 1);
    } else {
      this.newCourseEnrollment.selectedSubjects.push(name);
    }
  }

  enrollAdditionalCourse() {
    if (!this.newCourseEnrollment.courseId) {
      this.toastService.warning('Please select a course.');
      return;
    }
    const studentId = this.createdStudent?.id;
    if (!studentId) return;

    const payload = {
      ...this.newCourseEnrollment,
      selectedSubjects: JSON.stringify(this.newCourseEnrollment.selectedSubjects || [])
    };

    this.dataService.enrollAdditionalCourse(studentId, payload).subscribe({
      next: () => {
        this.toastService.success('Student enrolled in course successfully!');
        this.isAddCourseModalOpen = false;
        this.loadStudentCourses(studentId);
      },
      error: (err) => this.toastService.error(err.error?.message || 'Failed to enroll in course.')
    });
  }

  unenrollFromCourse(courseId: string | number) {
    const studentId = this.createdStudent?.id;
    const courseName = this.studentCourses.find(sc => String(sc.course_id) === String(courseId))?.course_name || 'this course';
    if (!confirm(`Remove student from "${courseName}"?`)) return;
    this.dataService.unenrollFromCourse(studentId, courseId).subscribe({
      next: () => {
        this.toastService.success('Student unenrolled from course.');
        this.loadStudentCourses(studentId);
      },
      error: (err) => this.toastService.error(err.error?.message || 'Could not unenroll student.')
    });
  }

  isCourseAlreadyEnrolled(courseId: string | number): boolean {
    return this.studentCourses.some(sc => String(sc.course_id) === String(courseId));
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'new': return 'bg-sky-100 text-sky-700 dark:bg-sky-950/50 dark:text-sky-400 border-sky-200 dark:border-sky-800';
      case 'in-progress': return 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400 border-blue-200 dark:border-blue-800';
      case 'follow-up': return 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border-amber-200 dark:border-amber-800';
      case 'converted': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800';
      case 'closed': return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border-slate-200 dark:border-slate-700';
      default: return 'bg-slate-100 text-slate-600';
    }
  }

  getTypeBadgeClass(type: string): string {
    switch (type) {
      case 'walk-in': return 'bg-purple-100 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';
      case 'phone': return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300';
      case 'online': return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-300';
      case 'referral': return 'bg-teal-100 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  }
}
