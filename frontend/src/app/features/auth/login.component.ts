import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BranchContextService } from '../../services/branch-context.service';
import { TenantService, TenantInfo } from '../../services/tenant.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'login.component.html'
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  loading = false;

  // Tenant branding
  tenantName: string = 'Institute Management System';
  isMainDomain: boolean = false;
  tenantLoading: boolean = true;
  tenantError: string = '';

  constructor(
    private authService: AuthService,
    private router: Router,
    private branchService: BranchContextService,
    private tenantService: TenantService
  ) { }

  ngOnInit() {
    // Detect if we're on main domain or tenant subdomain
    this.isMainDomain = this.tenantService.isMainDomain();

    if (this.isMainDomain) {
      // Main domain — redirect to find-institute page unless super admin
      this.tenantName = 'Classivo';
      this.tenantLoading = false;
    } else {
      // Tenant subdomain — load tenant branding
      this.tenantService.loadTenantInfo().subscribe({
        next: (res) => {
          this.tenantLoading = false;
          if (res?.data?.tenant_name) {
            this.tenantName = res.data.tenant_name;
          }
          if (res?.data?.status && res.data.status !== 'active') {
            this.tenantError = 'This institute account is currently inactive.';
          }
        },
        error: (err) => {
          this.tenantLoading = false;
          if (err?.status === 404) {
            this.tenantError = 'Institute not found. Please check your URL.';
          }
        }
      });
    }
  }

  onLogin() {
    this.loading = true;
    this.error = '';
    this.email = (this.email || '').trim();

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          const user = res.user || res.data;
          if (user && user.branch_id) {
            this.branchService.setSelectedBranchId(user.branch_id);
          } else {
            this.branchService.refreshContext();
          }
          
          const role = this.normalizeRole(user.role_name || user.role);
          console.log('Login successful. Role:', role);

          if (role === 'super admin' || role === 'super_admin') {
            this.router.navigate(['/super-admin']);
          } else if (role === 'student') {
            this.router.navigate(['/my-progress']);
          } else if (role === 'staff') {
            this.router.navigate(['/staff/my-attendance']);
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          this.error = res.message || 'Invalid credentials';
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.error && err.error.message) {
          this.error = err.error.message;
        } else {
          this.error = 'Unable to connect to server. Ensure backend is running.';
        }
      }
    });
  }

  goToFindInstitute() {
    this.router.navigate(['/find-institute']);
  }

  private normalizeRole(role: string | undefined): string {
    return (role || '').trim().toLowerCase();
  }
}
