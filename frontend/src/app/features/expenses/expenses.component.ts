import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { Expense } from '../../models';
import { ModalComponent } from '../../shared/ui/modal.component';
import { BadgeComponent } from '../../shared/ui/badge.component';
import { forkJoin, firstValueFrom } from 'rxjs';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { ToastService } from '../../services/toast.service';

import { CustomFieldsRendererComponent } from '../../shared/ui/custom-fields-renderer.component';
import { ViewChild } from '@angular/core';
import { ExportHelper } from '../../shared/utils/export-helper';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule, ModalComponent, BadgeComponent, CustomFieldsRendererComponent],
  templateUrl: './expenses.component.html'
})
export class ExpensesComponent implements OnInit {
  @ViewChild(CustomFieldsRendererComponent) customFieldsRenderer!: CustomFieldsRendererComponent;
  expenses: Expense[] = [];
  filteredExpenses: Expense[] = [];
  stats: any[] = [];
  
  searchTerm = '';
  categoryFilter = 'all';
  
  isModalOpen = false;
  isViewModalOpen = false;
  selectedExpense: Expense | null = null;
  
  isImportModalOpen = false;
  isGuidanceOpen = false;
  importFile: File | null = null;
  customFields: any[] = [];
  settings: any;
  
  newExpense: Expense = this.resetForm();
  
  categories = [
    'Salary', 'Rent', 'Utility', 'Marketing', 'Supplies', 'Maintenance', 'Entertainment', 'Taxes', 'Other'
  ];
  
  paymentMethods = ['Cash', 'Bank Transfer', 'UPI', 'Check', 'Credit Card'];

  constructor(private dataService: DataService, private toastService: ToastService) {}

  ngOnInit() {
    this.loadData();
    this.dataService.getSettings().subscribe(s => this.settings = s);
  }

  loadData() {
    forkJoin({
      expenses: this.dataService.getExpenses(),
      stats: this.dataService.getExpenseStats()
    }).subscribe(res => {
      this.expenses = res.expenses;
      this.stats = res.stats;
      this.applyFilters();
    });
    this.dataService.getCustomFields('expense').subscribe(fields => {
      this.customFields = fields;
    });
  }

  resetForm(): Expense {
    return {
      title: '',
      category: 'Other',
      amount: 0,
      expense_date: new Date().toISOString().split('T')[0],
      description: '',
      reference_no: '',
      payment_method: 'Cash'
    };
  }

  applyFilters() {
    this.filteredExpenses = this.expenses.filter(e => {
      const matchesSearch = e.title.toLowerCase().includes(this.searchTerm.toLowerCase()) || 
                            (e.description && e.description.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesCategory = this.categoryFilter === 'all' || e.category === this.categoryFilter;
      return matchesSearch && matchesCategory;
    });
  }

  openAddModal() {
    this.newExpense = this.resetForm();
    this.isModalOpen = true;
  }

  editExpense(expense: Expense) {
    this.newExpense = { ...expense };
    this.isModalOpen = true;
  }

  saveExpense() {
    if (this.customFieldsRenderer && !this.customFieldsRenderer.isValid()) {
      this.toastService.warning('Please fill all required custom fields.');
      return;
    }

    if (!this.newExpense.title || !this.newExpense.amount || !this.newExpense.expense_date) {
      this.toastService.warning('Please fill all required fields');
      return;
    }

    // Merge custom fields
    if (this.customFieldsRenderer) {
      (this.newExpense as any).custom_fields = this.customFieldsRenderer.getValues();
    }

    this.dataService.saveExpense(this.newExpense).subscribe(() => {
      this.isModalOpen = false;
      this.loadData();
      this.toastService.success(this.newExpense.id ? 'Expense updated' : 'New expense recorded');
    });
  }

  deleteExpense(id: string) {
    if (confirm('Are you sure you want to delete this expense record?')) {
      this.dataService.deleteExpense(id).subscribe(() => {
        this.loadData();
        this.toastService.success('Expense record deleted');
      });
    }
  }

  viewExpense(expense: Expense) {
    this.selectedExpense = expense;
    this.isViewModalOpen = true;
  }

  getTotalExpenses(): number {
    return this.expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  }

  getCategoryColor(category: string): 'success' | 'warning' | 'danger' | 'info' | 'neutral' {
    const colors: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
      'Salary': 'info',
      'Rent': 'danger',
      'Utility': 'warning',
      'Marketing': 'success',
      'Supplies': 'neutral',
      'Maintenance': 'warning',
      'Other': 'neutral'
    };
    return colors[category] || 'neutral';
  }

