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
import { DatePickerComponent } from '../../shared/ui/date-picker.component';

import { PlanService } from '../../services/plan.service';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ModalComponent, FormsModule, CustomFieldsRendererComponent, DatePickerComponent, SearchableSelectComponent],
  templateUrl: 'batch-list.component.html'
})
export class BatchListComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  batches: Batch[] = [];
  courses: Course[] = [];
  courseOptionsForFilter: { id: string | number; name: string }[] = [{ id: 'all', name: 'All Courses' }];

  updateCourseOptionsForFilter() {
    this.courseOptionsForFilter = [
      { id: 'all', name: 'All Courses' },
      ...(this.courses || []).map(c => ({ id: c.id, name: c.name }))
    ];
  }
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

  // Standard Courses & Separate By Mode
  enableStandardCourses = true;
  separateBy: 'both' | 'course' | 'subject' = 'both';

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

  constructor(
    private dataService: DataService,
    private router: Router,
    private toastService: ToastService,
    public planService: PlanService
  ) { }

  ngOnInit() {
    this.loadBatches();
    this.loadStudents();
    this.dataService.getSettings().subscribe((s: any) => {
      if (s) {
        this.enableStandardCourses = s.enable_standard_courses == 1 || s.enableStandardCourses == 1;
      }
    });
    this.dataService.getCourses().subscribe(data => {
      this.courses = data;
      this.updateCourseOptionsForFilter();
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

            // Retrieve subject-specific allocations (default to empty for standard subject groups)
            let subjectInstructor = '';
            let subjectTiming = '';
            let subjectTimingFrom = '';
            let subjectTimingTo = '';
            let subjectStartDate = '';
            let subjectStatus = 'active';

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

  isStandardCoursesEnabled(): boolean {
    return this.planService.canUse('standardCourses') && this.enableStandardCourses;
  }

  getAllUniqueSubjects(): any[] {
    const subjectSet = new Set<string>();
    const result: any[] = [];
    this.courses.forEach(c => {
      if (c && (c.courseType === 'standard' || c.course_type === 'standard') && c.subjects) {
        let subs: any[] = [];
        if (Array.isArray(c.subjects)) {
          subs = c.subjects;
        } else {
          try { subs = JSON.parse(c.subjects); } catch { subs = []; }
        }
        subs.forEach(s => {
          const name = typeof s === 'string' ? s.trim() : (s?.name ? s.name.trim() : '');
          if (name && !subjectSet.has(name.toLowerCase())) {
            subjectSet.add(name.toLowerCase());
            result.push({ name });
          }
        });
      }
    });
    return result;
  }

  shouldShowSubjectDropdownInModal(): boolean {
    if (this.isStandardCoursesEnabled()) {
      if (this.separateBy === 'both') {
        return !!this.newBatch.courseId && this.getSubjectsForCurrentCourse().length > 0;
      }
      return false;
    }
    return this.isCurrentCourseStandard();
  }

  onSeparateByChange() {
    this.selectedStudentIds = [];
    if (this.separateBy === 'course') {
      this.newBatch.subject = '';
    } else if (this.separateBy === 'subject') {
      this.newBatch.courseId = '';
    } else if (this.separateBy === 'both') {
      if (this.newBatch.courseId) {
        const subs = this.getSubjectsForCurrentCourse();
        if (subs.length === 0) {
          this.newBatch.subject = '';
        }
      }
    }
  }

  onCourseChangeInModal() {
    this.selectedStudentIds = [];
    if (this.isStandardCoursesEnabled()) {
      if (this.separateBy === 'both') {
        const subs = this.getSubjectsForCurrentCourse();
        if (subs.length === 0) {
          this.newBatch.subject = '';
        } else if (this.newBatch.subject && !subs.some((s: any) => (typeof s === 'string' ? s : s.name) === this.newBatch.subject)) {
          this.newBatch.subject = '';
        }
      } else if (this.separateBy === 'course') {
        this.newBatch.subject = '';
      }
    }
  }

  isStudentAssignedToOneToOne(s: any, subject?: string): boolean {
    if (!s) return false;

    if (subject && subject.trim()) {
      const targetSub = subject.trim().toLowerCase();
      const rawAllocs = s.subjectAllocations;
      if (rawAllocs) {
        try {
          const allocs = typeof rawAllocs === 'string' ? JSON.parse(rawAllocs) : rawAllocs;
          if (allocs) {
            const subKey = Object.keys(allocs).find(k => k.trim().toLowerCase() === targetSub);
            if (subKey) {
              const alloc = allocs[subKey];
              if (alloc && alloc.instructor && String(alloc.instructor).trim() !== '' && String(alloc.instructor).trim() !== '0' && alloc.status !== 'inactive') {
                return true;
              }
            }
          }
        } catch (e) {}
      }
    } else {
      if (s.instructor && String(s.instructor).trim() !== '' && String(s.instructor).trim() !== '0') {
        return true;
      }
      const rawAllocs = s.subjectAllocations;
      if (rawAllocs) {
        try {
          const allocs = typeof rawAllocs === 'string' ? JSON.parse(rawAllocs) : rawAllocs;
          if (allocs) {
            for (const k of Object.keys(allocs)) {
              const alloc = allocs[k];
              if (alloc && alloc.instructor && String(alloc.instructor).trim() !== '' && String(alloc.instructor).trim() !== '0' && alloc.status !== 'inactive') {
                return true;
              }
            }
          }
        } catch (e) {}
      }
    }
    return false;
  }

  getFilteredStudents() {
    const search = this.studentSearchTerm.toLowerCase();

    if (this.isStandardCoursesEnabled()) {
      if (this.separateBy === 'subject') {
        if (!this.newBatch.subject) {
          return [];
        }
        return this.allStudents.filter(s => {
          const matchesSearch = s.name.toLowerCase().includes(search) || (s.regNumber && s.regNumber.toLowerCase().includes(search));
          const studentSubjects = this.parseStudentSubjects(s.selectedSubjects || s.selected_subjects);
          const matchesSubject = studentSubjects.map((sub: string) => sub.toLowerCase()).includes(this.newBatch.subject.toLowerCase());

          const studentBatchSubjects = s.batchSubjects || [];
          const isAlreadyInThisBatch = s.batchIds && s.batchIds.map((bid: any) => String(bid)).includes(String(this.newBatch.id));
          const hasThisSubjectInBatch = studentBatchSubjects.some((sub: string) => sub.trim().toLowerCase() === this.newBatch.subject.trim().toLowerCase());
          const isAssigned1To1 = this.isStudentAssignedToOneToOne(s, this.newBatch.subject);

          const isAvailable = (!hasThisSubjectInBatch && !isAssigned1To1) || isAlreadyInThisBatch;

          return matchesSearch && matchesSubject && isAvailable;
        });
      }

      if (this.separateBy === 'course') {
        if (!this.newBatch.courseId) {
          return [];
        }
        return this.allStudents.filter(s => {
          const matchesSearch = s.name.toLowerCase().includes(search) || (s.regNumber && s.regNumber.toLowerCase().includes(search));
          const matchesCourse = s.courseId == this.newBatch.courseId;

          const isAlreadyInThisBatch = s.batchIds && s.batchIds.map((bid: any) => String(bid)).includes(String(this.newBatch.id));
          const isAssigned1To1 = this.isStudentAssignedToOneToOne(s);
          const hasNoBatch = !s.batchId || s.batchId == '0';

          const isAvailable = (hasNoBatch && !isAssigned1To1) || (this.editingBatch && isAlreadyInThisBatch);

          return matchesSearch && matchesCourse && isAvailable;
        });
      }

      if (this.separateBy === 'both') {
        if (!this.newBatch.courseId) {
          return [];
        }
        const hasSubjects = this.getSubjectsForCurrentCourse().length > 0;
        if (hasSubjects && !this.newBatch.subject) {
          return [];
        }

        return this.allStudents.filter(s => {
          const matchesSearch = s.name.toLowerCase().includes(search) || (s.regNumber && s.regNumber.toLowerCase().includes(search));
          const matchesCourse = s.courseId == this.newBatch.courseId;

          let isAvailable = true;
          let matchesSubject = true;

          const isAlreadyInThisBatch = s.batchIds && s.batchIds.map((bid: any) => String(bid)).includes(String(this.newBatch.id));

          if (hasSubjects && this.newBatch.subject) {
            const studentBatchSubjects = s.batchSubjects || [];
            const hasThisSubjectInBatch = studentBatchSubjects.some((sub: string) => sub.trim().toLowerCase() === this.newBatch.subject.trim().toLowerCase());
            const isAssigned1To1 = this.isStudentAssignedToOneToOne(s, this.newBatch.subject);

            if ((hasThisSubjectInBatch || isAssigned1To1) && !isAlreadyInThisBatch) {
              isAvailable = false;
            }

            const studentSubjects = this.parseStudentSubjects(s.selectedSubjects || s.selected_subjects);
            matchesSubject = studentSubjects.map((sub: string) => sub.toLowerCase()).includes(this.newBatch.subject.toLowerCase());
          } else {
            const isAssigned1To1 = this.isStudentAssignedToOneToOne(s);
            const hasNoBatch = !s.batchId || s.batchId == '0';
            isAvailable = (hasNoBatch && !isAssigned1To1) || (this.editingBatch && isAlreadyInThisBatch);
          }

          return matchesSearch && matchesCourse && matchesSubject && isAvailable;
        });
      }
    }

    if (this.isCurrentCourseStandard() && !this.newBatch.subject) {
      return [];
    }
    return this.allStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search) || (s.regNumber && s.regNumber.toLowerCase().includes(search));
      const matchesCourse = this.newBatch.courseId ? s.courseId == this.newBatch.courseId : true;

      let isAvailable = true;
      const isAlreadyInThisBatch = s.batchIds && s.batchIds.map((bid: any) => String(bid)).includes(String(this.newBatch.id));

      if (this.isCurrentCourseStandard() && this.newBatch.subject) {
        const studentBatchSubjects = s.batchSubjects || [];
        const hasThisSubjectInBatch = studentBatchSubjects.some((sub: string) => sub.trim().toLowerCase() === this.newBatch.subject.trim().toLowerCase());
        const isAssigned1To1 = this.isStudentAssignedToOneToOne(s, this.newBatch.subject);

        if ((hasThisSubjectInBatch || isAssigned1To1) && !isAlreadyInThisBatch) {
          isAvailable = false;
        }
      } else {
        const isAssigned1To1 = this.isStudentAssignedToOneToOne(s);
        const hasNoBatch = !s.batchId || s.batchId == '0';
        isAvailable = (hasNoBatch && !isAssigned1To1) || (this.editingBatch && isAlreadyInThisBatch);
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
    return false;
  }

  getStudentConflictBatchName(s: any): string {
    return '';
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

  isStudentSelected(studentId: any): boolean {
    const idStr = String(studentId);
    return this.selectedStudentIds.some(id => String(id) === idStr);
  }

  areAllStudentsSelected(): boolean {
    const filtered = this.getFilteredStudents();
    if (filtered.length === 0) return false;
    return filtered.every(s => this.isStudentSelected(s.id));
  }

  toggleStudentSelection(studentId: any) {
    const idStr = String(studentId);
    const index = this.selectedStudentIds.findIndex(id => String(id) === idStr);
    if (index > -1) {
      this.selectedStudentIds.splice(index, 1);
    } else {
      this.selectedStudentIds.push(idStr);
    }
  }

  toggleSelectAllStudents() {
    const filtered = this.getFilteredStudents();
    if (filtered.length === 0) return;

    if (this.areAllStudentsSelected()) {
      const filteredIds = new Set(filtered.map(s => String(s.id)));
      this.selectedStudentIds = this.selectedStudentIds.filter(id => !filteredIds.has(String(id)));
    } else {
      const currentSet = new Set(this.selectedStudentIds.map(id => String(id)));
      filtered.forEach(s => {
        const idStr = String(s.id);
        if (!currentSet.has(idStr)) {
          this.selectedStudentIds.push(idStr);
          currentSet.add(idStr);
        }
      });
    }
  }

  saveAllocation(student: any) {
    if ((student.timingFrom && !student.timingTo) || (!student.timingFrom && student.timingTo)) {
      this.toastService.warning('Please provide both From and To times for Timing');
      return;
    }

    let calculatedTiming = '';
    if (student.timingFrom && student.timingTo) {
      const fromFormatted = this.formatSingleTime(student.timingFrom);
      const toFormatted = this.formatSingleTime(student.timingTo);
      calculatedTiming = `${fromFormatted} - ${toFormatted}`;
    }

    if (calculatedTiming) {
      const newRange = this.parseRangeToMinutes(calculatedTiming);
      if (newRange) {
        const conflictDetail = this.checkStudentAllocationConflict(student, newRange);
        if (conflictDetail) {
          const alertMsg = `⚠️ Timing Conflict Detected!\n\n` +
            `The student "${student.name}" is already scheduled for another class at the same time:\n\n` +
            `• ${conflictDetail}\n\n` +
            `Please select a non-overlapping class time before updating.`;
          alert(alertMsg);
          this.toastService.warning(`Timing conflict: ${conflictDetail}`);
          return;
        }
      }
    }

    student.timing = calculatedTiming;

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
    this.separateBy = 'both';
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
    if (batch.courseId && batch.subject) {
      this.separateBy = 'both';
    } else if (batch.subject && (!batch.courseId || String(batch.courseId) === '0')) {
      this.separateBy = 'subject';
    } else if (batch.courseId) {
      this.separateBy = 'course';
    } else {
      this.separateBy = 'both';
    }
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

    if (!this.newBatch.batchName) {
      this.toastService.warning('Please provide a Batch Name');
      return;
    }

    if (this.isStandardCoursesEnabled()) {
      if (this.separateBy === 'subject') {
        if (!this.newBatch.subject) {
          this.toastService.warning('Please select a Subject');
          return;
        }
      } else if (this.separateBy === 'course') {
        if (!this.newBatch.courseId) {
          this.toastService.warning('Please select a Course');
          return;
        }
      } else { // 'both'
        if (!this.newBatch.courseId) {
          this.toastService.warning('Please select a Course');
          return;
        }
        if (this.shouldShowSubjectDropdownInModal() && !this.newBatch.subject) {
          this.toastService.warning('Please select a Subject');
          return;
        }
      }
    } else {
      if (!this.newBatch.courseId) {
        this.toastService.warning('Please select a Course');
        return;
      }
      if (this.isCurrentCourseStandard() && !this.newBatch.subject) {
        this.toastService.warning('Please select a Subject');
        return;
      }
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

    // Frontend timing conflict validation
    const newBatchTimingStr = this.newBatch.timing ||
      (this.newBatch.timingFrom && this.newBatch.timingTo ? `${this.newBatch.timingFrom} - ${this.newBatch.timingTo}` : '');
    const newBatchRange = this.parseRangeToMinutes(newBatchTimingStr);

    if (newBatchRange) {
      const timingConflicts: string[] = [];
      for (const studentId of this.selectedStudentIds) {
        const student = this.allStudents.find(s => String(s.id) === String(studentId));
        if (!student) continue;

        let studentBatchIds: string[] = [];
        if (student.batch_ids && Array.isArray(student.batch_ids)) {
          studentBatchIds = student.batch_ids.map((id: any) => String(id));
        } else if (student.batchIds && Array.isArray(student.batchIds)) {
          studentBatchIds = student.batchIds.map((id: any) => String(id));
        } else if (student.batchId && String(student.batchId) !== '0') {
          studentBatchIds = [String(student.batchId)];
        }

        for (const bId of studentBatchIds) {
          if (this.editingBatch && String(this.newBatch.id) === String(bId)) continue;
          const existingBatch = this.batches.find(b => String(b.id) === String(bId));
          if (existingBatch && existingBatch.status !== 'completed' && existingBatch.timing) {
            const existingRange = this.parseRangeToMinutes(existingBatch.timing);
            if (existingRange && this.checkRangesOverlap(newBatchRange, existingRange)) {
              timingConflicts.push(`${student.name} is already scheduled in "${existingBatch.batchName}" (${this.formatTiming(existingBatch.timing)})`);
            }
          }
        }

        if (student.timing) {
          const oneToOneRange = this.parseRangeToMinutes(student.timing);
          if (oneToOneRange && this.checkRangesOverlap(newBatchRange, oneToOneRange)) {
            timingConflicts.push(`${student.name} already has a 1-to-1 session scheduled at ${this.formatTiming(student.timing)}`);
          }
        }
      }

      if (timingConflicts.length > 0) {
        const uniqueConflicts = Array.from(new Set(timingConflicts));
        const alertMsg = `⚠️ Timing Conflict Detected!\n\nThe following student(s) have an overlapping class schedule:\n\n• ` +
          uniqueConflicts.join('\n• ') +
          `\n\nPlease choose a non-overlapping class time or deselect conflicting student(s) before saving.`;
        alert(alertMsg);
        this.toastService.warning(`Timing conflict for ${uniqueConflicts.length} candidate(s).`);
        return;
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

  parseTimeToMinutes(timeStr?: string): number | null {
    if (!timeStr) return null;
    const trimmed = timeStr.trim();
    const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
    if (match24) {
      const h = parseInt(match24[1], 10);
      const m = parseInt(match24[2], 10);
      if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
    }
    const match12 = trimmed.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
    if (match12) {
      let h = parseInt(match12[1], 10);
      const m = parseInt(match12[2] || '0', 10);
      const ampm = match12[3].toUpperCase();
      if (ampm === 'AM' && h === 12) h = 0;
      else if (ampm === 'PM' && h !== 12) h += 12;
      if (h >= 0 && h < 24 && m >= 0 && m < 60) return h * 60 + m;
    }
    return null;
  }

  parseRangeToMinutes(timingStr?: string): { start: number; end: number } | null {
    if (!timingStr) return null;
    const parts = timingStr.split(/[-–—]|to/i);
    if (parts.length < 2) return null;
    const start = this.parseTimeToMinutes(parts[0]);
    const end = this.parseTimeToMinutes(parts[1]);
    if (start === null || end === null || start >= end) return null;
    return { start, end };
  }

  checkRangesOverlap(r1: { start: number; end: number } | null, r2: { start: number; end: number } | null): boolean {
    if (!r1 || !r2) return false;
    return r1.start < r2.end && r2.start < r1.end;
  }

  checkStudentAllocationConflict(student: any, newRange: { start: number; end: number }): string | null {
    const studentIdStr = String(student.id || student.studentId || '');
    const fullStudent = this.allStudents.find(s => String(s.id || s.studentId) === studentIdStr) || student;
    const currentSubject = (student.currentAllocatedSubject || '').trim().toLowerCase();

    // 1. Check against other subject allocations for this student
    let allocs: Record<string, any> = {};
    const rawAllocations = student.subjectAllocations || fullStudent.subjectAllocations;
    if (rawAllocations) {
      try {
        allocs = typeof rawAllocations === 'string' ? JSON.parse(rawAllocations) : rawAllocations;
      } catch {
        allocs = {};
      }
    }

    for (const subName of Object.keys(allocs)) {
      if (currentSubject && subName.trim().toLowerCase() === currentSubject) {
        continue; // Skip current subject being updated
      }
      const subData = allocs[subName];
      if (subData && subData.timing && (subData.status === undefined || subData.status === 'active' || subData.status === '1')) {
        const subRange = this.parseRangeToMinutes(subData.timing);
        if (subRange && this.checkRangesOverlap(newRange, subRange)) {
          return `Subject "${subName}" (${this.formatTiming(subData.timing)})`;
        }
      }
    }

    // 2. Check against assigned batches for this student
    let studentBatchIds: string[] = [];
    if (fullStudent.batch_ids && Array.isArray(fullStudent.batch_ids)) {
      studentBatchIds = fullStudent.batch_ids.map((id: any) => String(id));
    } else if (fullStudent.batchIds && Array.isArray(fullStudent.batchIds)) {
      studentBatchIds = fullStudent.batchIds.map((id: any) => String(id));
    } else if (fullStudent.batchId && String(fullStudent.batchId) !== '0') {
      studentBatchIds = [String(fullStudent.batchId)];
    }

    for (const bId of studentBatchIds) {
      const b = this.batches.find(batch => String(batch.id) === String(bId));
      if (b && b.status !== 'completed' && b.timing) {
        if (currentSubject && b.subject && b.subject.trim().toLowerCase() === currentSubject) {
          continue; // Skip batch for the same subject
        }
        const bRange = this.parseRangeToMinutes(b.timing);
        if (bRange && this.checkRangesOverlap(newRange, bRange)) {
          return `Batch "${b.batchName}" (${this.formatTiming(b.timing)})`;
        }
      }
    }

    // 3. Check general 1-to-1 timing if not in subject allocation mode
    if (!currentSubject && fullStudent.timing) {
      const oneToOneRange = this.parseRangeToMinutes(fullStudent.timing);
      if (oneToOneRange && this.checkRangesOverlap(newRange, oneToOneRange)) {
        return `1-to-1 Class (${this.formatTiming(fullStudent.timing)})`;
      }
    }

    return null;
  }

  getStudentTimingConflictInfo(s: any): string | null {
    const currentTimingStr = this.newBatch.timing ||
      (this.newBatch.timingFrom && this.newBatch.timingTo ? `${this.newBatch.timingFrom} - ${this.newBatch.timingTo}` : '');
    const currentRange = this.parseRangeToMinutes(currentTimingStr);
    if (!currentRange) return null;

    let studentBatchIds: string[] = [];
    if (s.batch_ids && Array.isArray(s.batch_ids)) {
      studentBatchIds = s.batch_ids.map((id: any) => String(id));
    } else if (s.batchIds && Array.isArray(s.batchIds)) {
      studentBatchIds = s.batchIds.map((id: any) => String(id));
    } else if (s.batchId && String(s.batchId) !== '0') {
      studentBatchIds = [String(s.batchId)];
    }

    for (const bId of studentBatchIds) {
      if (this.editingBatch && String(this.newBatch.id) === String(bId)) continue;
      const b = this.batches.find(batch => String(batch.id) === String(bId));
      if (b && b.status !== 'completed' && b.timing) {
        const bRange = this.parseRangeToMinutes(b.timing);
        if (bRange && this.checkRangesOverlap(currentRange, bRange)) {
          return `${b.batchName} (${this.formatTiming(b.timing)})`;
        }
      }
    }

    if (s.subjectAllocations) {
      try {
        const allocs = typeof s.subjectAllocations === 'string' ? JSON.parse(s.subjectAllocations) : s.subjectAllocations;
        for (const subName of Object.keys(allocs)) {
          const subData = allocs[subName];
          if (subData && subData.timing && (subData.status === undefined || subData.status === 'active' || subData.status === '1')) {
            const subRange = this.parseRangeToMinutes(subData.timing);
            if (subRange && this.checkRangesOverlap(currentRange, subRange)) {
              return `Subject "${subName}" (${this.formatTiming(subData.timing)})`;
            }
          }
        }
      } catch {}
    }

    if (s.timing) {
      const oneToOneRange = this.parseRangeToMinutes(s.timing);
      if (oneToOneRange && this.checkRangesOverlap(currentRange, oneToOneRange)) {
        return `1-to-1 Class (${this.formatTiming(s.timing)})`;
      }
    }

    return null;
  }
}
