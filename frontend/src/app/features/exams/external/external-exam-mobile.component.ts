import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { ToastService } from '../../../services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { ExternalExamComponent } from './external-exam.component';
@Component({ selector: 'app-external-exam-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent], templateUrl: './external-exam-mobile.component.html' })
export class ExternalExamMobileComponent extends ExternalExamComponent { constructor(dataService: DataService, router: Router, toastService: ToastService) { super(dataService, router, toastService); } }
