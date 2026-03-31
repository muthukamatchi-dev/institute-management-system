import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';

@Component({
  selector: 'app-custom-fields-renderer',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="fields.length > 0" class="pt-3">
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div *ngFor="let f of fields" [class.col-span-full]="f.field_type === 'textarea'">
          <label class="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2">
            {{ f.field_label }} <span *ngIf="f.is_required" class="text-rose-500">*</span>
          </label>

          <!-- Text / Number -->
          <input *ngIf="f.field_type === 'text' || f.field_type === 'number'" 
            [type]="f.field_type" [(ngModel)]="values[f.id]"
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-semibold text-sm"
            placeholder="{{ f.field_label }}">

          <!-- Date -->
          <input *ngIf="f.field_type === 'date'" 
            type="date" [(ngModel)]="values[f.id]"
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-semibold text-sm">

          <!-- Dropdown -->
          <select *ngIf="f.field_type === 'dropdown'" 
            [(ngModel)]="values[f.id]"
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-semibold text-sm">
            <option value="">Select Option</option>
            <option *ngFor="let opt of parseOptions(f.options)" [value]="opt">{{ opt }}</option>
          </select>

          <!-- Textarea -->
          <textarea *ngIf="f.field_type === 'textarea'" 
            [(ngModel)]="values[f.id]" rows="3"
            class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary-500/20 transition-all font-semibold text-sm"
            placeholder="{{ f.field_label }}"></textarea>

          <!-- Checkbox (Select one only) -->
          <div *ngIf="f.field_type === 'checkbox'" class="flex flex-wrap gap-4 pt-2">
            <label *ngFor="let opt of parseOptions(f.options)" class="flex items-center gap-3 cursor-pointer group">
              <input type="radio" [name]="'cf_' + f.id" [value]="opt" [(ngModel)]="values[f.id]" class="sr-only">
              <div class="w-5 h-5 border-2 border-slate-200 dark:border-slate-700 rounded-full flex items-center justify-center transition-all group-hover:border-primary-500"
                   [class.bg-primary-500]="values[f.id] === opt" [class.border-primary-500]="values[f.id] === opt">
                <div *ngIf="values[f.id] === opt" class="w-2 h-2 bg-white rounded-full"></div>
              </div>
              <span class="text-xs font-bold text-slate-600 dark:text-slate-400">{{ opt }}</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomFieldsRendererComponent implements OnInit, OnChanges {
  @Input() location!: string;
  @Input() entityId?: string;

  fields: any[] = [];
  values: { [key: string]: any } = {};

  constructor(private dataService: DataService) { }

  ngOnInit() {
    this.loadFields();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['location'] && !changes['location'].firstChange) {
      this.loadFields();
    }
    if (changes['entityId'] && this.entityId) {
      this.loadValues();
    }
  }

  loadFields() {
    this.dataService.getCustomFields(this.location).subscribe(fields => {
      this.fields = fields;
      // Initialize values if not already set (mostly for new forms)
      this.fields.forEach(f => {
        if (this.values[f.id] === undefined) {
          this.values[f.id] = f.field_type === 'checkbox' ? '' : '';
        }
      });
      if (this.entityId) this.loadValues();
    });
  }

  loadValues() {
    if (!this.entityId) return;
    this.dataService.getCustomFieldValues(this.location, this.entityId).subscribe(valList => {
      valList.forEach(v => {
        this.values[v.field_id] = v.field_value;
      });
    });
  }

  parseOptions(options: string): string[] {
    if (!options) return [];
    return options.split(',').map(o => o.trim()).filter(o => o !== '');
  }

  // Method to be called by parent to get current values
  getValues() {
    return this.values;
  }

  isValid() {
    for (const f of this.fields) {
      if (f.is_required && !this.values[f.id]) return false;
    }
    return true;
  }
}
