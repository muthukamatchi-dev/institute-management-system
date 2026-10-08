import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { StaffBatchesComponent } from './staff-batches.component';
@Component({ selector: 'app-staff-batches-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent], templateUrl: './staff-batches-mobile.component.html' })
export class StaffBatchesMobileComponent extends StaffBatchesComponent { constructor(dataService: DataService) { super(dataService); } }
