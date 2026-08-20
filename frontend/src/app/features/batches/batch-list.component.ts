import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Batch, Course, Staff } from '../../models';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { Observable } from 'rxjs';
import { ToastService } from '../../services/toast.service';

import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ModalComponent, FormsModule, CustomFieldsRendererComponent],
  templateUrl: 'batch-list.component.html'
})
export class BatchListComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  batches: Batch[] = [];
  courses: Course[] = [];
  staffList: Staff[] = [];
  searchTerm = '';
  statusFilter = 'all';
  courseFilter = 'all';
  subjectFilter = 'all';
  sortColumn = 'startDate';
  sortDirection: 'asc' | 'desc' = 'desc';
  isModalOpen = false;
  isDetailsModalOpen = false;
  editingBatch = false;
  selectedBatch: Batch | null = null;
  viewMode: 'batch' | 'one-to-one' = 'batch';
  oneToOneGroups: any[] = [];
  oneToOneSearchTerm = '';
  oneToOneStatusFilter = 'all';
  oneToOneTimingFilter = '';
  oneToOneTotalGroupsCount = 0;
  diagnosticLog: string[] = [];

  // Student selection for Batch Mode
  allStudents: any[] = [];
  selectedStudentIds: string[] = [];
  studentSearchTerm = '';
  selectedBatchStudents: any[] = [];

  newBatch: any = {
    batchName: '',
    courseId: '',
    subject: '',
    instructor: '',
    timing: '',
    startDate: '',
    status: 'upcoming',
    students: []
  };

  constructor(private dataService: DataService, private router: Router, private toastService: ToastService) { }

  ngOnInit() {
    this.loadBatches();
    this.loadStudents();
    this.dataService.getCourses().subscribe(data => {
      this.courses = data;
      if (this.viewMode === 'one-to-one') {
        this.calculateOneToOneGroups();
      }
    });
    this.dataService.getStaff().subscribe(data => this.staffList = data);
  }

  loadBatches() {
    this.dataService.getBatches().subscribe(data => {
      this.batches = data;
      if (this.viewMode === 'one-to-one') {
        this.calculateOneToOneGroups();
      }
    });
  }

  loadStudents() {
    this.dataService.getStudents().subscribe(data => {
      // Only uncompleted students
      this.allStudents = data.filter(s => s.status !== 'completed').map(student => {
        const parsed = this.parseTimingRange(student.timing);
        return {
          ...student,
          timingFrom: parsed.from,
          timingTo: parsed.to
        };
      });
      this.calculateOneToOneGroups();
    });
  }

  // Pagination properties
  batchCurrentPage = 1;
  batchItemsPerPage = 10;
  oneToOneCurrentPage = 1;
  oneToOneItemsPerPage = 10;

  getFilteredOneToOneStudents() {
    const search = this.oneToOneSearchTerm.toLowerCase();
    const timingSearch = this.oneToOneTimingFilter.toLowerCase();

    return this.allStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search) ||
        (s.instructor && s.instructor.toLowerCase().includes(search)) ||
        (s.instructorName && s.instructorName.toLowerCase().includes(search)) ||
        (s.regNumber && s.regNumber.toLowerCase().includes(search));

      const matchesStatus = this.oneToOneStatusFilter === 'all' ? true : s.status === this.oneToOneStatusFilter;
      const matchesCourse = this.courseFilter === 'all' ? true : s.courseId == this.courseFilter;
      const matchesTiming = s.timing ? s.timing.toLowerCase().includes(timingSearch) : (timingSearch === '' ? true : false);

      return matchesSearch && matchesStatus && matchesTiming && matchesCourse;
    });
  }

  calculateOneToOneGroups() {
    const oneToOnes = this.getFilteredOneToOneStudents();
    this.diagnosticLog = [];
    this.diagnosticLog.push(`oneToOnes count: ${oneToOnes.length}`);
    this.diagnosticLog.push(`allStudents count: ${this.allStudents.length}`);
    this.diagnosticLog.push(`courses count: ${this.courses.length}`);
    this.diagnosticLog.push(`batches count: ${this.batches.length}`);
    this.diagnosticLog.push(`courseFilter: ${this.courseFilter}`);
    this.diagnosticLog.push(`subjectFilter: ${this.subjectFilter}`);

    const grouped = new Map<string, any[]>();
    oneToOnes.forEach(s => {
      const c = this.courses.find(course => String(course.id) === String(s.courseId));
      const isStandard = !!(c && (c.courseType === 'standard' || c.course_type === 'standard'));
      this.diagnosticLog.push(`Student: ${s.name}, courseId: ${s.courseId}, foundCourse: ${!!c}, isStandard: ${isStandard}`);

      if (isStandard) {
        // Find if this student is already assigned to a batch, and what subject that batch is for
        const studentBatchSubjects = s.batchSubjects || [];
        this.diagnosticLog.push(`Student: ${s.name}, batchIds: ${JSON.stringify(s.batchIds)}, batchSubjects: ${JSON.stringify(studentBatchSubjects)}`);

        let subjects = this.parseStudentSubjects(s.selectedSubjects || s.selected_subjects);
        this.diagnosticLog.push(`Student: ${s.name}, parsed subjects: ${JSON.stringify(subjects)}`);
        if (!subjects || subjects.length === 0) {
          // Default to all subjects defined on the course
          subjects = this.getSubjectsForCourse(c).map(sub => typeof sub === 'string' ? sub : sub.name);
          this.diagnosticLog.push(`Student: ${s.name}, fallback subjects: ${JSON.stringify(subjects)}`);
        }

        if (subjects && subjects.length > 0) {
          subjects.forEach(sub => {
            // Skip the subject if the student is already assigned to a batch for it
            const hasThisSubject = studentBatchSubjects.some((bs: string) => bs.trim().toLowerCase() === sub.trim().toLowerCase());
            if (hasThisSubject) {
              this.diagnosticLog.push(`Student: ${s.name}, skipping ${sub} because they are already assigned to a batch for it`);
              return;
            }
            if (this.subjectFilter !== 'all' && sub.trim().toLowerCase() !== this.subjectFilter.trim().toLowerCase()) {
              return;
            }
            const groupKey = `${s.courseName || 'General'} > ${sub}`;
            const list = grouped.get(groupKey) || [];

            // Retrieve subject-specific allocations
            let subjectInstructor = s.instructor;
            let subjectTiming = s.timing;
            let subjectTimingFrom = s.timingFrom;
            let subjectTimingTo = s.timingTo;
            let subjectStartDate = s.startDate;
            let subjectStatus = s.status;

            if (s.subjectAllocations) {
              try {
                const allocs = typeof s.subjectAllocations === 'string' ? JSON.parse(s.subjectAllocations) : s.subjectAllocations;
                if (allocs && allocs[sub]) {
                  const alloc = allocs[sub];
                  subjectInstructor = alloc.instructor || '';
                  subjectTiming = alloc.timing || '';
                  const parsedTime = this.parseTimingRange(subjectTiming);
                  subjectTimingFrom = parsedTime.from;
                  subjectTimingTo = parsedTime.to;
                  subjectStartDate = alloc.startDate || '';
                  subjectStatus = alloc.status || 'active';
                }
              } catch (e) {
                console.error('Error parsing subject allocations', e);
              }
            }

            list.push({ 
              ...s, 
              currentAllocatedSubject: sub,
              instructor: subjectInstructor,
              timing: subjectTiming,
              timingFrom: subjectTimingFrom,
              timingTo: subjectTimingTo,
              startDate: subjectStartDate,
              status: subjectStatus
            });
            grouped.set(groupKey, list);
          });
        } else {
          // If no subjects are selected/available, skip if they are in any batch
          const hasBatches = s.batchIds && s.batchIds.length > 0;
          if (hasBatches || (s.batchId && s.batchId !== '0')) {
            return;
          }
          if (this.subjectFilter === 'all') {
            const groupKey = s.courseName || 'General';
            const list = grouped.get(groupKey) || [];
            list.push({ ...s });
            grouped.set(groupKey, list);
          }
        }
      } else {
        // For non-standard courses, if they are assigned to a batch, skip them
        const hasBatches = s.batchIds && s.batchIds.length > 0;
        if (hasBatches || (s.batchId && s.batchId !== '0')) {
          return;
        }
        const groupKey = s.courseName || 'General';
        const list = grouped.get(groupKey) || [];
        list.push({ ...s });
        grouped.set(groupKey, list);
      }
    });

    const allGroups = Array.from(grouped.entries()).map(([course, students]) => ({ course, students }));
    this.diagnosticLog.push(`allGroups count: ${allGroups.length}`);
    allGroups.forEach(g => {
      this.diagnosticLog.push(`Group: ${g.course}, students: ${g.students.map(st => st.name).join(', ')}`);
    });
    
    // Sort groups alphabetically by course/subject name so that the order is stable
    allGroups.sort((a, b) => a.course.localeCompare(b.course));

    this.oneToOneTotalGroupsCount = allGroups.length;

    const start = (this.oneToOneCurrentPage - 1) * this.oneToOneItemsPerPage;
    this.oneToOneGroups = allGroups.slice(start, start + this.oneToOneItemsPerPage);
  }

  oneToOneTotalPages() {
    return Math.ceil(this.oneToOneTotalGroupsCount / this.oneToOneItemsPerPage) || 1;
  }

  oneToOneNextPage() {
    if (this.oneToOneCurrentPage < this.oneToOneTotalPages()) {
      this.oneToOneCurrentPage++;
      this.calculateOneToOneGroups();
    }
  }

  oneToOnePrevPage() {
    if (this.oneToOneCurrentPage > 1) {
      this.oneToOneCurrentPage--;
      this.calculateOneToOneGroups();
    }
  }

  getOneToOneStartCount() {
    if (this.oneToOneTotalGroupsCount === 0) return 0;
    return (this.oneToOneCurrentPage - 1) * this.oneToOneItemsPerPage + 1;
  }

  getOneToOneEndCount() {
    return Math.min(this.oneToOneCurrentPage * this.oneToOneItemsPerPage, this.oneToOneTotalGroupsCount);
  }

  paginatedBatches() {
    const filtered = this.filteredBatches();
    const start = (this.batchCurrentPage - 1) * this.batchItemsPerPage;
    return filtered.slice(start, start + this.batchItemsPerPage);
  }

  batchTotalPages() {
    return Math.ceil(this.filteredBatches().length / this.batchItemsPerPage) || 1;
  }

  batchNextPage() {
    if (this.batchCurrentPage < this.batchTotalPages()) this.batchCurrentPage++;
  }

  batchPrevPage() {
    if (this.batchCurrentPage > 1) this.batchCurrentPage--;
  }

  getBatchStartCount() {
    if (this.filteredBatches().length === 0) return 0;
    return (this.batchCurrentPage - 1) * this.batchItemsPerPage + 1;
  }

  getBatchEndCount() {
    return Math.min(this.batchCurrentPage * this.batchItemsPerPage, this.filteredBatches().length);
  }

  onFilterChange() {
    this.batchCurrentPage = 1;
    this.oneToOneCurrentPage = 1;
    this.calculateOneToOneGroups();
  }

  switchMode(mode: 'batch' | 'one-to-one') {
    this.viewMode = mode;
    this.batchCurrentPage = 1;
    this.oneToOneCurrentPage = 1;
    if (mode === 'one-to-one') {
      this.calculateOneToOneGroups();
    }
  }

  getFilteredStudents() {
    if (this.isCurrentCourseStandard() && !this.newBatch.subject) {
      return [];
    }
    const search = this.studentSearchTerm.toLowerCase();
    return this.allStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search) || (s.regNumber && s.regNumber.toLowerCase().includes(search));
      const matchesCourse = this.newBatch.courseId ? s.courseId == this.newBatch.courseId : true;

      // In standard courses, a student is available if they are not in any batch for this subject,
      // or if they are already in THIS batch we are editing.
      let isAvailable = true;
      if (this.isCurrentCourseStandard() && this.newBatch.subject) {
        const studentBatchSubjects = s.batchSubjects || [];
        const isAlreadyInThisBatch = s.batchIds && s.batchIds.map((bid: any) => String(bid)).includes(String(this.newBatch.id));
        const hasThisSubject = studentBatchSubjects.some((sub: string) => sub.trim().toLowerCase() === this.newBatch.subject.trim().toLowerCase());
        
        if (hasThisSubject && !isAlreadyInThisBatch) {
          isAvailable = false;
        }
      } else {
        // Non-standard courses: student is available if they have no batches, or are in this batch
        isAvailable = !s.batchId || s.batchId == '0' || (this.editingBatch && s.batchId == this.newBatch.id);
      }

      let matchesSubject = true;
      if (this.isCurrentCourseStandard() && this.newBatch.subject) {
        const studentSubjects = this.parseStudentSubjects(s.selectedSubjects || s.selected_subjects);
        matchesSubject = studentSubjects.includes(this.newBatch.subject);
      }

      return matchesSearch && matchesCourse && matchesSubject && isAvailable;
    });
  }

  isCurrentCourseStandard(): boolean {
    if (!this.newBatch.courseId) return false;
    const c = this.courses.find(course => String(course.id) === String(this.newBatch.courseId));
    return !!(c && (c.courseType === 'standard' || c.course_type === 'standard'));
  }

  shouldShowInBatchBadge(s: any): boolean {
    if (!s.batchId || s.batchId === '0' || String(s.batchId) === String(this.newBatch.id)) {
      return false;
    }
    if (this.isCurrentCourseStandard() && this.newBatch.subject) {
      const studentBatchSubjects = s.batchSubjects || [];
      const isAlreadyInThisBatch = s.batchIds && s.batchIds.map((bid: any) => String(bid)).includes(String(this.newBatch.id));
      const hasThisSubject = studentBatchSubjects.some((sub: string) => sub.trim().toLowerCase() === this.newBatch.subject.trim().toLowerCase());
      return hasThisSubject && !isAlreadyInThisBatch;
    }
    return true; // Non-standard courses: show if they are in any other batch
  }

  getStudentConflictBatchName(s: any): string {
    if (this.isCurrentCourseStandard() && this.newBatch.subject) {
      if (s.batchIds) {
        for (const bid of s.batchIds) {
          const b = this.batches.find(batch => String(batch.id) === String(bid));
          if (b && b.subject && b.subject.trim().toLowerCase() === this.newBatch.subject.trim().toLowerCase()) {
            return b.batchName;
          }
        }
      }
    }
    return s.batchName || '';
  }

  getSubjectsForCurrentCourse(): any[] {
    if (!this.newBatch.courseId) return [];
    const c = this.courses.find(course => String(course.id) === String(this.newBatch.courseId));
    if (!c || !c.subjects) return [];
    if (Array.isArray(c.subjects)) return c.subjects;
    try {
      const parsed = JSON.parse(c.subjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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

  toggleStudentSelection(studentId: string) {
    const index = this.selectedStudentIds.indexOf(studentId);
    if (index > -1) {
      this.selectedStudentIds.splice(index, 1);
    } else {
      this.selectedStudentIds.push(studentId);
    }
  }

  saveAllocation(student: any) {
    if ((student.timingFrom && !student.timingTo) || (!student.timingFrom && student.timingTo)) {
      this.toastService.warning('Please provide both From and To times for Timing');
      return;
    }

    if (student.timingFrom && student.timingTo) {
      const fromFormatted = this.formatSingleTime(student.timingFrom);
      const toFormatted = this.formatSingleTime(student.timingTo);
      student.timing = `${fromFormatted} - ${toFormatted}`;
    } else {
      student.timing = '';
    }

    // Update subjectAllocations JSON if this is a standard subject allocation
    if (student.currentAllocatedSubject) {
      let allocs: any = {};
      if (student.subjectAllocations) {
        try {
          allocs = typeof student.subjectAllocations === 'string' ? JSON.parse(student.subjectAllocations) : student.subjectAllocations;
        } catch {
          allocs = {};
        }
      }
      allocs[student.currentAllocatedSubject] = {
        instructor: student.instructor,
        timing: student.timing,
        startDate: student.startDate,
        status: student.status
      };
      student.subjectAllocations = JSON.stringify(allocs);
    }

    this.dataService.updateAllocation(student).subscribe({
      next: () => {
        this.toastService.success(`Allocation saved for ${student.name}`);
        this.loadStudents(); // Refresh data
      },
      error: () => this.toastService.error('Failed to save allocation')
    });
  }

  filteredBatches() {
    let filtered = this.batches.filter(b => {
      const matchesSearch = b.batchName.toLowerCase().includes(this.searchTerm.toLowerCase());
      let matchesStatus = false;
      if (this.statusFilter === 'all') {
        matchesStatus = true;
      } else if (this.statusFilter === 'uncompleted') {
        matchesStatus = b.status === 'ongoing' || b.status === 'upcoming';
      } else {
        matchesStatus = b.status === this.statusFilter;
      }

      const matchesCourse = this.courseFilter === 'all' ? true : b.courseId == this.courseFilter;

      let matchesSubject = true;
      if (this.courseFilter !== 'all' && this.isFilterCourseStandard() && this.subjectFilter !== 'all') {
        matchesSubject = b.subject === this.subjectFilter;
      }

      return matchesSearch && matchesStatus && matchesCourse && matchesSubject;
    });

    if (this.sortColumn) {
      filtered.sort((a: any, b: any) => {
        let valA = a[this.sortColumn];
        let valB = b[this.sortColumn];

        if (typeof valA === 'string') valA = valA.toLowerCase();
        if (typeof valB === 'string') valB = valB.toLowerCase();

        if (valA < valB) return this.sortDirection === 'asc' ? -1 : 1;
        if (valA > valB) return this.sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  }

  isFilterCourseStandard(): boolean {
    if (this.courseFilter === 'all') return false;
    const c = this.courses.find(course => String(course.id) === String(this.courseFilter));
    return !!(c && (c.courseType === 'standard' || c.course_type === 'standard'));
  }

  getSubjectsForCourse(c: any): any[] {
    if (!c || !c.subjects) return [];
    if (Array.isArray(c.subjects)) return c.subjects;
    try {
      const parsed = JSON.parse(c.subjects);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (typeof c.subjects === 'string') {
        return c.subjects.split(',').map((sub: string) => ({ name: sub.trim() })).filter(Boolean);
      }
      return [];
    }
  }

  getSubjectsForFilterCourse(): any[] {
    if (this.courseFilter === 'all') return [];
    const c = this.courses.find(course => String(course.id) === String(this.courseFilter));
    return this.getSubjectsForCourse(c);
  }

  onCourseFilterChange() {
    this.subjectFilter = 'all';
    if (this.viewMode === 'one-to-one') {
      this.calculateOneToOneGroups();
    }
  }

  onSubjectFilterChange() {
    if (this.viewMode === 'one-to-one') {
      this.calculateOneToOneGroups();
    }
  }

  sort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
  }

  openCreateModal() {
    this.editingBatch = false;
    this.newBatch = { 
      batchName: '', 
      courseId: '', 
      subject: '', 
      instructor: '', 
      timingFrom: '', 
      timingTo: '', 
      startDate: '', 
      status: 'upcoming', 
      students: [] 
    };
    this.selectedStudentIds = [];
    this.studentSearchTerm = '';
    this.isModalOpen = true;
  }

  editBatch(batch: Batch) {
    this.editingBatch = true;
    const parsed = this.parseTimingRange(batch.timing);
    this.newBatch = { 
      ...batch, 
      timingFrom: parsed.from, 
      timingTo: parsed.to 
    };
    // Get currently assigned students from server
    this.selectedStudentIds = [];
    this.dataService.getStudentsByBatch(batch.id).subscribe(response => {
      const list = response.data || response || [];
      this.selectedStudentIds = list.map((s: any) => String(s.id));
    });
    this.studentSearchTerm = '';
    this.isModalOpen = true;
  }

  deleteBatch(batch: Batch) {
    if (confirm(`Are you sure you want to delete the batch "${batch.batchName}"?`)) {
      this.dataService.deleteBatch(batch.id).subscribe(() => {
        this.loadBatches();
        this.toastService.success('Batch deleted successfully');
        // Also reload students to reflect batch clearing
        this.loadStudents();
      });
    }
  }

  markBatchAsCompleted(batch: Batch) {
    if (confirm(`Mark batch "${batch.batchName}" and all its students as course completed?`)) {
      this.dataService.markCompleted({ batch_id: batch.id }).subscribe(() => {
        this.loadBatches();
        this.loadStudents();
        this.toastService.success('Batch and students marked as completed');
      });
    }
  }

  saveBatch() {
    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    if (!this.newBatch.batchName || !this.newBatch.courseId) {
      this.toastService.warning('Please provide Batch Name and Course');
      return;
    }

    if ((this.newBatch.timingFrom && !this.newBatch.timingTo) || (!this.newBatch.timingFrom && this.newBatch.timingTo)) {
      this.toastService.warning('Please provide both From and To times for Timing');
      return;
    }

    if (this.newBatch.timingFrom && this.newBatch.timingTo) {
      const fromFormatted = this.formatSingleTime(this.newBatch.timingFrom);
      const toFormatted = this.formatSingleTime(this.newBatch.timingTo);
      this.newBatch.timing = `${fromFormatted} - ${toFormatted}`;
    } else {
      this.newBatch.timing = '';
    }

    // Merge custom fields
    if (this.customFieldsRenderer) {
      this.newBatch.custom_fields = this.customFieldsRenderer.getValues();
    }

    // Frontend duplicate validation
    if (this.isCurrentCourseStandard() && this.newBatch.subject) {
      for (const studentId of this.selectedStudentIds) {
        const student = this.allStudents.find(s => String(s.id) === String(studentId));
        if (student) {
          const studentBatchSubjects = student.batchSubjects || [];
          const isAlreadyInThisBatch = student.batchIds && student.batchIds.map((bid: any) => String(bid)).includes(String(this.newBatch.id));
          const hasThisSubject = studentBatchSubjects.some((sub: string) => sub.trim().toLowerCase() === this.newBatch.subject.trim().toLowerCase());
          
          if (hasThisSubject && !isAlreadyInThisBatch) {
            const course = this.courses.find(c => String(c.id) === String(this.newBatch.courseId));
            const courseName = course ? course.name : 'this course';
            const message = `${student.name} is already assigned to another batch for ${courseName} - ${this.newBatch.subject}.`;
            alert(message);
            this.toastService.warning(message);
            return;
          }
        }
      }
    }

    this.newBatch.students = this.selectedStudentIds;
    this.dataService.addBatch(this.newBatch).subscribe({
      next: () => {
        this.toastService.success(this.editingBatch ? 'Batch updated successfully' : 'New batch created successfully');
        this.loadBatches();
        this.loadStudents();
        this.isModalOpen = false;
      },
      error: (err) => {
        const errorMsg = err.error?.message || err.message || 'Failed to save batch';
        this.toastService.error(errorMsg);
      }
    });
  }

  viewDetails(batch: Batch) {
    this.selectedBatch = batch;
    this.selectedBatchStudents = [];
    this.dataService.getStudentsByBatch(batch.id).subscribe(response => {
      const list = response.data || response || [];
      this.selectedBatchStudents = list.map((s: any) => ({
        id: String(s.id),
        regNumber: s.reg_number || s.regNumber,
        name: s.name,
        photo: s.photo,
        mobile: s.mobile,
        status: s.status || 'active'
      }));
    });
    this.isDetailsModalOpen = true;
  }

  viewBatchAttendance(batch: Batch) {
    this.isDetailsModalOpen = false;
    this.router.navigate(['/reports'], {
      queryParams: {
        report: 'attendance-glancer',
        batchId: batch.id,
        courseId: batch.courseId,
        target: 'batch'
      }
    });
  }

  getStatusType(status: string): any {
    switch (status) {
      case 'ongoing': return 'success';
      case 'completed': return 'neutral';
      case 'upcoming': return 'info';
      default: return 'neutral';
    }
  }

  formatTiming(timing?: string): string {
    if (!timing) {
      return '';
    }

    if (timing.includes('-')) {
      const parts = timing.split('-');
      const from = parts[0]?.trim();
      const to = parts[1]?.trim();
      const fromFormatted = this.formatSingleTime(from);
      const toFormatted = this.formatSingleTime(to);
      if (fromFormatted && toFormatted) {
        return `${fromFormatted} - ${toFormatted}`;
      }
      return timing;
    }

    return this.formatSingleTime(timing);
  }

  formatSingleTime(timing?: string): string {
    if (!timing) {
      return '';
    }

    const normalized = this.normalizeSingleTimeInput(timing);
    if (!normalized) {
      return timing;
    }

    const [hours, minutes] = normalized.split(':').map(Number);
    if (Number.isNaN(hours) || Number.isNaN(minutes)) {
      return timing;
    }

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  }

  private parseTimingRange(timingStr?: string): { from: string; to: string } {
    if (!timingStr) {
      return { from: '', to: '' };
    }
    const parts = timingStr.split('-');
    const fromStr = parts[0]?.trim() || '';
    const toStr = parts[1]?.trim() || '';
    return {
      from: this.normalizeSingleTimeInput(fromStr),
      to: this.normalizeSingleTimeInput(toStr)
    };
  }

  private normalizeSingleTimeInput(value?: string): string {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();
    if (/^\d{1,2}:\d{2}$/.test(trimmed)) {
      const [h, m] = trimmed.split(':');
      return `${h.padStart(2, '0')}:${m}`;
    }

    const match = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (!match) {
      return '';
    }

    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2] || '00', 10);
    const meridiem = match[3].toUpperCase();

    if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    } else if (meridiem === 'PM' && hours !== 12) {
      hours += 12;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }
}
