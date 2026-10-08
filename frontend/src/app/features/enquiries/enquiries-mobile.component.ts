import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { EnquiriesComponent } from './enquiries.component';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-enquiries-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, DatePickerComponent, CustomFieldsRendererComponent],
  templateUrl: './enquiries-mobile.component.html'
})
export class EnquiriesMobileComponent extends EnquiriesComponent {
  constructor(dataService: DataService, toastService: ToastService, router: Router, http: HttpClient) {
    super(dataService, toastService, router, http);
  }
}

