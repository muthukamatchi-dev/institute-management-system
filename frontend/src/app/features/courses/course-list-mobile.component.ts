import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { CourseListComponent } from './course-list.component';
import { ModalComponent } from '../../shared/ui/modal.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { GDriveImagePipe } from '../../shared/pipes/gdrive.pipe';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';

@Component({
  selector: 'app-course-list-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomFieldsRendererComponent, GDriveImagePipe, DatePickerComponent],
  templateUrl: './course-list-mobile.component.html'
})
export class CourseListMobileComponent extends CourseListComponent {
  constructor(dataService: DataService, toastService: ToastService) {
    super(dataService, toastService);
  }
}
