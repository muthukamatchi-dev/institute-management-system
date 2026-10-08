import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

@Component({
  selector: 'app-date-picker',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DatePickerComponent),
      multi: true
    }
  ],
  template: `
    <div class="relative w-full flex items-center group">
      <!-- Visible Formatted Text Input (DD-MM-YYYY) -->
      <input
        type="text"
        [value]="displayText"
        (input)="onTextInput($event)"
        (blur)="onBlur()"
        (click)="openPicker()"
        [placeholder]="placeholder"
        [disabled]="disabled"
        [readonly]="readonly"
        [class]="inputClass + ' pr-10 cursor-pointer'"
      />

      <!-- Action Button / Hidden Native Date Picker Trigger -->
      <div class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
        <span class="text-sm opacity-60 group-hover:opacity-100 transition-opacity">📅</span>
      </div>

      <!-- Hidden Native HTML Date Picker -->
      <input
        #hiddenPicker
        type="date"
        [value]="isoValue"
        (change)="onNativeDateChange($event)"
        class="sr-only absolute opacity-0 w-0 h-0 pointer-events-none"
        tabindex="-1"
      />
    </div>
  `
})
export class DatePickerComponent implements ControlValueAccessor {
  @Input() placeholder: string = 'DD-MM-YYYY';
  @Input() inputClass: string = 'w-full px-3 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-xl text-slate-800 dark:text-white font-bold text-sm transition-all outline-none';
  @Input() disabled: boolean = false;
  @Input() readonly: boolean = false;
  @Output() change = new EventEmitter<string>();

  @ViewChild('hiddenPicker') hiddenPicker!: ElementRef<HTMLInputElement>;

  isoValue: string = ''; // Format: YYYY-MM-DD
  displayText: string = ''; // Format: DD-MM-YYYY

  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};

  writeValue(val: any): void {
    if (!val) {
      this.isoValue = '';
      this.displayText = '';
      return;
    }
    let dateStr = '';
    if (val instanceof Date) {
      const year = val.getFullYear();
      const month = String(val.getMonth() + 1).padStart(2, '0');
      const day = String(val.getDate()).padStart(2, '0');
      dateStr = `${year}-${month}-${day}`;
    } else if (typeof val === 'string') {
      dateStr = val.split('T')[0];
    }

    if (dateStr && dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      this.isoValue = dateStr;
      const [y, m, d] = dateStr.split('-');
      this.displayText = `${d}-${m}-${y}`;
    } else {
      this.isoValue = '';
      this.displayText = val || '';
    }
  }

  registerOnChange(fn: any): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  openPicker() {
    if (this.disabled || this.readonly) return;
    try {
      if (this.hiddenPicker && this.hiddenPicker.nativeElement.showPicker) {
        this.hiddenPicker.nativeElement.showPicker();
      } else if (this.hiddenPicker) {
        this.hiddenPicker.nativeElement.focus();
        this.hiddenPicker.nativeElement.click();
      }
    } catch (e) {
      // Fallback
    }
  }

  onNativeDateChange(event: Event) {
    const target = event.target as HTMLInputElement;
    const val = target.value; // YYYY-MM-DD
    if (val) {
      this.isoValue = val;
      const [y, m, d] = val.split('-');
      this.displayText = `${d}-${m}-${y}`;
      this.onChange(val);
      this.change.emit(val);
    } else {
      this.isoValue = '';
      this.displayText = '';
      this.onChange('');
      this.change.emit('');
    }
  }

  onTextInput(event: Event) {
    const input = (event.target as HTMLInputElement).value.trim();
    this.displayText = input;

    const parts = input.split(/[-/.]/);
    if (parts.length === 3) {
      let [d, m, y] = parts;
      if (y.length === 2) y = '20' + y;
      if (d.length === 1) d = '0' + d;
      if (m.length === 1) m = '0' + m;

      const dayNum = parseInt(d, 10);
      const monthNum = parseInt(m, 10);
      const yearNum = parseInt(y, 10);

      if (
        monthNum >= 1 && monthNum <= 12 &&
        dayNum >= 1 && dayNum <= 31 &&
        yearNum >= 1900 && yearNum <= 2100
      ) {
        const iso = `${y}-${m}-${d}`;
        this.isoValue = iso;
        this.onChange(iso);
        this.change.emit(iso);
        return;
      }
    }

    if (!input) {
      this.isoValue = '';
      this.onChange('');
      this.change.emit('');
    }
  }

  onBlur() {
    this.onTouched();
    if (this.isoValue) {
      const [y, m, d] = this.isoValue.split('-');
      this.displayText = `${d}-${m}-${y}`;
    }
  }
}
