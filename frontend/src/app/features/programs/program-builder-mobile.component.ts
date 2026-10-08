import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-program-builder-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './program-builder-mobile.component.html'
})
export class ProgramBuilderMobileComponent implements OnInit {
  programId: string = '';
  program: any = null;
  courses: any[] = [];
  modules: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private dataService: DataService,
    private toastService: ToastService
  ) { }

  ngOnInit() {
    this.programId = this.route.snapshot.paramMap.get('id') || '';
    if (this.programId) {
      this.loadProgram();
      this.dataService.getCourses().subscribe(c => this.courses = c);
    }
  }

  loadProgram() {
    this.dataService.getProgram(this.programId).subscribe({
      next: (data) => {
        this.program = data;
        this.modules = data.modules || [];
      },
      error: () => this.toastService.error('Failed to load program')
    });
  }
}
