import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { StudyMaterial, Course } from '../../models';

@Component({
  selector: 'app-student-study-material',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './student-study-material.component.html'
})
export class StudentStudyMaterialComponent implements OnInit {
  materials: StudyMaterial[] = [];
  groupedMaterials: { [key: string]: StudyMaterial[] } = {};
  courses: string[] = [];
  searchTerm: string = '';
  selectedCourse: string = 'all';

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loadMaterials();
  }

  loadMaterials() {
    this.dataService.getMyStudyMaterials().subscribe(data => {
      this.materials = data;
      this.processMaterials();
    });
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
    const normalizedUrl = url.startsWith('/') ? url.slice(1) : url;
    const fullUrl = url.startsWith('http') ? url : `http://localhost:8081/${normalizedUrl}`;
    window.open(fullUrl, '_blank');
  }

  getCourseList() {
    const courses = this.materials.map(m => m.courseName || 'General');
    return Array.from(new Set(courses));
  }
}
