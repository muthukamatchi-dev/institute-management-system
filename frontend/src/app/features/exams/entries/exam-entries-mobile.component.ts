import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../../services/data.service';
import { ToastService } from '../../../services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { ExamEntriesComponent } from './exam-entries.component';
@Component({ selector: 'app-exam-entries-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent], templateUrl: './exam-entries-mobile.component.html' })
export class ExamEntriesMobileComponent extends ExamEntriesComponent { constructor(dataService: DataService, toastService: ToastService) { super(dataService, toastService); } }
