import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { ProfileComponent } from './profile.component';
@Component({ selector: 'app-profile-mobile', standalone: true, imports: [CommonModule], templateUrl: './profile-mobile.component.html' })
export class ProfileMobileComponent extends ProfileComponent { constructor(authService: AuthService, toastService: ToastService) { super(authService, toastService); } }