  // --- Import / Export ---
  exportToExcel() {
    const rawData = this.filteredExpenses.map(e => ({
      'Title': e.title,
      'Category': e.category,
      'Amount': e.amount,
      'Date': e.expense_date,
      'Method': e.payment_method,
      'Reference': e.reference_no,
      'Description': e.description,
      'Created By': e.created_by_name
    }));

    const ws = ExportHelper.addExcelHeader(rawData, this.settings, 'EXPENSES REPORT');
    const wb: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Expenses');
    XLSX.writeFile(wb, 'Expenses_List.xlsx');
  }

  async exportToPDF() {
    const doc = new jsPDF() as any;
    const data = this.filteredExpenses.map(e => [
      String(e.title || ''),
      String(e.category || ''),
      String(e.amount || 0),
      String(e.expense_date || ''),
      String(e.payment_method || '')
    ]);

    const startY = await ExportHelper.addPDFHeader(doc, this.settings, 'EXPENSES REPORT');

    autoTable(doc, {
      startY: startY,
      head: [['Title', 'Category', 'Amount (₹)', 'Date', 'Method']],
      body: data,
      theme: 'grid',
      headStyles: { fillColor: [225, 29, 72] } // Rose-600 for expenses
    });

    doc.save('Expense_Records.pdf');
  }

  triggerImport() {
    this.isImportModalOpen = true;
    this.importFile = null;
  }

  onFileChange(event: any) {
    this.importFile = event.target.files[0];
  }

  async processImport() {
    if (!this.importFile) {
      this.toastService.warning('Please select a file first.');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const bstr = e.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data: any[] = XLSX.utils.sheet_to_json(ws);

      if (data.length === 0) {
        this.toastService.warning('The uploaded file is empty.');
        return;
      }

      if (confirm(`Detected ${data.length} expense records. Proceed with bulk import?`)) {
        let imported = 0;
        for (const row of data) {
          const expense: Expense = {
            title: row['Title'] || row['title'] || 'New Expense',
            category: row['Category'] || row['category'] || 'Other',
            amount: Number(row['Amount'] || row['amount'] || 0),
            expense_date: row['Date'] || row['expense_date'] || new Date().toISOString().split('T')[0],
            payment_method: row['Method'] || row['payment_method'] || 'Cash',
            reference_no: row['Reference'] || row['reference_no'] || '',
            description: row['Description'] || row['description'] || ''
          };
          
          // Map Custom Fields
          const customValues: any = {};
          this.customFields.forEach(cf => {
            if (row[cf.label] !== undefined) {
              customValues[cf.id] = row[cf.label];
            }
          });
          if (Object.keys(customValues).length > 0) {
            (expense as any).custom_fields = customValues;
          }
          
          if (expense.title && expense.amount > 0) {
            try {
              await firstValueFrom(this.dataService.saveExpense(expense));
              imported++;
            } catch (err) {
              console.error('Failed to import expense:', expense.title, err);
            }
          }
        }
        this.loadData();
        this.isImportModalOpen = false;
        if (imported > 0) {
          this.toastService.success(`${imported} expense records imported.`);
        } else {
          this.toastService.error('No expense records were imported.');
        }
      }
    };
    reader.readAsBinaryString(this.importFile);
  }

  toggleGuidance() {
    this.isGuidanceOpen = !this.isGuidanceOpen;
  }
}
