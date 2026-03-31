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

  // Student selection for Batch Mode
  allStudents: any[] = [];
  selectedStudentIds: string[] = [];
  studentSearchTerm = '';
  selectedBatchStudents: any[] = [];

  newBatch: any = {
    batchName: '',
    courseId: '',
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
    this.dataService.getCourses().subscribe(data => this.courses = data);
    this.dataService.getStaff().subscribe(data => this.staffList = data);
  }

  loadBatches() {
    this.dataService.getBatches().subscribe(data => this.batches = data);
  }

  loadStudents() {
    this.dataService.getStudents().subscribe(data => {
      // Only uncompleted students
      this.allStudents = data.filter(s => s.status !== 'completed');
      this.calculateOneToOneGroups();
    });
  }

  calculateOneToOneGroups() {
    // Return students in 1:1 mode (batchId is null or 0) grouped by course
    const search = this.oneToOneSearchTerm.toLowerCase();
    const timingSearch = this.oneToOneTimingFilter.toLowerCase();

    const oneToOnes = this.allStudents.filter(s => {
      const isOneToOne = !s.batchId || s.batchId == '0';
      if (!isOneToOne) return false;

      const matchesSearch = s.name.toLowerCase().includes(search) ||
        (s.instructor && s.instructor.toLowerCase().includes(search)) ||
        (s.instructorName && s.instructorName.toLowerCase().includes(search)) ||
        (s.regNumber && s.regNumber.toLowerCase().includes(search));

      const matchesStatus = this.oneToOneStatusFilter === 'all' ? true : s.status === this.oneToOneStatusFilter;
      const matchesCourse = this.courseFilter === 'all' ? true : s.courseId == this.courseFilter;
      const matchesTiming = s.timing ? s.timing.toLowerCase().includes(timingSearch) : (timingSearch === '' ? true : false);

      return matchesSearch && matchesStatus && matchesTiming && matchesCourse;
    });

    const grouped = new Map<string, any[]>();
    oneToOnes.forEach(s => {
      const courseName = s.courseName || 'General';
      const list = grouped.get(courseName) || [];
      list.push({ ...s }); // Clone for editing
      grouped.set(courseName, list);
    });

    this.oneToOneGroups = Array.from(grouped.entries()).map(([course, students]) => ({ course, students }));
  }

  switchMode(mode: 'batch' | 'one-to-one') {
    this.viewMode = mode;
    if (mode === 'one-to-one') {
      this.calculateOneToOneGroups();
    }
  }

  getFilteredStudents() {
    const search = this.studentSearchTerm.toLowerCase();
    return this.allStudents.filter(s => {
      const matchesSearch = s.name.toLowerCase().includes(search) || (s.regNumber && s.regNumber.toLowerCase().includes(search));
      const matchesCourse = this.newBatch.courseId ? s.courseId == this.newBatch.courseId : true;

      // EXCLUDE students already in another batch
      // If editing, allow students already in THIS batch
      const isAvailable = !s.batchId || s.batchId == '0' || (this.editingBatch && s.batchId == this.newBatch.id);

      return matchesSearch && matchesCourse && isAvailable;
    });
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

      return matchesSearch && matchesStatus && matchesCourse;
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
    this.newBatch = { batchName: '', courseId: '', instructor: '', timing: '', startDate: '', status: 'upcoming', students: [] };
    this.selectedStudentIds = [];
    this.studentSearchTerm = '';
    this.isModalOpen = true;
  }

  editBatch(batch: Batch) {
    this.editingBatch = true;
    this.newBatch = { ...batch, timing: this.normalizeTimeInput(batch.timing) };
    // Get currently assigned students
    this.selectedStudentIds = this.allStudents
      .filter(s => s.batchId == batch.id)
      .map(s => s.id);
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

    this.newBatch.timing = this.normalizeTimeInput(this.newBatch.timing);

    // Merge custom fields
    if (this.customFieldsRenderer) {
      this.newBatch.custom_fields = this.customFieldsRenderer.getValues();
    }

    this.newBatch.students = this.selectedStudentIds;
    this.dataService.addBatch(this.newBatch).subscribe(() => {
      this.toastService.success(this.editingBatch ? 'Batch updated successfully' : 'New batch created successfully');
      this.loadBatches();
      this.loadStudents();
      this.isModalOpen = false;
    });
  }

  viewDetails(batch: Batch) {
    this.selectedBatch = batch;
    this.selectedBatchStudents = this.allStudents.filter(s => s.batchId == batch.id);
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

    const normalized = this.normalizeTimeInput(timing);
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

  private normalizeTimeInput(value?: string): string {
    if (!value) {
      return '';
    }

    const trimmed = value.trim();
    if (/^\d{2}:\d{2}$/.test(trimmed)) {
      return trimmed;
    }

    const firstSegment = trimmed.split('-')[0]?.trim() || trimmed;
    const match = firstSegment.match(/^(\d{1,2})(?::(\d{2}))?\s*(AM|PM)$/i);
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
