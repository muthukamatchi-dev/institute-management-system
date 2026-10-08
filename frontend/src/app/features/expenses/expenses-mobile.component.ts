import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ExpensesComponent } from './expenses.component';
import { DatePickerComponent } from '../../shared/ui/date-picker.component';

@Component({
  selector: 'app-expenses-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, CustomFieldsRendererComponent, DatePickerComponent],
  templateUrl: './expenses-mobile.component.html'
})
export class ExpensesMobileComponent extends ExpensesComponent {
  constructor(dataService: DataService, toastService: ToastService) {
    super(dataService, toastService);
  }
}

