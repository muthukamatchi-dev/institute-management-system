import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-searchable-select',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative w-full overflow-visible" #dropdownContainer>
      <!-- Trigger -->
      <button type="button" 
              (click)="toggle()"
              class="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border-none rounded-2xl text-slate-800 dark:text-white font-bold outline-none ring-2 ring-transparent focus:ring-primary-500/50 transition-all flex items-center justify-between group">
        <span [class.text-slate-500]="selectedItems.length === 0" [class.dark:text-slate-400]="selectedItems.length === 0" class="truncate">
          {{ getDisplayLabel() }}
        </span>
        <span class="text-[10px] transform transition-transform duration-200" [class.rotate-180]="isOpen">▼</span>
      </button>

      <!-- Dropdown -->
      <div *ngIf="isOpen" 
           class="absolute left-0 mt-2 w-full bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-800 z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
        
        <!-- Search Input -->
        <div class="p-2 border-b border-slate-50 dark:border-slate-800">
          <div class="relative">
            <span class="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-400">🔍</span>
            <input type="text"
                   [(ngModel)]="searchQuery"
                   (input)="filterOptions()"
                   [placeholder]="searchPlaceholder"
                   class="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border-none rounded-xl text-sm font-bold text-slate-800 dark:text-white outline-none ring-2 ring-transparent focus:ring-primary-500/30 transition-all"
                   #searchInput>
          </div>
        </div>

        <!-- Options list -->
        <div class="max-h-60 overflow-y-auto custom-scrollbar py-1">
          <button *ngFor="let option of filteredOptions"
                  type="button"
                  (click)="select(option)"
                  [class.bg-primary-50]="isSelected(option)"
                  [class.dark:bg-primary-900/20]="isSelected(option)"
                  [class.text-primary-600]="isSelected(option)"
                  class="w-full px-4 py-2.5 text-left text-sm font-bold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex flex-col">
            <span>{{ getLabel(option) }}</span>
            <span *ngIf="getSubLabel(option)" class="text-[10px] text-slate-500 dark:text-slate-400 font-medium uppercase tracking-wider">
              {{ getSubLabel(option) }}
            </span>
          </button>
          
          <div *ngIf="filteredOptions.length === 0" class="px-4 py-8 text-center">
            <p class="text-slate-500 dark:text-slate-400 text-xs font-bold italic">No results found for "{{ searchQuery }}"</p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .custom-scrollbar::-webkit-scrollbar {
      width: 4px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #e2e8f0;
      border-radius: 10px;
    }
    .dark .custom-scrollbar::-webkit-scrollbar-thumb {
      background: #334155;
    }
  `]
})
export class SearchableSelectComponent implements OnInit, OnChanges {
  @Input() options: any[] = [];
  @Input() placeholder: string = '-- Select Option --';
  @Input() searchPlaceholder: string = 'Search...';
  @Input() labelKey: string = 'name';
  @Input() subLabelKey: string = '';
  @Input() valueKey: string = 'id';
  @Input() multiple: boolean = false;
  @Input() itemsLabel: string = 'items';
  @Input() modelValue: any = null;

  @Output() modelValueChange = new EventEmitter<any>();
  @Output() onChange = new EventEmitter<any>();

  isOpen = false;
  searchQuery = '';
  filteredOptions: any[] = [];
  selectedItems: any[] = [];

  constructor(private elementRef: ElementRef) { }

  ngOnInit() {
    this.filteredOptions = this.options;
    this.updateSelectedItem();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['options']) {
      this.filterOptions();
      this.updateSelectedItem();
    }
    if (changes['modelValue']) {
      this.updateSelectedItem();
    }
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event) {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.searchQuery = '';
      this.filteredOptions = this.options;
      // Focus the input in next tick
      setTimeout(() => {
        const input = this.elementRef.nativeElement.querySelector('input');
        if (input) input.focus();
      }, 0);
    }
  }

  filterOptions() {
    if (!this.searchQuery) {
      this.filteredOptions = this.options;
      return;
    }
    const query = this.searchQuery.toLowerCase();
    this.filteredOptions = this.options.filter(option => {
      const label = this.getLabel(option).toLowerCase();
      const subLabel = this.getSubLabel(option)?.toLowerCase() || '';
      return label.includes(query) || subLabel.includes(query);
    });
  }

  select(option: any) {
    const value = option[this.valueKey];
    
    if (this.multiple) {
      let currentValues = Array.isArray(this.modelValue) ? [...this.modelValue] : [];
      const index = currentValues.indexOf(value);
      
      if (index > -1) {
        currentValues.splice(index, 1);
      } else {
        currentValues.push(value);
      }
      
      this.modelValue = currentValues;
      this.updateSelectedItem();
      this.modelValueChange.emit(this.modelValue);
      this.onChange.emit(this.selectedItems);
    } else {
      this.modelValue = value;
      this.updateSelectedItem();
      this.modelValueChange.emit(value);
      this.onChange.emit(option);
      this.isOpen = false;
    }
  }

  isSelected(option: any): boolean {
    const value = option[this.valueKey];
    if (this.multiple) {
      return Array.isArray(this.modelValue) && this.modelValue.includes(value);
    }
    return String(this.modelValue) === String(value);
  }

  getLabel(option: any): string {
    return option[this.labelKey] || '';
  }

  getSubLabel(option: any): string {
    return this.subLabelKey ? option[this.subLabelKey] : '';
  }

  getDisplayLabel(): string {
    if (this.multiple) {
      if (!this.selectedItems || this.selectedItems.length === 0) return this.placeholder;
      if (this.selectedItems.length === 1) return this.getLabel(this.selectedItems[0]);
      return `${this.selectedItems.length} ${this.itemsLabel} selected`;
    }
    return this.selectedItems.length > 0 ? this.getLabel(this.selectedItems[0]) : this.placeholder;
  }

  updateSelectedItem() {
    if (this.modelValue !== null && this.modelValue !== undefined) {
      if (this.multiple) {
        const values = Array.isArray(this.modelValue) ? this.modelValue : [this.modelValue];
        this.selectedItems = this.options.filter(opt => {
          const optVal = opt[this.valueKey];
          return values.some(v => String(v) === String(optVal));
        });
      } else {
        const found = this.options.find(opt => String(opt[this.valueKey]) === String(this.modelValue));
        this.selectedItems = found ? [found] : [];
      }
    } else {
      this.selectedItems = [];
    }
  }
}
