import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TenantService } from '../../services/tenant.service';
import { FindInstituteComponent } from './find-institute.component';

@Component({
  selector: 'app-find-institute-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './find-institute-mobile.component.html'
})
export class FindInstituteMobileComponent extends FindInstituteComponent {
  constructor(tenantService: TenantService, router: Router) {
    super(tenantService, router);
  }
}
