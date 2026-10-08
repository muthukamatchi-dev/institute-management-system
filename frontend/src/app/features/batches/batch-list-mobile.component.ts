import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { BatchListComponent } from './batch-list.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';

import { PlanService } from '../../services/plan.service';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';

@Component({
  selector: 'app-batch-list-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomFieldsRendererComponent, BadgeComponent, DatePickerComponent, SearchableSelectComponent],
  templateUrl: './batch-list-mobile.component.html'
})
export class BatchListMobileComponent extends BatchListComponent {
  constructor(dataService: DataService, router: Router, toastService: ToastService, planService: PlanService) {
    super(dataService, router, toastService, planService);
  }
}
