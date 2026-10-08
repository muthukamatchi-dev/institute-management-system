import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { PlanService } from '../../services/plan.service';
import { DayBookComponent } from './day-book.component';

@Component({
  selector: 'app-day-book-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './day-book-mobile.component.html'
})
export class DayBookMobileComponent extends DayBookComponent {
  constructor(dataService: DataService, toastService: ToastService, planService: PlanService) {
    super(dataService, toastService, planService);
  }
}
