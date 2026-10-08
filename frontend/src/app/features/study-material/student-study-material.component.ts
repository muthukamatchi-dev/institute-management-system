import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { StudyMaterial, Course } from '../../models';
import { ModalComponent } from '../../shared/ui/modal.component';
import { GDriveEmbedPipe } from '../../shared/pipes/gdrive.pipe';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';

@Component({
  selector: 'app-student-study-material',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, GDriveEmbedPipe, SearchableSelectComponent],
  templateUrl: './student-study-material.component.html'
})
export class StudentStudyMaterialComponent implements OnInit {
  materials: StudyMaterial[] = [];
  groupedMaterials: { [key: string]: StudyMaterial[] } = {};
  courses: string[] = [];
  courseOptionsForFilter: { id: string; name: string }[] = [{ id: 'all', name: 'All Courses' }];
  searchTerm: string = '';
  selectedCourse: string = 'all';
  isViewModalOpen: boolean = false;
  selectedMaterial: StudyMaterial | null = null;
  canDownload: boolean = true;

  constructor(protected dataService: DataService) { }

  ngOnInit() {
    this.loadSettings();
    this.loadMaterials();
  }

  loadSettings() {
    this.dataService.getSettings().subscribe({
      next: (s) => {
        if (s && s.studentCanDownloadStudyMaterial !== undefined) {
          this.canDownload = s.studentCanDownloadStudyMaterial === true;
        } else {
          this.canDownload = this.dataService.getCachedStudentCanDownloadStudyMaterial();
        }
      },
      error: () => {
        this.canDownload = this.dataService.getCachedStudentCanDownloadStudyMaterial();
      }
    });
  }

  loadMaterials() {
    this.dataService.getMyStudyMaterials().subscribe(data => {
      this.materials = data;
      this.processMaterials();
      this.updateCourseOptions();
    });
  }

  updateCourseOptions() {
    const courses = this.getCourseList();
    this.courseOptionsForFilter = [
      { id: 'all', name: 'All Courses' },
      ...courses.map(c => ({ id: c, name: c }))
    ];
  }

  processMaterials() {
    this.groupedMaterials = {};
    const filtered = this.materials.filter(m => {
      const matchesSearch = m.title.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesCourse = this.selectedCourse === 'all' || m.courseName === this.selectedCourse;
      return matchesSearch && matchesCourse;
    });

    filtered.forEach(m => {
      const courseName = m.courseName || 'General';
      if (!this.groupedMaterials[courseName]) {
        this.groupedMaterials[courseName] = [];
      }
      this.groupedMaterials[courseName].push(m);
    });

    this.courses = Object.keys(this.groupedMaterials);
  }

  getFileIcon(type: string): string {
    if (type.includes('pdf')) return '📄';
    if (type.includes('image')) return '🖼️';
    if (type.includes('word') || type.includes('officedocument')) return '📝';
    if (type.includes('zip') || type.includes('compressed')) return '📦';
    return '📁';
  }

  openFile(url: string) {
    if (!url) return;
    const clean = url.trim();

    if (clean.includes('drive.google.com')) {
      window.open(clean, '_blank');
      return;
    }

    if (clean.includes('googleusercontent.com')) {
      const idMatch = clean.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (idMatch && !idMatch[1].startsWith('gdrive_')) {
        window.open(`https://drive.google.com/file/d/${idMatch[1]}/view`, '_blank');
        return;
      }
    }

    const normalizedUrl = clean.startsWith('/') ? clean.slice(1) : clean;
    const fullUrl = clean.startsWith('http') ? clean : `http://localhost:8081/${normalizedUrl}`;
    window.open(fullUrl, '_blank');
  }

  viewMaterial(m: StudyMaterial) {
    this.selectedMaterial = m;
    this.isViewModalOpen = true;
  }

  getCourseList() {
    const courses = this.materials.map(m => m.courseName || 'General');
    return Array.from(new Set(courses));
  }
}
