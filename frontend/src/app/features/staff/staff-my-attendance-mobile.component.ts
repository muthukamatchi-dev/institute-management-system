import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { StaffMyAttendanceComponent } from './staff-my-attendance.component';
@Component({ selector: 'app-staff-my-attendance-mobile', standalone: true, imports: [CommonModule], templateUrl: './staff-my-attendance-mobile.component.html' })
export class StaffMyAttendanceMobileComponent extends StaffMyAttendanceComponent { constructor(dataService: DataService, toastService: ToastService) { super(dataService, toastService); } }
