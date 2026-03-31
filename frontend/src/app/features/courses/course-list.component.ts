import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Course } from '../../models';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { Observable, firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { ToastService } from '../../services/toast.service';

import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ModalComponent, FormsModule, CustomFieldsRendererComponent],
  templateUrl: './course-list.component.html'
})
export class CourseListComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  courses: Course[] = [];
  searchTerm = '';
  isModalOpen = false;
  editingCourse = false;
  selectedFileName = '';
  selectedImageName = '';
  isUploadingSyllabus = false;
  isUploadingImage = false;
  isSavingCourse = false;
  statusFilter: string = 'all';
  isCourseIdManual = false;
  nextCourseId = '';

  isImportModalOpen = false;
  importFile: File | null = null;
  showSuccess = false;
  importedCount = 0;
  isGuidanceOpen = false;
  customFields: any[] = [];

  newCourse: Partial<Course> = this.getInitialCourse();

  getInitialCourse(): Partial<Course> {
    return {
      name: '',
      description: '',
      category: '',
      duration: '',
      fees: 0,
      status: 'active',
      course_id: ''
    };
  }

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    this.loadCourses();
    this.dataService.getCustomFields('course').subscribe(fields => {
      this.customFields = fields;
    });
  }

  loadCourses() {
    this.dataService.getCourses().subscribe(data => this.courses = data);
  }

  filteredCourses() {
    return this.courses.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (c.category && c.category.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesStatus = this.statusFilter === 'all' || c.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingCourse = false;
    this.selectedFileName = '';
    this.selectedImageName = '';
    this.isUploadingSyllabus = false;
    this.isUploadingImage = false;
    this.isSavingCourse = false;
    this.newCourse = { name: '', description: '', category: '', duration: '', fees: 0, status: 'active' };
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFileName = file.name;
      this.isUploadingSyllabus = true;
      this.dataService.uploadSyllabus(file).subscribe({
        next: res => {
          this.isUploadingSyllabus = false;
          if (res.status === 'success' && res.file_path) {
            this.newCourse.syllabusPath = res.file_path;
            return;
          }
          this.toastService.error(res.message || 'Syllabus upload failed.');
          this.selectedFileName = '';
          this.newCourse.syllabusPath = undefined;
        },
        error: err => {
          this.isUploadingSyllabus = false;
          this.toastService.error(err?.error?.message || 'Syllabus upload failed.');
          this.selectedFileName = '';
          this.newCourse.syllabusPath = undefined;
        }
      });
    }
  }

  onImageSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageName = file.name;
      this.isUploadingImage = true;
      this.dataService.uploadCourseImage(file).subscribe({
        next: res => {
          this.isUploadingImage = false;
          if (res.status === 'success' && res.file_path) {
            this.newCourse.imagePath = res.file_path;
            return;
          }
          this.toastService.error(res.message || 'Course image upload failed.');
          this.selectedImageName = '';
          this.newCourse.imagePath = undefined;
        },
        error: err => {
          this.isUploadingImage = false;
          this.toastService.error(err?.error?.message || 'Course image upload failed.');
          this.selectedImageName = '';
          this.newCourse.imagePath = undefined;
        }
      });
    }
  }

  openAddModal() {
    this.newCourse = this.getInitialCourse();
    this.editingCourse = false;

    this.dataService.getSettings().subscribe(s => {
      this.isCourseIdManual = (s.course_id_mode === 'manual');
      if (!this.isCourseIdManual) {
        this.dataService.getNextCourseId().subscribe(res => {
          this.nextCourseId = res.next;
          this.newCourse.course_id = res.next;
        });
      }
    });

    this.isModalOpen = true;
  }

  editCourse(course: Course) {
    this.editingCourse = true;
    this.newCourse = {
      ...course,
      course_id: course.course_id ?? (course as any).courseId ?? ''
    };
    this.selectedFileName = course.syllabusPath ? course.syllabusPath.split('/').pop() || '' : '';
    this.selectedImageName = course.imagePath ? course.imagePath.split('/').pop() || '' : '';
    this.isModalOpen = true;
  }

  saveCourse() {
    if (this.isUploadingImage || this.isUploadingSyllabus) {
      this.toastService.warning('Please wait for the course image and syllabus uploads to finish before saving.');
      return;
    }

    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    // Merge custom fields
    if (this.customFieldsRenderer) {
      (this.newCourse as any).custom_fields = this.customFieldsRenderer.getValues();
    }

    this.isSavingCourse = true;
    this.dataService.addCourse(this.newCourse).subscribe({
      next: () => {
        this.isSavingCourse = false;
        this.loadCourses();
        this.toastService.success(this.editingCourse ? 'Course updated successfully' : 'New course created successfully');
        this.closeModal();
      },
      error: () => {
        this.isSavingCourse = false;
        this.toastService.error('Failed to save the course. Please try again.');
      }
    });
  }

  deleteCourse(course: Course) {
    if (confirm(`Are you sure you want to delete course "${course.name}"? This will also delete all associated batches and clear student course assignments.`)) {
      this.dataService.deleteCourse(course.id).subscribe(() => {
        this.loadCourses();
        this.toastService.success('Course and associated data deleted');
      });
    }
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `http://localhost:8081/${normalizedPath}`;
  }

  toggleGuidance() {
    this.isGuidanceOpen = !this.isGuidanceOpen;
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

      if (confirm(`Detected ${data.length} courses. Proceed with sequential import?`)) {
        let imported = 0;
        for (const row of data) {
          const course: any = {
            course_id: row['Course ID'] || row['course_id'] || row['id'] || '',
            name: row['Name'] || row['name'] || 'New Course',
            description: row['Description'] || row['description'] || '',
            category: row['Category'] || row['category'] || 'General',
            duration: row['Duration'] || row['duration'] || '',
            fees: Number(row['Fees'] || row['fees'] || 0),
            status: (row['Status'] || row['status'] || 'active').toLowerCase()
          };

          // Map Custom Fields
          const customValues: any = {};
          this.customFields.forEach(cf => {
            if (row[cf.label] !== undefined) {
              customValues[cf.id] = row[cf.label];
            }
          });
          if (Object.keys(customValues).length > 0) {
            (course as any).custom_fields = customValues;
          }

          try {
            await firstValueFrom(this.dataService.addCourse(course));
            imported++;
          } catch (err) {
            console.error('Failed to import course:', course.name, err);
          }
        }

        if (imported > 0) {
          this.importedCount = imported;
          this.loadCourses();
          this.isImportModalOpen = false;
          this.toastService.success(`${imported} courses imported successfully.`);
          this.showSuccess = true;
          setTimeout(() => this.showSuccess = false, 3500);
        } else {
          this.toastService.error('No courses were imported.');
        }
      }
    };
    reader.readAsBinaryString(this.importFile);
  }
}
