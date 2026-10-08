import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { StudyMaterialComponent } from './study-material.component';
@Component({ selector: 'app-study-material-mobile', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './study-material-mobile.component.html' })
export class StudyMaterialMobileComponent extends StudyMaterialComponent { constructor(dataService: DataService, toastService: ToastService) { super(dataService, toastService); } }
