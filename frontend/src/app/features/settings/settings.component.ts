import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { DataService } from '../../services/data.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';
import { BranchContextService } from '../../services/branch-context.service';

import { ModalComponent } from '../../shared/ui/modal.component';
import {
    Student, Course, Batch, FeeRecord, AttendanceRecord, Staff,
    DashboardStats, RecentActivity, QuestionBankItem, StudyMaterial, Expense, Branch
} from '../../models';

type SettingsSection = 'general' | 'info' | 'automation' | 'operations';
type GeneralPage = 'overview' | 'notifications' | 'appearance';
type AutomationPage = 'student-id' | 'staff-id' | 'course-id';
type InfoPage = 'institute-profile' | 'contact' | 'social';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: 'settings.component.html'
})
export class SettingsComponent implements OnInit {
  activeSection: SettingsSection = 'general';
  activePage: string = 'overview';
  saveStatus: '' | 'saving' | 'saved' | 'error' = '';
  loading = true;

  // Institute profile fields
  profile = {
    name: '',
    registrationId: '',
    email: '',
    phone: '',
    address: '',
    logoPath: ''
  };

  // ID Automation Settings
  regSettings = {
    prefix: 'STU',
    suffix: '',
    startFrom: 1,
    mode: 'auto' as 'auto' | 'manual',
    lastNumber: 0
  };

  staffSettings = {
    prefix: 'STF',
    suffix: '',
    startFrom: 1,
    mode: 'auto' as 'auto' | 'manual',
    lastNumber: 0
  };

  courseSettings = {
    prefix: 'CRS',
    suffix: '',
    startFrom: 1,
    mode: 'auto' as 'auto' | 'manual',
    lastNumber: 0
  };

  regPreview = '';
  staffPreview = '';
  coursePreview = '';

  // Appearance
  appearance = {
    color: '#3b82f6',
    mode: 'dark' as 'dark'
  };

  // Bulk Completion
  bulkComplete = {
    regStart: '',
    regEnd: '',
    status: 'saving' as any
  };

  advancedSettings = {
    adminAsStaff: false,
    allowPerformanceExams: false,
    enableMultipleBranches: false,
    enableStandardCourses: false
  };

  // Custom Fields
  customFields: any[] = [];
  isCustomFieldModalOpen = false;
  editingField: any = null;
  newField = {
    location: 'student',
    field_label: '',
    field_type: 'text',
    is_required: false,
    options: ''
  };

  locations = [
    { id: 'student', name: 'Student Creation' },
    { id: 'course', name: 'Course Creation' },
    { id: 'batch', name: 'Batch Creation' },
    { id: 'question_template', name: 'Question Template' },
    { id: 'internal_exam', name: 'Internal Exam' },
    { id: 'external_exam', name: 'External Exam' },
    { id: 'invite_external', name: 'Invite External' },
    { id: 'expense', name: 'Expense' },
    { id: 'staff', name: 'Staff' },
    { id: 'collect_fee', name: 'Collect Fee' },
    { id: 'schedule_class', name: 'Schedule Class' },
    { id: 'substitute_schedule', name: 'Substitute Schedule' },
    { id: 'study_material', name: 'Study Material' }
  ];

  colorPresets = [
    { name: 'Blue', hex: '#3b82f6', class: 'bg-[#3b82f6]' },
    { name: 'Purple', hex: '#8b5cf6', class: 'bg-[#8b5cf6]' },
    { name: 'Green', hex: '#10b981', class: 'bg-[#10b981]' },
    { name: 'Rose', hex: '#f43f5e', class: 'bg-[#f43f5e]' },
    { name: 'Amber', hex: '#f59e0b', class: 'bg-[#f59e0b]' }
  ];

  // Branch Management
  branches: Branch[] = [];
  isBranchModalOpen = false;
  editingBranch: Branch | null = null;
  newBranch: Branch = {
    name: '',
    code: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    phone: '',
    email: '',
    isMain: false,
    status: 'active'
  };

  constructor(
    private dataService: DataService,
    private themeService: ThemeService,
    private toastService: ToastService,
    private branchContext: BranchContextService,
    public authService: AuthService
  ) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(user => {
      if (this.isStaffOrStudent(user)) {
        this.activeSection = 'general';
        this.activePage = 'appearance';
      }
    });

