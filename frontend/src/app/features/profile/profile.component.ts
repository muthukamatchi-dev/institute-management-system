import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.component.html',
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  profileData = {
    name: '',
    email: '',
    currentPassword: '',
    newPassword: ''
  };
  loading = false;

  constructor(private authService: AuthService, private toastService: ToastService) { }

  ngOnInit() {
    this.authService.currentUser.subscribe(u => {
      this.user = u;
      if (u) {
        this.profileData.name = u.name;
        this.profileData.email = u.email || 'admin@institute.com';
      }
    });
  }

  saveProfile() {
    this.loading = true;
    
    // 1. Update Profile Info (Name/Email)
    this.authService.updateProfile({ name: this.profileData.name, email: this.profileData.email }).subscribe({
      next: (res) => {
        // 2. Update Password if provided
        if (this.profileData.newPassword) {
          if (this.profileData.newPassword.length < 4) {
            this.toastService.warning('Password must be at least 4 characters long. Other changes saved.');
            this.loading = false;
            return;
          }

          this.authService.changePassword(this.profileData.newPassword).subscribe({
            next: () => {
              this.toastService.success('Profile and password updated successfully!');
              this.resetPasswords();
              this.loading = false;
            },
            error: () => {
              this.toastService.error('Profile updated, but password change failed.');
              this.loading = false;
            }
          });
        } else {
          this.toastService.success('Profile updated successfully!');
          this.loading = false;
        }
      },
      error: (err) => {
        this.toastService.error('Failed to update profile. Please try again.');
        this.loading = false;
      }
    });
  }

  private resetPasswords() {
    this.profileData.currentPassword = '';
    this.profileData.newPassword = '';
  }
}
