import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { DataService } from '../../services/data.service';
import { ToastService } from '../../services/toast.service';
import { ModalComponent } from '../../shared/ui/modal.component';

@Component({
  selector: 'app-program-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ModalComponent],
  templateUrl: './program-list.component.html'
})
export class ProgramListComponent implements OnInit {
  programs: any[] = [];
  searchTerm = '';
  statusFilter = 'all';
  isModalOpen = false;
  editingProgram = false;
  isSaving = false;

  newProgram: any = this.getInitialProgram();

  getInitialProgram() {
    return {
      id: null,
      name: '',
      programCode: '',
      description: '',
      category: 'Professional Diploma',
      totalDuration: '6 Months',
      totalFee: 0,
      feeMode: 'lump_sum',
      status: 'active'
    };
  }

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
    return this.programs.filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        (p.category && p.category.toLowerCase().includes(this.searchTerm.toLowerCase()));
      const matchesStatus = this.statusFilter === 'all' || p.status === this.statusFilter;
      return matchesSearch && matchesStatus;
    });
  }

  openCreateModal() {
    this.editingProgram = false;
    this.newProgram = this.getInitialProgram();
    this.isModalOpen = true;
  }

  openEditModal(program: any) {
    this.editingProgram = true;
    this.newProgram = { ...program };
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.editingProgram = false;
  }

  saveProgram() {
    if (!this.newProgram.name.trim()) {
      this.toastService.error('Please enter a program name');
      return;
    }

    this.isSaving = true;
    this.dataService.saveProgram(this.newProgram).subscribe({
      next: () => {
        this.toastService.success(`Program ${this.editingProgram ? 'updated' : 'created'} successfully`);
        this.isSaving = false;
        this.closeModal();
        this.loadPrograms();
      },
      error: (err) => {
        this.toastService.error(err?.error?.message || 'Error saving program');
        this.isSaving = false;
      }
    });
  }

  deleteProgram(program: any) {
    if (confirm(`Are you sure you want to delete program '${program.name}'?`)) {
      this.dataService.deleteProgram(program.id).subscribe({
        next: () => {
          this.toastService.success('Program deleted');
          this.loadPrograms();
        },
        error: (err) => {
          this.toastService.error(err?.error?.message || 'Cannot delete program');
        }
      });
    }
  }

  openBuilder(programId: string | number) {
    this.router.navigate(['/programs', programId, 'builder']);
  }
}
