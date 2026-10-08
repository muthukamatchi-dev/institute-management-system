import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { DataService } from '../../../services/data.service';
import { ToastService } from '../../../services/toast.service';
import { BadgeComponent } from '../../../shared/ui/badge.component';
import { ExternalResultsComponent } from './external-results.component';
@Component({ selector: 'app-external-results-mobile', standalone: true, imports: [CommonModule, FormsModule, BadgeComponent], templateUrl: './external-results-mobile.component.html' })
export class ExternalResultsMobileComponent extends ExternalResultsComponent { constructor(route: ActivatedRoute, router: Router, dataService: DataService, toastService: ToastService) { super(route, router, dataService, toastService); } }
