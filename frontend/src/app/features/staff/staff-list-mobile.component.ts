import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { GDriveImagePipe } from '../../shared/pipes/gdrive.pipe';
import { HttpClient } from '@angular/common/http';
import { StaffListComponent } from './staff-list.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';

@Component({
  selector: 'app-staff-list-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomFieldsRendererComponent, GDriveImagePipe, DatePickerComponent],
  templateUrl: './staff-list-mobile.component.html'
})
export class StaffListMobileComponent extends StaffListComponent {
  constructor(dataService: DataService, toastService: ToastService, http: HttpClient) {
    super(dataService, toastService, http);
  }
}
