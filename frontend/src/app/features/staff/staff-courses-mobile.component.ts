import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { StaffCoursesComponent } from './staff-courses.component';
@Component({ selector: 'app-staff-courses-mobile', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './staff-courses-mobile.component.html' })
export class StaffCoursesMobileComponent extends StaffCoursesComponent { constructor(dataService: DataService, toastService: ToastService) { super(dataService, toastService); } }
