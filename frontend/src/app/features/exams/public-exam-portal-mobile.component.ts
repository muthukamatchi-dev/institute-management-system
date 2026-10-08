import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { PublicExamPortalComponent } from './public-exam-portal.component';
import { ExamTimerComponent } from './shared/timer.component';
import { BrandingHeaderComponent } from '../../shared/ui/branding-header.component';

@Component({
  selector: 'app-public-exam-portal-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ExamTimerComponent, BrandingHeaderComponent],
  templateUrl: './public-exam-portal-mobile.component.html'
})
export class PublicExamPortalMobileComponent extends PublicExamPortalComponent {
  constructor(
    route: ActivatedRoute,
    router: Router,
    dataService: DataService,
    authService: AuthService,
    toastService: ToastService
  ) {
    super(route, router, dataService, authService, toastService);
  }
}
