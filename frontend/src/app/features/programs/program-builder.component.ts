import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { Course } from '../../models';

@Component({
  selector: 'app-program-builder',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './program-builder.component.html'
})
export class ProgramBuilderComponent implements OnInit {
  programId: string = '';
  program: any = null;
  courses: Course[] = [];
  modules: any[] = [];

  isAddModalOpen = false;
  isSaving = false;

  newModule: any = this.getInitialModule();

  getInitialModule() {
    return {
      id: null,
      courseId: '',
      moduleName: '',
      isMandatory: true,
      prerequisiteType: 'PREVIOUS_MODULE', // NONE, PREVIOUS_MODULE, SPECIFIC_COURSE
      prerequisiteCourseId: null,
      minAttendancePct: 0,
      minExamScorePct: 0
    };
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private dataService: DataService,
    private toastService: ToastService
  ) {}

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id') || '';
    if (this.programId) {
      this.loadProgram();
      this.loadCourses();
    }
  }

  loadProgram() {
    this.dataService.getProgram(this.programId).subscribe({
      next: (data) => {
        this.program = data;
        this.modules = data.modules || [];
      },
      error: () => this.toastService.error('Failed to load program details')
    });
  }

  loadCourses() {
    this.dataService.getCourses().subscribe(data => this.courses = data);
  }

  openAddModal() {
    this.newModule = this.getInitialModule();
    this.isAddModalOpen = true;
  }

  closeAddModal() {
    this.isAddModalOpen = false;
  }

  onCourseSelect() {
    const selected = this.courses.find(c => String(c.id) === String(this.newModule.courseId));
    if (selected && !this.newModule.moduleName) {
      this.newModule.moduleName = selected.name;
    }
  }

  addModule() {
    if (!this.newModule.courseId) {
      this.toastService.error('Please select a course for this module');
      return;
    }

    this.isSaving = true;
    this.dataService.saveProgramModule(this.programId, this.newModule).subscribe({
      next: () => {
        this.toastService.success('Module added to program sequence');
        this.isSaving = false;
        this.closeAddModal();
        this.loadProgram();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Error adding module');
        this.isSaving = false;
      }
    });
  }

  moveUp(index: number) {
    if (index <= 0) return;
    const temp = this.modules[index];
    this.modules[index] = this.modules[index - 1];
    this.modules[index - 1] = temp;
    this.saveReorder();
  }

  moveDown(index: number) {
    if (index >= this.modules.length - 1) return;
    const temp = this.modules[index];
    this.modules[index] = this.modules[index + 1];
    this.modules[index + 1] = temp;
    this.saveReorder();
  }

  saveReorder() {
    const ids = this.modules.map(m => m.id);
    this.dataService.reorderProgramModules(this.programId, ids).subscribe({
      next: () => this.loadProgram(),
      error: () => this.toastService.error('Error reordering modules')
    });
  }

  deleteModule(moduleItem: any) {
    if (confirm(`Remove module '${moduleItem.moduleName || moduleItem.courseName}' from this program?`)) {
      this.dataService.deleteProgramModule(moduleItem.id).subscribe({
        next: () => {
          this.toastService.success('Module removed');
          this.loadProgram();
        },
        error: (err) => this.toastService.error(err?.error?.message || 'Error removing module')
      });
    }
  }
}
