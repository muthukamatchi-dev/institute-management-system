import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { StaffAttendanceComponent } from './staff-attendance.component';
@Component({ selector: 'app-staff-attendance-mobile', standalone: true, imports: [CommonModule, FormsModule, RouterModule], templateUrl: './staff-attendance-mobile.component.html' })
export class StaffAttendanceMobileComponent extends StaffAttendanceComponent { constructor(dataService: DataService, route: ActivatedRoute, toastService: ToastService) { super(dataService, route, toastService); } }
