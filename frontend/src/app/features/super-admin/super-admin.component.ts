import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-super-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-8 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-black text-slate-800 dark:text-white">🏢 Super Admin Panel</h1>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Manage all institutes on the platform</p>
        </div>
        <button (click)="showCreateModal = true"
          class="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold text-sm hover:bg-primary-700 transition-all shadow-lg shadow-primary-200 dark:shadow-none flex items-center gap-2">
          ➕ Add New Institute
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p class="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Institutes</p>
          <p class="text-3xl font-black text-slate-800 dark:text-white mt-2">{{ stats?.total_tenants || 0 }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p class="text-xs font-bold text-emerald-500 uppercase tracking-wider">Active</p>
          <p class="text-3xl font-black text-emerald-600 mt-2">{{ stats?.active_tenants || 0 }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p class="text-xs font-bold text-amber-500 uppercase tracking-wider">On Trial</p>
          <p class="text-3xl font-black text-amber-600 mt-2">{{ stats?.trial_active || 0 }}</p>
        </div>
        <div class="bg-white dark:bg-slate-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-slate-700">
          <p class="text-xs font-bold text-rose-500 uppercase tracking-wider">Expired</p>
          <p class="text-3xl font-black text-rose-600 mt-2">{{ stats?.trial_expired || 0 }}</p>
        </div>
      </div>

      <!-- Tenants Table -->
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div class="p-5 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <h2 class="text-lg font-bold text-slate-800 dark:text-white">All Institutes</h2>
          <input type="text" [(ngModel)]="searchQuery" placeholder="Search institutes..."
            class="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 w-60">
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-slate-50 dark:bg-slate-700/50">
              <tr class="text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th class="p-4">Institute</th>
                <th class="p-4">Subdomain</th>
                <th class="p-4">Code</th>
                <th class="p-4">Admin Email</th>
                <th class="p-4">DB Mode</th>
                <th class="p-4">Status</th>
                <th class="p-4">Trial Ends</th>
                <th class="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr *ngFor="let t of filteredTenants" class="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                <td class="p-4 font-bold text-slate-800 dark:text-white">{{ t.tenantName }}</td>
                <td class="p-4">
                  <span class="text-xs font-bold text-primary-600 dark:text-primary-400">{{ t.subdomain }}</span>
                  <span class="text-[10px] text-slate-400 block">.classivo.app</span>
                </td>
                <td class="p-4">
                  <span class="px-3 py-1 bg-slate-100 dark:bg-slate-600 rounded-lg text-xs font-mono font-bold text-slate-700 dark:text-slate-200">{{ t.tenantCode }}</span>
                </td>
                <td class="p-4 text-slate-500 dark:text-slate-400">{{ t.adminEmail }}</td>
                <td class="p-4">
                  <span class="px-3 py-1 rounded-full text-xs font-bold"
                    [class]="t.databaseType === 'dedicated' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'">
                    {{ t.databaseType }}
                  </span>
                </td>
                <td class="p-4">
                  <span class="px-3 py-1 rounded-full text-xs font-bold"
                    [class]="t.status === 'active' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400'">
                    {{ t.status }}
                  </span>
                </td>
                <td class="p-4 text-slate-500 dark:text-slate-400 text-xs">{{ t.trialEndDate || '—' }}</td>
                <td class="p-4 text-right space-x-2">
                  <button *ngIf="t.status === 'active'" (click)="toggleTenant(t, 'disable')" title="Disable"
                    class="px-3 py-1.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 text-xs font-bold hover:bg-rose-200 transition-colors">Disable</button>
                  <button *ngIf="t.status !== 'active'" (click)="toggleTenant(t, 'enable')" title="Enable"
                    class="px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 text-xs font-bold hover:bg-emerald-200 transition-colors">Enable</button>
                  <button (click)="openEditModal(t)" title="Edit"
                    class="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-600 text-slate-600 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 transition-colors">Edit</button>
                  <button (click)="resetPassword(t)" title="Reset Admin Password"
                    class="px-3 py-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/30 text-amber-600 text-xs font-bold hover:bg-amber-200 transition-colors">🔑 Reset Password</button>
                  <button (click)="deleteTenant(t)" title="Delete Tenant"
                    class="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-600 text-xs font-bold hover:bg-red-200 transition-colors">🗑️ Delete</button>
                </td>
              </tr>
              <tr *ngIf="filteredTenants.length === 0">
                <td colspan="7" class="p-8 text-center text-slate-400">No institutes found.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Create Tenant Modal -->
      <div *ngIf="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
        <div class="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl max-w-lg w-full p-8 space-y-6 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between">
            <h3 class="text-xl font-black text-slate-800 dark:text-white">{{ editMode ? 'Edit Institute' : 'Create New Institute' }}</h3>
            <button (click)="closeModal()" class="text-slate-400 hover:text-slate-600 text-2xl">&times;</button>
          </div>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Institute Name *</label>
              <input type="text" [(ngModel)]="form.tenant_name" (ngModelChange)="onNameChange()"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Subdomain * (unique, lowercase)</label>
              <div class="relative">
                <input type="text" [(ngModel)]="form.subdomain"
                  class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 lowercase pr-24"
                  placeholder="e.g. abcschool">
                <span class="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">.classivo.app</span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Institute Code * (unique, uppercase)</label>
              <input type="text" [(ngModel)]="form.tenant_code" [disabled]="editMode"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 uppercase"
                placeholder="e.g. ABC_SCHOOL">
            </div>
            <div *ngIf="!editMode">
              <label class="block text-xs font-bold text-slate-500 mb-1">Admin Name *</label>
              <input type="text" [(ngModel)]="form.admin_name"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="e.g. John Doe">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Admin Email *</label>
              <input type="email" [(ngModel)]="form.admin_email"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Admin Phone</label>
              <input type="text" [(ngModel)]="form.admin_phone"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50">
            </div>
            <div *ngIf="!editMode">
              <label class="block text-xs font-bold text-slate-500 mb-1">Admin Username *</label>
              <input type="text" [(ngModel)]="form.admin_username"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="e.g. admin">
            </div>
            <div *ngIf="!editMode">
              <label class="block text-xs font-bold text-slate-500 mb-1">Admin Password</label>
              <input type="text" [(ngModel)]="form.admin_password"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50"
                placeholder="admin123">
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Database Mode</label>
              <select [(ngModel)]="form.database_type"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50">
                <option value="shared">Shared Database</option>
                <option value="dedicated">Dedicated Database</option>
              </select>
            </div>
            <div>
              <label class="block text-xs font-bold text-slate-500 mb-1">Trial Period (days)</label>
              <input type="number" [(ngModel)]="form.trial_days"
                class="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50">
            </div>
          </div>

          <div *ngIf="formError" class="bg-rose-100 dark:bg-rose-900/30 text-rose-600 p-3 rounded-xl text-xs font-bold">{{ formError }}</div>
          <div *ngIf="formSuccess" class="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 p-3 rounded-xl text-xs font-bold">{{ formSuccess }}</div>

          <div class="flex gap-3 pt-2">
            <button (click)="closeModal()"
              class="flex-1 py-3 rounded-xl border-2 border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 font-bold text-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">Cancel</button>
            <button (click)="saveTenant()" [disabled]="saving"
              class="flex-1 py-3 rounded-xl bg-primary-600 text-white font-bold text-sm hover:bg-primary-700 transition-colors disabled:opacity-50">
              {{ saving ? 'Saving...' : (editMode ? 'Update' : 'Create Institute') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SuperAdminComponent implements OnInit {
  private apiUrl = 'http://localhost:8081/api';

  tenants: any[] = [];
  stats: any = {};
  searchQuery = '';
  showCreateModal = false;
  editMode = false;
  saving = false;
  formError = '';
  formSuccess = '';

  form: any = {
    tenant_name: '',
    tenant_code: '',
    subdomain: '',
    admin_name: '',
    admin_email: '',
    admin_phone: '',
    admin_username: '',
    admin_password: 'admin123',
    database_type: 'shared',
    trial_days: 7
  };

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTenants();
    this.loadStats();
  }

  get filteredTenants() {
    if (!this.searchQuery) return this.tenants;
    const q = this.searchQuery.toLowerCase();
    return this.tenants.filter(t =>
      (t.tenantName || '').toLowerCase().includes(q) ||
      (t.tenantCode || '').toLowerCase().includes(q) ||
      (t.subdomain || '').toLowerCase().includes(q) ||
      (t.adminEmail || '').toLowerCase().includes(q)
    );
  }

  loadTenants() {
    this.http.get<any>(`${this.apiUrl}/admin/tenants`).subscribe({
      next: res => this.tenants = res?.data || [],
      error: err => console.error('Failed to load tenants', err)
    });
  }

  loadStats() {
    this.http.get<any>(`${this.apiUrl}/admin/stats`).subscribe({
      next: res => this.stats = res?.data || {},
      error: err => console.error('Failed to load stats', err)
    });
  }

  saveTenant() {
    this.saving = true;
    this.formError = '';
    this.formSuccess = '';

    if (this.editMode) {
      this.http.post<any>(`${this.apiUrl}/admin/update-tenant`, this.form).subscribe({
        next: res => {
          this.saving = false;
          if (res.status === 'success') {
            this.formSuccess = 'Institute updated successfully!';
            this.loadTenants();
            this.loadStats();
            setTimeout(() => this.closeModal(), 1500);
          } else {
            this.formError = res.message || 'Failed to update.';
          }
        },
        error: err => {
          this.saving = false;
          this.formError = err.error?.message || 'Failed to update.';
        }
      });
    } else {
      this.http.post<any>(`${this.apiUrl}/admin/create-tenant`, this.form).subscribe({
        next: res => {
          this.saving = false;
          if (res.status === 'success') {
            const d = res.data;
            this.formSuccess = `Institute created! Admin login: ${d.admin_username} / ${d.admin_password}`;
            this.loadTenants();
            this.loadStats();
            setTimeout(() => this.closeModal(), 2000);
          } else {
            this.formError = res.message || 'Failed to create.';
          }
        },
        error: err => {
          this.saving = false;
          this.formError = err.error?.message || 'Failed to create.';
        }
      });
    }
  }

  toggleTenant(tenant: any, action: string) {
    const url = action === 'disable'
      ? `${this.apiUrl}/admin/disable-tenant`
      : `${this.apiUrl}/admin/enable-tenant`;

    this.http.post<any>(url, { id: tenant.id }).subscribe({
      next: () => { this.loadTenants(); this.loadStats(); },
      error: err => console.error('Toggle failed', err)
    });
  }

  resetPassword(tenant: any) {
    const newPw = prompt('Reset Admin Password\n\nEnter a new admin password for ' + tenant.tenantName + ':');
    if (!newPw || !newPw.trim()) return;

    this.http.post<any>(`${this.apiUrl}/admin/reset-password`, { id: tenant.id, new_password: newPw.trim() }).subscribe({
      next: res => alert(res.message || 'Password reset successfully!'),
      error: err => alert(err.error?.message || 'Failed to reset password.')
    });
  }

  onNameChange() {
    if (!this.editMode && this.form.tenant_name) {
      // Auto-generate code
      this.form.tenant_code = this.form.tenant_name.trim().toUpperCase().replace(/\s+/g, '_').substring(0, 20);
      
      // Auto-generate subdomain
      this.form.subdomain = this.form.tenant_name.trim().toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

      // Auto-generate admin username
      this.form.admin_username = this.form.tenant_code.toLowerCase() + "_admin";

      // Auto-generate admin name
      this.form.admin_name = this.form.tenant_name + " Admin";
    }
  }

  openEditModal(tenant: any) {
    this.editMode = true;
    this.form = {
      id: tenant.id,
      tenant_name: tenant.tenantName,
      tenant_code: tenant.tenantCode,
      subdomain: tenant.subdomain,
      admin_email: tenant.adminEmail,
      admin_phone: tenant.adminPhone || '',
      database_type: tenant.databaseType,
      trial_days: 7,
      status: tenant.status
    };
    this.formError = '';
    this.formSuccess = '';
    this.showCreateModal = true;
  }

  closeModal() {
    this.showCreateModal = false;
    this.editMode = false;
    this.formError = '';
    this.formSuccess = '';
    this.form = {
      tenant_name: '',
      tenant_code: '',
      subdomain: '',
      admin_name: '',
      admin_email: '',
      admin_phone: '',
      admin_username: '',
      admin_password: 'admin123',
      database_type: 'shared',
      trial_days: 7
    };
  }

  deleteTenant(tenant: any) {
    const confirmDelete = confirm(`Are you sure you want to completely DELETE the institute "${tenant.tenantName}"?\n\nThis will permanently delete the institute, all its databases, users, and settings. This action CANNOT be undone.`);
    if (!confirmDelete) return;

    this.http.post<any>(`${this.apiUrl}/admin/delete-tenant`, { id: tenant.id }).subscribe({
      next: res => {
        alert(res.message || 'Institute deleted successfully!');
        this.loadTenants();
        this.loadStats();
      },
      error: err => {
        alert(err.error?.message || 'Failed to delete institute.');
      }
    });
  }
}
