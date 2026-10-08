import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ToastService } from '../../services/toast.service';
import { StudentListComponent } from './student-list.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';

import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-student-list-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, BadgeComponent, ModalComponent, CustomFieldsRendererComponent, DatePickerComponent, SearchableSelectComponent],
  templateUrl: './student-list-mobile.component.html'
})
export class StudentListMobileComponent extends StudentListComponent {
  constructor(dataService: DataService, toastService: ToastService, http: HttpClient) {
    super(dataService, toastService, http);
  }
}
