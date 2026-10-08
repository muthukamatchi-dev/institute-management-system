import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { BranchContextService } from '../../services/branch-context.service';
import { ReportsComponent } from './reports.component';
@Component({ selector: 'app-reports-mobile', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './reports-mobile.component.html' })
export class ReportsMobileComponent extends ReportsComponent { constructor(dataService: DataService, route: ActivatedRoute, toastService: ToastService, branchContextService: BranchContextService) { super(dataService, route, toastService, branchContextService); } }
