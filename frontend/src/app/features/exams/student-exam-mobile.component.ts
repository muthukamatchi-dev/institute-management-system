import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { StudentExamComponent } from './student-exam.component';
@Component({ selector: 'app-student-exam-mobile', standalone: true, imports: [CommonModule, ModalComponent, BadgeComponent], templateUrl: './student-exam-mobile.component.html' })
export class StudentExamMobileComponent extends StudentExamComponent { constructor(dataService: DataService, authService: AuthService, router: Router) { super(dataService, authService, router); } }
