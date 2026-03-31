import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BranchContextService } from '../../services/branch-context.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: 'login.component.html'
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private branchService: BranchContextService
  ) { }

  onLogin() {
    this.loading = true;
    this.error = '';

    this.authService.login(this.email, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          if (res.user && res.user.branch_id) {
            this.branchService.setSelectedBranchId(res.user.branch_id);
          }
          const role = this.normalizeRole(res.user.role_name || res.user.role);
          if (role === 'student') {
            this.router.navigate(['/my-progress']);
          } else if (role === 'staff') {
            this.router.navigate(['/staff/schedule']);
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

  private normalizeRole(role: string | undefined): string {
    return (role || '').trim().toLowerCase();
  }
}
