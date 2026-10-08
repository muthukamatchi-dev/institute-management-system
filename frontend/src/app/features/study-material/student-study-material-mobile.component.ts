import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataService } from '../../services/data.service';
import { StudentStudyMaterialComponent } from './student-study-material.component';
import { SearchableSelectComponent } from '../../shared/ui/searchable-select.component';

@Component({
  selector: 'app-student-study-material-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, SearchableSelectComponent],
  templateUrl: './student-study-material-mobile.component.html'
})
export class StudentStudyMaterialMobileComponent extends StudentStudyMaterialComponent {
  constructor(dataService: DataService) {
    super(dataService);
  }
}
