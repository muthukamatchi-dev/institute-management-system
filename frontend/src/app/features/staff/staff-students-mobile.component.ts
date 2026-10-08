import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { StaffStudentsComponent } from './staff-students.component';
@Component({ selector: 'app-staff-students-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent], templateUrl: './staff-students-mobile.component.html' })
export class StaffStudentsMobileComponent extends StaffStudentsComponent { constructor(dataService: DataService) { super(dataService); } }