    this.dataService.getSettings().subscribe({
      next: s => {
        if (s) {
          this.profile.name = s.institute_name || 'Elite Tech Academy';
          this.profile.registrationId = s.registration_id || 'REG-2024-8892';
          this.profile.email = s.email || 'contact@institute.com';
          this.profile.phone = s.phone || '+91 98765 43210';
          this.profile.address = s.address || '';
          this.profile.logoPath = s.logo_path || '';
          this.regSettings.prefix = s.reg_prefix || 'STU';
          this.regSettings.suffix = s.reg_suffix || '';
          this.regSettings.startFrom = Number(s.reg_start_from) || 1;
          this.regSettings.mode = (s.reg_mode as 'auto' | 'manual') || 'auto';
          this.regSettings.lastNumber = Number(s.reg_last_number) || 0;

          this.staffSettings.prefix = s.staff_id_prefix || 'STF';
          this.staffSettings.suffix = s.staff_id_suffix || '';
          this.staffSettings.startFrom = Number(s.staff_id_start_from) || 1;
          this.staffSettings.mode = (s.staff_id_mode as 'auto' | 'manual') || 'auto';
          this.staffSettings.lastNumber = Number(s.staff_id_last_number) || 0;

          this.courseSettings.prefix = s.course_id_prefix || 'CRS';
          this.courseSettings.suffix = s.course_id_suffix || '';
          this.courseSettings.startFrom = Number(s.course_id_start_from) || 1;
          this.courseSettings.mode = (s.course_id_mode as 'auto' | 'manual') || 'auto';
          this.courseSettings.lastNumber = Number(s.course_id_last_number) || 0;

          this.appearance.color = s.appearance_color || '#3b82f6';
          this.appearance.mode = 'dark';
          this.advancedSettings.adminAsStaff = s.admin_as_staff == 1;
          this.advancedSettings.allowPerformanceExams = s.allow_performance_exams == 1;
          this.advancedSettings.enableMultipleBranches = s.enableMultipleBranches || s.enable_multiple_branches == 1;
          this.advancedSettings.enableStandardCourses = s.enableStandardCourses == 1 || s.enable_standard_courses == 1;
        }
        this.updatePreview('student');
        this.updatePreview('staff');
        this.updatePreview('course');
        this.loadCustomFields();
        if (this.advancedSettings.enableMultipleBranches) {
          this.loadBranches();
        }
        this.loading = false;
      },
      error: () => this.loading = false
    });
  }

  isStaffOrStudent(user: any): boolean {
    const role = (user?.role_name || user?.role || '').trim().toLowerCase();
    return role === 'staff' || role === 'student';
  }

  getUserRole(): string {
    const user = this.authService.currentUserValue;
    return (user?.role_name || user?.role || '').trim().toLowerCase();
  }

  setSection(s: SettingsSection, defaultPage?: string) {
    if (this.isStaffOrStudent(this.authService.currentUserValue)) return;
    this.activeSection = s;
    if (defaultPage) this.activePage = defaultPage;
    else this.activePage = s === 'general' ? 'overview' : 'institute-profile';
  }

  setPage(p: string) { 
    if (this.isStaffOrStudent(this.authService.currentUserValue) && p !== 'appearance') return;
    this.activePage = p; 
  }

  updatePreview(type: 'student' | 'staff' | 'course') {
    let settings: any;
    let previewVar: string;

    if (type === 'student') {
      settings = this.regSettings;
      previewVar = 'regPreview';
    } else if (type === 'staff') {
      settings = this.staffSettings;
      previewVar = 'staffPreview';
    } else {
      settings = this.courseSettings;
      previewVar = 'coursePreview';
    }

    const pad = String(Math.max(settings.lastNumber + 1, settings.startFrom)).padStart(3, '0');
    const p = settings.prefix ? settings.prefix + '-' : '';
    const s = settings.suffix ? '-' + settings.suffix : '';
    (this as any)[previewVar] = p + pad + s;
  }

  saveProfile() {
    this.saveStatus = 'saving';
    const payload = {
      institute_name: this.profile.name,
      registration_id: this.profile.registrationId,
      email: this.profile.email,
      phone: this.profile.phone,
      address: this.profile.address,
      logo_path: this.profile.logoPath
    };
    this.dataService.saveSettings(payload).subscribe({
      next: () => { this.saveStatus = 'saved'; setTimeout(() => this.saveStatus = '', 2500); },
      error: () => { this.saveStatus = 'error'; setTimeout(() => this.saveStatus = '', 3000); }
    });
  }

  triggerLogoUpload() {
    const fileInput = document.getElementById('logoInput') as HTMLInputElement;
    if (fileInput) fileInput.click();
  }

  onLogoSelected(event: any) {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        this.toastService.error('Logo file size must be less than 2MB');
        return;
      }
      this.saveStatus = 'saving';
      this.dataService.uploadLogo(file).subscribe({
        next: (res) => {
          this.profile.logoPath = res.file_path;
          this.saveStatus = 'saved';
          this.toastService.success('Logo uploaded successfully! Click "Save Profile" to commit changes.');
          setTimeout(() => this.saveStatus = '', 2000);
        },
        error: (err) => {
          this.saveStatus = 'error';
          this.toastService.error('Failed to upload logo.');
          setTimeout(() => this.saveStatus = '', 3000);
        }
      });
    }
  }

  removeLogo() {
    if (confirm('Are you sure you want to remove the institute logo?')) {
      this.profile.logoPath = '';
      this.toastService.info('Logo removed. Remember to save your profile.');
    }
  }

  saveAutomationSettings(type: 'student' | 'staff' | 'course') {
    this.saveStatus = 'saving';
    let payload: any = {};

    if (type === 'student') {
      payload = {
        reg_prefix: this.regSettings.prefix,
        reg_suffix: this.regSettings.suffix,
        reg_start_from: this.regSettings.startFrom,
        reg_mode: this.regSettings.mode,
        reg_last_number: this.regSettings.lastNumber
      };
    } else if (type === 'staff') {
      payload = {
        staff_id_prefix: this.staffSettings.prefix,
        staff_id_suffix: this.staffSettings.suffix,
        staff_id_start_from: this.staffSettings.startFrom,
        staff_id_mode: this.staffSettings.mode,
        staff_id_last_number: this.staffSettings.lastNumber
      };
    } else {
      payload = {
        course_id_prefix: this.courseSettings.prefix,
        course_id_suffix: this.courseSettings.suffix,
        course_id_start_from: this.courseSettings.startFrom,
        course_id_mode: this.courseSettings.mode,
        course_id_last_number: this.courseSettings.lastNumber
      };
    }

    this.dataService.saveSettings(payload).subscribe({
      next: () => { this.saveStatus = 'saved'; setTimeout(() => this.saveStatus = '', 2500); },
      error: () => { this.saveStatus = 'error'; setTimeout(() => this.saveStatus = '', 3000); }
    });
  }

  selectTheme(color: string) {
    this.appearance.color = color;
    this.themeService.applySettings({ appearance_color: color });
  }

  selectMode(mode: 'dark' = 'dark') {
    this.appearance.mode = 'dark';
    this.themeService.applySettings({ appearance_mode: 'dark' });
  }

  saveAppearance() {
    this.saveStatus = 'saving';
    const payload = {
      appearance_color: this.appearance.color,
      appearance_mode: 'dark'
    };
    this.dataService.saveSettings(payload).subscribe({
      next: () => { this.saveStatus = 'saved'; setTimeout(() => this.saveStatus = '', 2500); },
      error: () => { this.saveStatus = 'error'; setTimeout(() => this.saveStatus = '', 3000); }
    });
  }

  onBulkComplete() {
    if (!this.bulkComplete.regStart || !this.bulkComplete.regEnd) {
      this.toastService.warning('Please provide both Start and End Register Numbers');
      return;
    }
    if (confirm(`Are you sure you want to mark all students from ${this.bulkComplete.regStart} to ${this.bulkComplete.regEnd} as course completed?`)) {
      this.saveStatus = 'saving';
      this.dataService.markCompleted({
        reg_start: this.bulkComplete.regStart,
        reg_end: this.bulkComplete.regEnd
      }).subscribe({
        next: () => {
          this.saveStatus = 'saved';
          this.bulkComplete.regStart = '';
          this.bulkComplete.regEnd = '';
          setTimeout(() => this.saveStatus = '', 2500);
          this.toastService.success('Bulk completion process completed successfully.');
        },
        error: () => {
          this.saveStatus = 'error';
          setTimeout(() => this.saveStatus = '', 3000);
          this.toastService.error('Failed to process bulk completion.');
        }
      });
    }
  }

  saveAdvancedSettings() {
    this.saveStatus = 'saving';
    const enableMultipleBranches = this.advancedSettings.enableMultipleBranches ? 1 : 0;
    const enableStandardCourses = this.advancedSettings.enableStandardCourses ? 1 : 0;
    const payload = {
      admin_as_staff: this.advancedSettings.adminAsStaff ? 1 : 0,
      allow_performance_exams: this.advancedSettings.allowPerformanceExams ? 1 : 0,
      // Keep snake_case for backwards compatibility; also send camelCase for the Spring Boot backend.
      enable_multiple_branches: enableMultipleBranches,
      enableMultipleBranches: enableMultipleBranches,
      enable_standard_courses: enableStandardCourses,
      enableStandardCourses: enableStandardCourses
    };
    this.dataService.saveSettings(payload).subscribe({
      next: () => {
        this.saveStatus = 'saved';
        this.toastService.success('Advanced settings saved! Reloading...');
        setTimeout(() => window.location.reload(), 1500);
      },
      error: () => { 
        this.saveStatus = 'error'; 
        setTimeout(() => this.saveStatus = '', 3000); 
      }
    });
  }

  // Custom Fields Methods
  loadCustomFields() {
    this.dataService.getCustomFields().subscribe(fields => {
      this.customFields = fields;
    });
  }

  openCustomFieldModal(field?: any) {
    if (field) {
      this.editingField = { ...field };
      this.newField = { ...field };
    } else {
      this.editingField = null;
      this.newField = {
        location: 'student',
        field_label: '',
        field_type: 'text',
        is_required: false,
        options: ''
      };
    }
    this.isCustomFieldModalOpen = true;
  }

  saveCustomField() {
    if (!this.newField.field_label) {
      this.toastService.warning('Field label is required');
      return;
    }
    this.saveStatus = 'saving';
    const fieldId = (this.newField as any).id;
    const payload = {
      ...this.newField,
      id: fieldId,
      fieldId: fieldId,            // camelCase variant
      field_id: fieldId,          // Variant id 2
      custom_field_id: fieldId,   // Variant id 3
      label: this.newField.field_label,      // Legacy alias 1
      fieldLabel: this.newField.field_label, // camelCase variant
      name: this.newField.field_label,       // Legacy alias 2
      field_name: this.newField.field_label, // Legacy alias 3
      type: this.newField.field_type,        // Legacy alias 4
      fieldType: this.newField.field_type,   // camelCase variant
      input_type: this.newField.field_type,  // Legacy alias 5
      inputType: this.newField.field_type,   // camelCase variant
      is_required: this.newField.is_required ? 1 : 0,
      isRequired: this.newField.is_required ? 1 : 0  // camelCase variant
    };
    this.dataService.saveCustomField(payload).subscribe({
      next: () => {
        this.saveStatus = 'saved';
        this.isCustomFieldModalOpen = false;
        this.loadCustomFields();
        setTimeout(() => this.saveStatus = '', 2500);
      },
      error: () => {
        this.saveStatus = 'error';
        setTimeout(() => this.saveStatus = '', 3000);
      }
    });
  }

  deleteCustomField(id: string) {
    if (confirm('Are you sure you want to delete this custom field? All saved data for this field will be lost.')) {
      this.dataService.deleteCustomField(id).subscribe(() => {
        this.loadCustomFields();
      });
    }
  }

  getFieldsByLocation(loc: string) {
    return this.customFields.filter(f => f.location === loc);
  }

  // Branch Management Methods
  loadBranches() {
    this.dataService.getBranches().subscribe(branches => {
      this.branches = branches;
    });
  }

  openBranchModal(branch?: Branch) {
    if (branch) {
      this.editingBranch = branch;
      this.newBranch = { ...branch };
    } else {
      this.editingBranch = null;
      this.newBranch = {
        name: '',
        code: '',
        address: '',
        city: '',
        state: '',
        pincode: '',
        phone: '',
        email: '',
        isMain: false,
        status: 'active'
      };
    }
    this.isBranchModalOpen = true;
  }

  saveBranch() {
    if (!this.newBranch.name || !this.newBranch.code) {
      this.toastService.warning('Branch name and code are required');
      return;
    }
    this.saveStatus = 'saving';
    this.dataService.saveBranch(this.newBranch).subscribe({
      next: () => {
        this.saveStatus = 'saved';
        this.isBranchModalOpen = false;
        this.loadBranches();
        this.branchContext.refreshContext();
        this.toastService.success(`Branch ${this.editingBranch ? 'updated' : 'created'} successfully!`);
        setTimeout(() => this.saveStatus = '', 2500);
      },
      error: () => {
        this.saveStatus = 'error';
        this.toastService.error('Failed to save branch.');
        setTimeout(() => this.saveStatus = '', 3000);
      }
    });
  }

  deleteBranch(id: any) {
    const branch = this.branches.find(b => b.id === id);
    if (branch?.isMain) {
      this.toastService.error('Main branch cannot be deleted. Set another branch as main first.');
      return;
    }
    if (confirm('Are you sure you want to delete this branch? This action cannot be undone.')) {
      this.dataService.deleteBranch(id).subscribe({
        next: () => {
          this.loadBranches();
          this.toastService.success('Branch deleted successfully');
        },
        error: () => this.toastService.error('Failed to delete branch')
      });
    }
  }

  setMainBranch(id: any) {
    if (confirm('Set this branch as the primary (main) branch?')) {
      this.dataService.setMainBranch(id).subscribe({
        next: () => {
          this.loadBranches();
          this.branchContext.refreshContext();
          this.toastService.success('Main branch updated successfully');
        },
        error: () => this.toastService.error('Failed to set main branch')
      });
    }
  }

  getImageUrl(imagePath: string | undefined): string {
    if (!imagePath) return '';
    if (imagePath.startsWith('http')) return imagePath;
    const normalizedPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
    return `http://localhost:8081/${normalizedPath}`;
  }
}
