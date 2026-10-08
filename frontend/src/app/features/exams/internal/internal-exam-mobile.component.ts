import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { ToastService } from '../../../services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { QuestionBuilderComponent } from '../shared/question-builder.component';
import { CustomFieldsRendererComponent } from '../../../shared/ui/custom-fields-renderer.component';
import { BrandingHeaderComponent } from '../../../shared/ui/branding-header.component';
import { InternalExamComponent } from './internal-exam.component';
@Component({ selector: 'app-internal-exam-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, QuestionBuilderComponent, CustomFieldsRendererComponent, BrandingHeaderComponent], templateUrl: './internal-exam-mobile.component.html' })
export class InternalExamMobileComponent extends InternalExamComponent { constructor(dataService: DataService, toastService: ToastService) { super(dataService, toastService); } }
