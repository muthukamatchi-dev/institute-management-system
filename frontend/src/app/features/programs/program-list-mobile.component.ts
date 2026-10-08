import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-program-list-mobile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './program-list-mobile.component.html'
})
export class ProgramListMobileComponent implements OnInit {
  programs: any[] = [];
  searchTerm = '';

  constructor(
    private dataService: DataService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadPrograms();
  }

  loadPrograms() {
    this.dataService.getPrograms().subscribe({
      next: (data) => this.programs = data,
      error: () => this.toastService.error('Failed to load programs')
    });
  }

  filteredPrograms() {
    return this.programs.filter(p =>
      p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      (p.category && p.category.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );
  }

  openBuilder(id: string | number) {
    this.router.navigate(['/programs', id, 'builder']);
  }
}
