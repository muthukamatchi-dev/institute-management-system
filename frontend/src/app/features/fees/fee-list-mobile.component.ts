import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { FeeListComponent } from './fee-list.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';

@Component({ selector: 'app-fee-list-mobile', standalone: true, imports: [CommonModule, FormsModule, ModalComponent, CustomFieldsRendererComponent, DatePickerComponent], templateUrl: './fee-list-mobile.component.html' })
export class FeeListMobileComponent extends FeeListComponent { constructor(dataService: DataService, toastService: ToastService) { super(dataService, toastService); } }
