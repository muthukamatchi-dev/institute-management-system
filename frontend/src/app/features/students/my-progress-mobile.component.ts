import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DataService } from '../../services/data.service';
import { AuthService } from '../../services/auth.service';
import { MyProgressComponent } from './my-progress.component';
@Component({ selector: 'app-my-progress-mobile', standalone: true, imports: [CommonModule], templateUrl: './my-progress-mobile.component.html' })
export class MyProgressMobileComponent extends MyProgressComponent { constructor(dataService: DataService, authService: AuthService) { super(dataService, authService); } }
