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
import { GDriveImagePipe } from '../../shared/pipes/gdrive.pipe';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [CommonModule, BadgeComponent, ModalComponent, FormsModule, CustomFieldsRendererComponent, GDriveImagePipe, DatePickerComponent],
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
  enableStandardCourses = false;

  newCourse: Partial<Course> = this.getInitialCourse();

  availableDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  durationValue: number | null = 6;
  durationUnit: 'Days' | 'Weeks' | 'Months' | 'Years' = 'Months';

  getInitialCourse(): Partial<Course> {
    return {
      name: '',
      description: '',
      category: '',
      duration: '6 Months',
      fees: 0,
      status: 'active',
      course_id: '',
      courseType: 'self',
      scheduleType: 'Weekdays',
      customDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
      isOnline: false,
      validFrom: '',
      validTo: '',
      subjects: [],
      feePeriod: 'course',
      imagePath: ''
    };
  }

  constructor(private dataService: DataService, private toastService: ToastService) { }

  ngOnInit() {
    this.loadCourses();
    this.dataService.getCustomFields('course').subscribe(fields => {
      this.customFields = fields;
    });
    this.dataService.getSettings().subscribe(settings => {
      this.enableStandardCourses = settings.enableStandardCourses == 1 || settings.enable_standard_courses == 1;
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
    this.newCourse = this.getInitialCourse();
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
    this.durationValue = 6;
    this.durationUnit = 'Months';
    this.updateDurationString();
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

  parseDuration(durationStr?: string) {
    if (!durationStr || !durationStr.trim()) {
      this.durationValue = null;
      this.durationUnit = 'Months';
      this.updateDurationString();
      return;
    }
    const match = durationStr.trim().match(/^(\d+)\s*(.*)$/);
    if (match) {
      this.durationValue = parseInt(match[1], 10);
      const unitPart = match[2].toLowerCase();
      if (unitPart.startsWith('day')) {
        this.durationUnit = 'Days';
      } else if (unitPart.startsWith('week')) {
        this.durationUnit = 'Weeks';
      } else if (unitPart.startsWith('year')) {
        this.durationUnit = 'Years';
      } else {
        this.durationUnit = 'Months';
      }
    } else {
      this.durationValue = null;
      this.durationUnit = 'Months';
    }
    this.updateDurationString();
  }

  updateDurationString() {
    if (this.durationValue !== null && this.durationValue !== undefined && this.durationValue > 0) {
      this.newCourse.duration = `${this.durationValue} ${this.durationUnit}`;
    } else {
      this.newCourse.duration = '';
    }
  }

  isDatedCourseType(type?: string): boolean {
    if (!type) return false;
    const t = type.toLowerCase();
    return t === 'seasonal' || t === 'workshop' || t === 'camp' || t === 'bootcamp';
  }

  calculateCourseStatus() {
    if (this.isDatedCourseType(this.newCourse.courseType) && this.newCourse.validFrom && this.newCourse.validTo) {
      const today = new Date().toISOString().split('T')[0];
      if (today < this.newCourse.validFrom) {
        this.newCourse.status = 'upcoming';
      } else if (today > this.newCourse.validTo) {
        this.newCourse.status = 'inactive';
      } else {
        this.newCourse.status = 'active';
      }
    }
  }

  editCourse(course: Course) {
    this.editingCourse = true;
    const rawCourseType = course.courseType ?? course.course_type ?? 'self';
    const rawFeePeriod = course.feePeriod ?? course.fee_period ?? 'course';
    const rawScheduleType = course.scheduleType ?? (course as any).schedule_type ?? 'Weekdays';
    const rawIsOnline = course.isOnline ?? (course as any).is_online ?? false;
    let rawValidFrom = String(course.validFrom ?? (course as any).valid_from ?? '').trim();
    let rawValidTo = String(course.validTo ?? (course as any).valid_to ?? '').trim();
    if (rawValidFrom.includes('T')) rawValidFrom = rawValidFrom.split('T')[0];
    if (rawValidTo.includes('T')) rawValidTo = rawValidTo.split('T')[0];
    
    let parsedCustomDays: string[] = [];
    const rawCustomDays = course.customDays ?? (course as any).custom_days;
    if (Array.isArray(rawCustomDays)) {
      parsedCustomDays = rawCustomDays;
    } else if (typeof rawCustomDays === 'string' && rawCustomDays.trim()) {
      try {
        const parsed = JSON.parse(rawCustomDays);
        parsedCustomDays = Array.isArray(parsed) ? parsed : rawCustomDays.split(',').map(d => d.trim());
      } catch {
        parsedCustomDays = rawCustomDays.split(',').map(d => d.trim());
      }
    }

    this.newCourse = {
      ...course,
      course_id: course.course_id ?? (course as any).courseId ?? '',
      courseType: rawCourseType,
      feePeriod: rawFeePeriod as any,
      scheduleType: rawScheduleType as any,
      customDays: parsedCustomDays,
      isOnline: !!rawIsOnline,
      validFrom: rawValidFrom,
      validTo: rawValidTo,
      subjects: this.parseSubjects(course.subjects)
    };
    this.parseDuration(course.duration);
    this.calculateCourseStatus();
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

    if (this.isDatedCourseType(this.newCourse.courseType)) {
      if (!this.newCourse.validFrom || !this.newCourse.validTo) {
        this.toastService.warning('Please select From Date and To Date for ' + this.getCourseTypeLabel(this.newCourse.courseType) + '.');
        return;
      }
      if (this.newCourse.validFrom > this.newCourse.validTo) {
        this.toastService.warning('Valid From Date cannot be after Valid To Date.');
        return;
      }
      this.calculateCourseStatus();
    }

    // Merge custom fields
    if (this.customFieldsRenderer) {
      (this.newCourse as any).custom_fields = this.customFieldsRenderer.getValues();
    }

    const payload: any = { ...this.newCourse };
    if (payload.courseType === 'standard') {
      const sum = (payload.subjects || []).reduce((acc: number, s: any) => acc + (Number(s.fees) || 0), 0);
      payload.fees = sum;
    }
    payload.subjects = JSON.stringify(payload.subjects || []);

    if (Array.isArray(payload.customDays)) {
      payload.customDays = JSON.stringify(payload.customDays);
      payload.custom_days = payload.customDays;
    }
    payload.schedule_type = payload.scheduleType;
    payload.is_online = payload.isOnline;
    payload.valid_from = payload.validFrom;
    payload.valid_to = payload.validTo;

    this.isSavingCourse = true;
    this.dataService.addCourse(payload).subscribe({
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

  getCourseTypeLabel(type?: string): string {
    if (!type || type === 'self' || type === 'regular_self') return 'Regular / Self Course';
    if (type === 'crash') return 'Crash Course';
    if (type === 'seasonal') return 'Seasonal';
    if (type === 'workshop') return 'Workshop';
    if (type === 'camp') return 'Camp';
    if (type === 'bootcamp') return 'Bootcamp';
    if (type === 'standard') return 'Standard Course';
    return type;
  }

  isDaySelected(day: string): boolean {
    if (!this.newCourse.customDays || !Array.isArray(this.newCourse.customDays)) {
      return false;
    }
    return this.newCourse.customDays.includes(day);
  }

  toggleDay(day: string) {
    if (!Array.isArray(this.newCourse.customDays)) {
      this.newCourse.customDays = [];
    }
    const idx = this.newCourse.customDays.indexOf(day);
    if (idx > -1) {
      this.newCourse.customDays.splice(idx, 1);
    } else {
      this.newCourse.customDays.push(day);
    }
  }

  onScheduleTypeChange() {
    if (this.newCourse.scheduleType === 'Weekdays') {
      this.newCourse.customDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    } else if (this.newCourse.scheduleType === 'Weekends') {
      this.newCourse.customDays = ['Sat', 'Sun'];
    } else if (this.newCourse.scheduleType === 'All Days' || this.newCourse.scheduleType === 'Weekdays + Weekends') {
      this.newCourse.customDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    } else if (this.newCourse.scheduleType === 'WeekDays + Saturday') {
      this.newCourse.customDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    }
  }

  getScheduleSummary(course: Course): string {
    const st = course.scheduleType ?? (course as any).schedule_type ?? 'Weekdays';
    if (st === 'Custom Days') {
      let daysArr: string[] = [];
      const cd = course.customDays ?? (course as any).custom_days;
      if (Array.isArray(cd)) daysArr = cd;
      else if (typeof cd === 'string' && cd.trim()) {
        try {
          const parsed = JSON.parse(cd);
          daysArr = Array.isArray(parsed) ? parsed : cd.split(',');
        } catch {
          daysArr = cd.split(',');
        }
      }
      return daysArr.length > 0 ? daysArr.join(', ') : 'Custom Days';
    }
    return st;
  }

  onCourseTypeChange() {
    this.calculateCourseStatus();
    if (this.newCourse.courseType === 'standard' && (!this.newCourse.subjects || this.newCourse.subjects.length === 0)) {
      this.newCourse.subjects = [
        { name: 'Tamil', fees: 0 },
        { name: 'English', fees: 0 },
        { name: 'Maths', fees: 0 },
        { name: 'Science', fees: 0 },
        { name: 'Social Science', fees: 0 }
      ];
    }
  }

  parseSubjects(value: any): any[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      if (typeof value === 'string') {
        return value.split(',').map(s => ({ name: s.trim(), fees: 0 }));
      }
      return [];
    }
  }

  addSubject() {
    if (!this.newCourse.subjects) {
      this.newCourse.subjects = [];
    }
    this.newCourse.subjects.push({ name: '', fees: 0 });
  }

  removeSubject(index: number) {
    if (this.newCourse.subjects) {
      this.newCourse.subjects.splice(index, 1);
    }
  }

  getSubjectsSum(): number {
    return (this.newCourse.subjects || []).reduce((acc: number, s: any) => acc + (Number(s.fees) || 0), 0);
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
    // Handle spaces and special characters in filenames
    const encodedPath = encodeURI(normalizedPath);
    return `${this.dataService.getServerUrl()}/${encodedPath}`;
  }

  removeImage() {
    this.newCourse.imagePath = undefined;
    this.selectedImageName = '';
  }

  removeSyllabus() {
    this.newCourse.syllabusPath = undefined;
    this.selectedFileName = '';
  }

  isImporting = false;

  toggleGuidance() {
    this.isGuidanceOpen = !this.isGuidanceOpen;
  }

  triggerImport() {
    this.isImportModalOpen = true;
    this.isImporting = false;
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
    if (this.isImporting) return;

    this.isImporting = true;
    const reader = new FileReader();
    reader.onload = async (e: any) => {
      try {
        const bstr = e.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        if (data.length === 0) {
          this.toastService.warning('The uploaded file is empty.');
          this.isImporting = false;
          return;
        }

        let imported = 0;
        let skipped = 0;
        for (const [index, row] of data.entries()) {
          const name = this.readImportValue(row, ['Name', 'name', 'Course Name', 'course_name']);
          const duration = this.readImportValue(row, ['Duration', 'duration']);
          const rawFees = Number(row['Fees'] ?? row['fees'] ?? row['Fee'] ?? row['fee'] ?? row['Course Fee'] ?? 0);

          if (!name) {
            console.warn(`Row ${index + 2} skipped: Name is missing.`);
            skipped++;
            continue;
          }

          const rawCourseType = this.readImportValue(row, ['Course Type', 'course_type', 'Type', 'type']);
          const courseType = this.normalizeImportCourseType(rawCourseType);
          const parsedSubj = this.parseImportSubjects(row, rawFees);

          const validFrom = this.normalizeImportDate(this.readImportValue(row, ['Valid From', 'valid_from', 'Start Date', 'start_date', 'From Date', 'from_date']));
          const validTo = this.normalizeImportDate(this.readImportValue(row, ['Valid To', 'valid_to', 'End Date', 'end_date', 'To Date', 'to_date']));

          const scheduleTypeInput = this.readImportValue(row, ['Schedule Type', 'schedule_type', 'Schedule', 'schedule']) || 'Weekdays';
          const customDaysText = this.readImportValue(row, ['Custom Days', 'custom_days', 'Class Days', 'class_days', 'Days', 'days']);

          let scheduleType = scheduleTypeInput;
          if (customDaysText && (scheduleTypeInput.toLowerCase().includes('custom') || scheduleTypeInput === 'Weekdays')) {
            scheduleType = 'Custom Days';
          }

          const parsedCustomDays = this.parseImportCustomDays(customDaysText, scheduleType);

          let status = (this.readImportValue(row, ['Status', 'status']) || '').toLowerCase();
          if (!status) {
            if (validFrom && validTo) {
              const today = new Date().toISOString().split('T')[0];
              if (today < validFrom) {
                status = 'upcoming';
              } else if (today > validTo) {
                status = 'inactive';
              } else {
                status = 'active';
              }
            } else {
              status = 'active';
            }
          }

          const rawFeePeriod = this.readImportValue(row, ['Fee Period', 'fee_period', 'Fees Type', 'fees_type', 'Fee Type', 'fee_type', 'Billing Period', 'billing_period']);
          const feePeriod = this.normalizeImportFeePeriod(rawFeePeriod);

          const course: any = {
            course_id: this.readImportValue(row, ['Course ID', 'course_id', 'Course Code', 'course_code', 'id']),
            name: name,
            description: this.readImportValue(row, ['Description', 'description']),
            category: this.readImportValue(row, ['Category', 'category']) || 'General',
            duration: duration || '3 Months',
            fees: courseType === 'standard' && parsedSubj.calculatedFees > 0 ? parsedSubj.calculatedFees : rawFees,
            course_type: courseType,
            schedule_type: scheduleType,
            scheduleType: scheduleType,
            custom_days: JSON.stringify(parsedCustomDays),
            customDays: JSON.stringify(parsedCustomDays),
            fee_period: feePeriod,
            feePeriod: feePeriod,
            status: status,
            is_online: ['yes', 'true', '1', 'online'].includes(this.readImportValue(row, ['Is Online', 'is_online', 'Online', 'online', 'Mode', 'mode']).toLowerCase()),
            valid_from: validFrom,
            validFrom: validFrom,
            valid_to: validTo,
            validTo: validTo,
            subjects: JSON.stringify(parsedSubj.subjects)
          };

          // Map Custom Fields
          const customValues: any = {};
          this.customFields.forEach(cf => {
            const val = row[cf.label] ?? row[cf.field_name];
            if (val !== undefined && val !== null) {
              customValues[cf.id] = val;
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
            skipped++;
          }
        }

        this.isImporting = false;
        this.isImportModalOpen = false;
        this.importFile = null;
        this.loadCourses();

        if (imported > 0) {
          this.importedCount = imported;
          this.toastService.success(`${imported} courses imported successfully.${skipped > 0 ? ` (${skipped} skipped)` : ''}`);
          this.showSuccess = true;
          setTimeout(() => this.showSuccess = false, 3500);
        } else {
          this.toastService.error('No courses were imported. Please check file columns.');
        }
      } catch (err) {
        this.isImporting = false;
        this.toastService.error('Error reading import file.');
      }
    };
    reader.readAsBinaryString(this.importFile);
  }

  downloadSampleXls() {
    const sampleData: any[] = [
      {
        'Course ID': 'CRS-101',
        'Name': 'Full Stack Web Development',
        'Category': 'Software & Coding',
        'Duration': '6 Months',
        'Fees': 25000,
        'Course Type': 'master',
        'Schedule Type': 'Weekdays',
        'Custom Days': '',
        'Fee Period': 'course',
        'Is Online': 'No',
        'Valid From': '',
        'Valid To': '',
        'Description': 'Comprehensive full stack web developer course covering React, Node, SQL.',
        'Status': 'active',
        'Subjects': '',
        'Subject Fees': ''
      },
      {
        'Course ID': 'CRS-102',
        'Name': '10th Standard State Board Tuition',
        'Category': 'School Tuition',
        'Duration': '1 Year',
        'Fees': 6200,
        'Course Type': 'standard',
        'Schedule Type': 'Weekdays',
        'Custom Days': '',
        'Fee Period': 'monthly',
        'Is Online': 'No',
        'Valid From': '',
        'Valid To': '',
        'Description': 'Complete 10th grade syllabus tuition covering all core subjects.',
        'Status': 'active',
        'Subjects': 'Tamil:1000, English:1000, Maths:1500, Science:1500, Social Science:1200',
        'Subject Fees': '1000, 1000, 1500, 1500, 1200'
      },
      {
        'Course ID': 'CRS-103',
        'Name': 'NEET 30-Day Crash Revision',
        'Category': 'Entrance Exam',
        'Duration': '1 Month',
        'Fees': 12000,
        'Course Type': 'crash',
        'Schedule Type': 'Weekdays',
        'Custom Days': '',
        'Fee Period': 'course',
        'Is Online': 'Yes',
        'Valid From': '2026-04-01',
        'Valid To': '2026-04-30',
        'Description': 'Fast-track revision and mock tests for NEET aspirants.',
        'Status': 'active',
        'Subjects': 'Physics:4000, Chemistry:4000, Biology:4000',
        'Subject Fees': '4000, 4000, 4000'
      },
      {
        'Course ID': 'CRS-104',
        'Name': 'Summer Robotics & Coding Camp',
        'Category': 'Kids & Tech',
        'Duration': '2 Weeks',
        'Fees': 5000,
        'Course Type': 'seasonal',
        'Schedule Type': 'Custom Days',
        'Custom Days': 'Mon, Wed, Fri',
        'Fee Period': 'course',
        'Is Online': 'No',
        'Valid From': '2026-05-01',
        'Valid To': '2026-05-15',
        'Description': 'Hands-on robotics building and scratch programming for kids.',
        'Status': 'active',
        'Subjects': '',
        'Subject Fees': ''
      },
      {
        'Course ID': 'CRS-105',
        'Name': '2-Day AI & Prompt Engineering Workshop',
        'Category': 'Short Workshop',
        'Duration': '2 Days',
        'Fees': 1500,
        'Course Type': 'workshop',
        'Schedule Type': 'Weekends',
        'Custom Days': '',
        'Fee Period': 'course',
        'Is Online': 'Yes',
        'Valid From': '2026-06-06',
        'Valid To': '2026-06-07',
        'Description': 'Intensive weekend workshop on Generative AI and LLM tools.',
        'Status': 'active',
        'Subjects': '',
        'Subject Fees': ''
      },
      {
        'Course ID': 'CRS-106',
        'Name': '12-Week Data Science Bootcamp',
        'Category': 'Career Track',
        'Duration': '3 Months',
        'Fees': 35000,
        'Course Type': 'bootcamp',
        'Schedule Type': 'Custom Days',
        'Custom Days': 'Sat, Sun',
        'Fee Period': 'course',
        'Is Online': 'Yes',
        'Valid From': '2026-07-01',
        'Valid To': '2026-09-23',
        'Description': 'Career transition bootcamp with capstone industry projects.',
        'Status': 'active',
        'Subjects': '',
        'Subject Fees': ''
      }
    ];

    if (this.customFields && this.customFields.length > 0) {
      this.customFields.forEach(cf => {
        sampleData.forEach((row, idx) => {
          row[cf.label] = cf.field_type === 'number' ? (idx + 1) * 100 : 'Sample Value';
        });
      });
    }

    const ws = XLSX.utils.json_to_sheet(sampleData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Courses');
    XLSX.writeFile(wb, 'Course_Import_Sample_Template.xlsx');
    this.toastService.success('Sample course import template downloaded!');
  }

  private normalizeImportFeePeriod(value: string): string {
    if (!value) return 'course';
    const val = value.toLowerCase().trim();
    if (val.includes('day')) return 'day';
    if (val.includes('week')) return 'week';
    if (val.includes('month')) return 'month';
    if (val.includes('year') || val.includes('annual')) return 'year';
    if (val.includes('course') || val.includes('one') || val.includes('once')) return 'course';
    return val;
  }

  private normalizeImportCourseType(value: string): string {
    if (!value) return 'master';
    const val = value.toLowerCase().trim();
    if (val.includes('regular') || val.includes('self') || val.includes('master')) return 'master';
    if (val.includes('standard')) return 'standard';
    if (val.includes('crash')) return 'crash';
    if (val.includes('seasonal')) return 'seasonal';
    if (val.includes('workshop')) return 'workshop';
    if (val.includes('camp') && !val.includes('boot')) return 'camp';
    if (val.includes('bootcamp') || val.includes('boot')) return 'bootcamp';
    return val;
  }

  private parseImportCustomDays(daysText: string, scheduleType: string): string[] {
    const st = scheduleType ? scheduleType.toLowerCase() : '';
    
    // If standard Weekdays or Weekends, return standard default day lists
    if (st === 'weekdays') {
      return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
    }
    if (st === 'weekends') {
      return ['Sat', 'Sun'];
    }

    // For Custom Days schedule, parse custom day string if present
    if (daysText && daysText.trim()) {
      const dayMap: { [key: string]: string } = {
        mon: 'Mon', monday: 'Mon',
        tue: 'Tue', tuesday: 'Tue',
        wed: 'Wed', wednesday: 'Wed',
        thu: 'Thu', thursday: 'Thu',
        fri: 'Fri', friday: 'Fri',
        sat: 'Sat', saturday: 'Sat',
        sun: 'Sun', sunday: 'Sun'
      };

      const parts = daysText.split(',').map(d => d.trim().toLowerCase()).filter(Boolean);
      const matchedDays: string[] = [];
      parts.forEach(p => {
        if (dayMap[p]) {
          if (!matchedDays.includes(dayMap[p])) matchedDays.push(dayMap[p]);
        } else {
          const cap = p.charAt(0).toUpperCase() + p.slice(1, 3).toLowerCase();
          if (!matchedDays.includes(cap)) matchedDays.push(cap);
        }
      });

      if (matchedDays.length > 0) return matchedDays;
    }

    if (st.includes('weekend')) {
      return ['Sat', 'Sun'];
    }
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'];
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

    const ddmmyyyyMatch = text.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (ddmmyyyyMatch) {
      const day = ddmmyyyyMatch[1].padStart(2, '0');
      const month = ddmmyyyyMatch[2].padStart(2, '0');
      const year = ddmmyyyyMatch[3];
      return `${year}-${month}-${day}`;
    }

    return text;
  }

  private parseImportSubjects(row: any, totalCourseFees: number): { subjects: any[]; calculatedFees: number } {
    const subjectsText = this.readImportValue(row, ['Subjects', 'subjects', 'Subject List', 'subject_list', 'Subject']);
    const subjectFeesText = this.readImportValue(row, ['Subject Fees', 'subject_fees', 'SubjectFees', 'Subject Fee']);

    if (!subjectsText) {
      return { subjects: [], calculatedFees: totalCourseFees };
    }

    const resultSubjects: any[] = [];
    const rawSubjectParts = subjectsText.split(',').map(s => s.trim()).filter(Boolean);
    const rawFeeParts = subjectFeesText ? subjectFeesText.split(',').map(f => f.trim()).filter(Boolean) : [];

    for (let i = 0; i < rawSubjectParts.length; i++) {
      const part = rawSubjectParts[i];
      let subjName = part;
      let subjFee = 0;

      // Match patterns like "Tamil:1000", "English=1200", "Maths (1500)"
      if (part.includes(':') || part.includes('=') || part.includes('(')) {
        const match = part.match(/^([^:=()]+)[:=(]\s*(\d+(?:\.\d+)?)\)?$/);
        if (match) {
          subjName = match[1].trim();
          subjFee = parseFloat(match[2]);
        } else {
          const delims = part.split(/[:=()]/);
          subjName = delims[0].trim();
          const possibleFee = parseFloat(delims[1]);
          if (!isNaN(possibleFee)) subjFee = possibleFee;
        }
      } else if (rawFeeParts[i] && !isNaN(parseFloat(rawFeeParts[i]))) {
        subjFee = parseFloat(rawFeeParts[i]);
      }

      if (subjName) {
        resultSubjects.push({
          name: subjName,
          fees: subjFee
        });
      }
    }

    if (resultSubjects.length > 0 && resultSubjects.every(s => s.fees === 0) && totalCourseFees > 0) {
      const equalFee = Math.round((totalCourseFees / resultSubjects.length) * 100) / 100;
      resultSubjects.forEach(s => s.fees = equalFee);
    }

    const sumSubjectFees = resultSubjects.reduce((acc, s) => acc + (s.fees || 0), 0);
    const finalFees = sumSubjectFees > 0 ? sumSubjectFees : totalCourseFees;

    return { subjects: resultSubjects, calculatedFees: finalFees };
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
}

