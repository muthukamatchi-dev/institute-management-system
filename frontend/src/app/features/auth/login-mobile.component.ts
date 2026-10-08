import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BranchContextService } from '../../services/branch-context.service';
import { TenantService } from '../../services/tenant.service';
import { LoginComponent } from './login.component';

@Component({
  selector: 'app-login-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login-mobile.component.html'
})
export class LoginMobileComponent extends LoginComponent {
  constructor(
    authService: AuthService,
    router: Router,
    branchService: BranchContextService,
    tenantService: TenantService
  ) {
    super(authService, router, branchService, tenantService);
  }
}
