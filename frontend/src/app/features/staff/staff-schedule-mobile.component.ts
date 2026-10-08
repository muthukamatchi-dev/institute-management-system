import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { RouterModule } from '@angular/router';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { StaffScheduleComponent } from './staff-schedule.component';
@Component({ selector: 'app-staff-schedule-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent, SearchableSelectComponent, RouterModule, CustomFieldsRendererComponent], templateUrl: './staff-schedule-mobile.component.html' })
export class StaffScheduleMobileComponent extends StaffScheduleComponent { constructor(dataService: DataService, authService: AuthService, toastService: ToastService) { super(dataService, authService, toastService); } }
