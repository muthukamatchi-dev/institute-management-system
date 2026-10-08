import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { ToastService } from '../../../services/toast.service';
import { ModalComponent } from '../../../shared/ui/modal.component';
import { QuestionBankComponent } from './question-bank.component';
@Component({ selector: 'app-question-bank-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent], templateUrl: './question-bank-mobile.component.html' })
export class QuestionBankMobileComponent extends QuestionBankComponent { constructor(dataService: DataService, router: Router, toastService: ToastService) { super(dataService, router, toastService); } }
