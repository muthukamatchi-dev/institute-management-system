import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { ToastService } from '../../services/toast.service';
import { BranchContextService } from '../../services/branch-context.service';
import { PlanService } from '../../services/plan.service';
import { GoogleDriveService } from '../../services/gdrive.service';
import { ModalComponent } from '../../shared/ui/modal.component';
import { SettingsComponent } from './settings.component';

@Component({
  selector: 'app-settings-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent],
  templateUrl: './settings-mobile.component.html'
})
export class SettingsMobileComponent extends SettingsComponent {
  override activeSection: string = 'general';

  constructor(
    dataService: DataService,
    themeService: ThemeService,
    toastService: ToastService,
    branchContext: BranchContextService,
    authService: AuthService,
    planService: PlanService,
    gdriveService: GoogleDriveService
  ) {
    super(dataService, themeService, toastService, branchContext, authService, planService, gdriveService);
  }
}
