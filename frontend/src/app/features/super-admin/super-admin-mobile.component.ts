import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { SuperAdminComponent } from './super-admin.component';
@Component({ selector: 'app-super-admin-mobile', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './super-admin-mobile.component.html' })
export class SuperAdminMobileComponent extends SuperAdminComponent { constructor(http: HttpClient) { super(http); } }
