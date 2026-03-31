import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { StudyMaterial, Course, Batch, Student } from '../../models';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { forkJoin } from 'rxjs';
import { ToastService } from '../../services/toast.service';

import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';

@Component({
  selector: 'app-study-material',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ModalComponent, CustomFieldsRendererComponent],
  templateUrl: './study-material.component.html'
})
export class StudyMaterialComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  materials: StudyMaterial[] = [];
  courses: Course[] = [];
  batches: Batch[] = [];
  students: Student[] = [];

  selectedCourse: Course | null = null;
  courseSearchTerm = '';
  materialSearchTerm = '';

  // Modals
  isAddModalOpen = false;
  isShareModalOpen = false;
  isViewModalOpen = false;

  // Creation Form
  newMaterial: any = this.resetForm();
  selectedFile: File | null = null;
  isUploading = false;

  // Sharing Form
  sharingMaterial: StudyMaterial | null = null;
  shareTargetType: 'batch' | 'one-one' = 'batch';
  assignTab: 'unassigned' | 'assigned' = 'unassigned';
  studentSearchQuery = '';
  selectedTargetIds: string[] = [];

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    this.loadInitialData();
  }

  loadInitialData() {
    forkJoin({
      courses: this.dataService.getCourses(),
      batches: this.dataService.getBatches(),
      students: this.dataService.getStudents()
    }).subscribe(res => {
      this.courses = res.courses;
      this.batches = res.batches;
      this.students = res.students;

      if (this.courses.length > 0) {
        this.selectCourse(this.courses[0]);
      }
    });
  }

  selectCourse(course: Course) {
    this.selectedCourse = course;
    this.loadMaterials();
  }

  loadMaterials() {
    if (!this.selectedCourse) return;
    this.dataService.getStudyMaterials({ course_id: this.selectedCourse.id }).subscribe(data => {
      // Robust filtering to ensure only current course materials are shown
      this.materials = data.filter(m => String(m.courseId) === String(this.selectedCourse?.id));

      // If we are currently sharing, refresh the specific material object
      if (this.isShareModalOpen && this.sharingMaterial) {
        const updated = this.materials.find(m => String(m.id) === String(this.sharingMaterial?.id));
        if (updated) {
          this.sharingMaterial = updated;
          this.updateShareSelection();
        }
      }
    });
  }

  resetForm() {
    return {
      title: '',
      description: '',
      courseId: this.selectedCourse?.id || '',
      targetType: 'all',
      targetIds: []
    };
  }

  get filteredCourses() {
    const search = this.courseSearchTerm.toLowerCase().trim();
    if (!search) return this.courses;
    return this.courses.filter(c => c.name.toLowerCase().includes(search));
  }

  get filteredMaterials() {
    let list = this.materials;
    if (this.selectedCourse) {
      list = list.filter(m => String(m.courseId) === String(this.selectedCourse?.id));
    }
    const search = this.materialSearchTerm.toLowerCase().trim();
    if (!search) return list;
    return list.filter(m =>
      m.title.toLowerCase().includes(search) ||
      (m.description && m.description.toLowerCase().includes(search))
    );
  }

  openAddModal() {
    this.newMaterial = this.resetForm();
    this.selectedFile = null;
    this.isAddModalOpen = true;
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  saveMaterial() {
    if (!this.selectedFile) {
      this.toastService.warning('Please select a file to upload');
      return;
    }

    if (!this.newMaterial.title) {
      this.toastService.warning('Please enter a title');
      return;
    }

    this.isUploading = true;

    this.dataService.uploadStudyMaterial(this.selectedFile).subscribe({
      next: (res) => {
        if (res.status === 'success') {
          // Validate custom fields
          if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
            this.isUploading = false;
            this.toastService.warning('Please fill all required custom fields.');
            return;
          }

          const payload = {
            ...this.newMaterial,
            file_url: res.file_path,
            file_name: this.selectedFile!.name,
            file_type: this.selectedFile!.type,
            target_ids: JSON.stringify([]),
            target_type: 'none',
            course_id: this.newMaterial.courseId || this.selectedCourse?.id,
            custom_fields: this.customFieldsRenderer ? this.customFieldsRenderer.getValues() : null
          };

          this.dataService.saveStudyMaterial(payload).subscribe({
            next: () => {
              this.isUploading = false;
              this.isAddModalOpen = false;
              this.loadMaterials();
              this.toastService.success('Study material saved successfully!');
            },
            error: (err: any) => {
              this.isUploading = false;
              const msg = err?.error?.message || 'Failed to save material record';
              this.toastService.error(msg);
            }
          });
        } else {
          this.isUploading = false;
          this.toastService.error('Upload failed: ' + (res.message || 'Unknown error'));
        }
      },
      error: () => {
        this.isUploading = false;
        this.toastService.error('File upload error');
      }
    });
  }

  // Sharing Logic
  openShareModal(material: StudyMaterial) {
    this.sharingMaterial = material;
    this.shareTargetType = 'batch';
    this.assignTab = 'unassigned';
    this.studentSearchQuery = '';
    this.selectedTargetIds = []; // Start fresh for unassigned
    this.isShareModalOpen = true;
  }

  switchAssignTab(tab: 'unassigned' | 'assigned') {
    this.assignTab = tab;
    this.studentSearchQuery = '';
    this.updateShareSelection();
  }

  updateShareSelection() {
    if (!this.sharingMaterial) return;
    if (this.shareTargetType === 'batch') {
      this.selectedTargetIds = [...(this.sharingMaterial.batch_target_ids || [])];
    } else {
      this.selectedTargetIds = [...(this.sharingMaterial.student_target_ids || [])];
    }
  }

  onShareTargetTypeChange(type: 'batch' | 'one-one') {
    this.shareTargetType = type;
    this.selectedTargetIds = [];
    this.studentSearchQuery = '';
    this.updateShareSelection();
  }

  getShareOptions() {
    if (!this.sharingMaterial) return [];

    // Always use the course of the study material itself
    const targetCourseId = this.sharingMaterial.courseId || (this.sharingMaterial as any).course_id;
    let options: any[] = [];

    if (this.shareTargetType === 'batch') {
      options = this.batches.filter(b => (b.courseId === targetCourseId || (b as any).course_id === targetCourseId));
    } else {
      options = this.students.filter(s => (s.courseId === targetCourseId || (s as any).course_id === targetCourseId));
    }

    // Filter by Tab
    if (this.assignTab === 'unassigned') {
      const assignedIds = this.shareTargetType === 'batch'
        ? [...(this.sharingMaterial.batch_target_ids || []), ...(this.sharingMaterial.targetType === 'batch' ? this.sharingMaterial.targetIds || [] : [])]
        : [...(this.sharingMaterial.student_target_ids || []), ...(this.sharingMaterial.targetType === 'student' ? this.sharingMaterial.targetIds || [] : [])];
      options = options.filter(opt => !assignedIds.map(String).includes(String(opt.id)));
    } else {
      const assignedIds = this.shareTargetType === 'batch'
        ? [...(this.sharingMaterial.batch_target_ids || []), ...(this.sharingMaterial.targetType === 'batch' ? this.sharingMaterial.targetIds || [] : [])]
        : [...(this.sharingMaterial.student_target_ids || []), ...(this.sharingMaterial.targetType === 'student' ? this.sharingMaterial.targetIds || [] : [])];
      options = options.filter(opt => assignedIds.map(String).includes(String(opt.id)));
    }

    // Filter by Search Query
    if (this.studentSearchQuery) {
      const q = this.studentSearchQuery.toLowerCase();
      options = options.filter(opt =>
        (opt.name || opt.batchName || '').toLowerCase().includes(q) ||
        (opt.regNumber || '').toLowerCase().includes(q)
      );
    }

    return options;
  }

  toggleTargetSelection(id: string) {
    const idx = this.selectedTargetIds.indexOf(id);
    if (idx > -1) {
      this.selectedTargetIds.splice(idx, 1);
    } else {
      this.selectedTargetIds.push(id);
    }
  }

  revokeAccess(id: string) {
    if (!this.sharingMaterial) return;
    if (confirm('Are you sure you want to revoke access?')) {
      const assignedIds = this.shareTargetType === 'batch'
        ? [...(this.sharingMaterial.batch_target_ids || [])]
        : [...(this.sharingMaterial.student_target_ids || [])];

      const newIds = assignedIds.filter(i => i !== id);

      const batchIds = this.shareTargetType === 'batch' ? newIds : (this.sharingMaterial.batch_target_ids || []);
      const studentIds = this.shareTargetType === 'one-one' ? newIds : (this.sharingMaterial.student_target_ids || []);

      const payload = {
        ...this.sharingMaterial,
        target_type: (batchIds.length > 0 && studentIds.length > 0) ? 'mixed' : (batchIds.length > 0 ? 'batch' : 'student'),
        target_ids: JSON.stringify(newIds),
        batch_target_ids: JSON.stringify(batchIds),
        student_target_ids: JSON.stringify(studentIds)
      };

      this.dataService.saveStudyMaterial(payload).subscribe(() => {
        this.loadMaterials();
        this.toastService.success('Access revoked');
        // Refresh local state
        if (this.sharingMaterial) {
          if (this.shareTargetType === 'batch') {
            this.sharingMaterial.batch_target_ids = newIds;
          } else {
            this.sharingMaterial.student_target_ids = newIds;
          }
        }
        this.updateShareSelection();
      });
    }
  }

  confirmShare() {
    if (!this.sharingMaterial) return;

    // For "Unassigned" tab, we APPEND to existing IDs.
    // For "Assigned" tab (if we were re-saving), we'd just use current selection.
    // But usually for Unassigned, you select NEW ones.

    const currentAssigned = this.shareTargetType === 'batch'
      ? (this.sharingMaterial.batch_target_ids || [])
      : (this.sharingMaterial.student_target_ids || []);

    const finalIds = Array.from(new Set([...currentAssigned, ...this.selectedTargetIds]));

    // Ensure all target ID fields are stringified for the backend
    const batchIds = this.shareTargetType === 'batch' ? finalIds : (this.sharingMaterial.batch_target_ids || []);
    const studentIds = this.shareTargetType === 'one-one' ? finalIds : (this.sharingMaterial.student_target_ids || []);

    const payload = {
      ...this.sharingMaterial,
      target_type: this.shareTargetType === 'batch' ? 'batch' : (this.sharingMaterial.student_target_ids?.length || studentIds.length > 0 ? 'mixed' : 'student'),
      target_ids: JSON.stringify(finalIds),
      batch_target_ids: JSON.stringify(batchIds),
      student_target_ids: JSON.stringify(studentIds)
    };

    this.dataService.saveStudyMaterial(payload).subscribe({
      next: () => {
        this.isShareModalOpen = false;
        this.loadMaterials();
        this.toastService.success('Sharing settings updated successfully');
      },
      error: () => this.toastService.error('Failed to share material')
    });
  }

  viewMaterial(material: StudyMaterial) {
    this.sharingMaterial = material;
    this.isViewModalOpen = true;
  }

  deleteMaterial(id: string) {
    if (confirm('Are you sure you want to delete this study material?')) {
      this.dataService.deleteStudyMaterial(id).subscribe(() => {
        this.loadMaterials();
        this.toastService.success('Material deleted');
      });
    }
  }

  getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('officedocument')) return '📝';
    if (type.includes('zip') || type.includes('compressed')) return '📦';
    return '📁';
  }

  openFile(url: string) {
    const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
    const fullUrl = url.startsWith('http') ? url : `http://localhost:8081/${normalizedUrl}`;
    window.open(fullUrl, '_blank');
  }
}
