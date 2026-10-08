import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { StaffAttendanceComponent } from '../staff/staff-attendance.component';
import { AttendanceComponent } from './attendance.component';
@Component({ selector: 'app-attendance-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent, SearchableSelectComponent, BadgeComponent, StaffAttendanceComponent], templateUrl: './attendance-mobile.component.html' })
export class AttendanceMobileComponent extends AttendanceComponent { constructor(dataService: DataService, authService: AuthService) { super(dataService, authService); } }
