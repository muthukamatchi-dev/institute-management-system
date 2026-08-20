import { Injectable } from '@angular/core';
import { BehaviorSubject, filter, first } from 'rxjs';
import { DataService } from './data.service';
import { Branch } from '../models';

@Injectable({
  providedIn: 'root'
})
export class BranchContextService {
  private selectedBranchIdSource = new BehaviorSubject<string | number | 'all'>('all');
  selectedBranchId$ = this.selectedBranchIdSource.asObservable();

  private isEnabledSource = new BehaviorSubject<boolean>(false);
  isEnabled$ = this.isEnabledSource.asObservable();

  private branchesSource = new BehaviorSubject<Branch[]>([]);
  branches$ = this.branchesSource.asObservable();

  private isHeaderHiddenSource = new BehaviorSubject<boolean>(false);
  isHeaderHidden$ = this.isHeaderHiddenSource.asObservable();

  constructor(private dataService: DataService) {
    // Only refresh context if a token exists, to avoid 401 loops on login page
    if (localStorage.getItem('token')) {
      this.refreshContext();
    }
  }

  refreshContext() {
    if (!localStorage.getItem('token')) return;

    this.dataService.getSettings().subscribe({
      next: (settings) => {
        const enabled = settings.enableMultipleBranches || settings.enable_multiple_branches == 1;
        this.isEnabledSource.next(enabled);

        if (enabled) {
          this.dataService.getActiveBranches().subscribe(branches => {
            this.branchesSource.next(branches);

            const selectedBranchId = this.resolveSelectedBranchId(branches);
            this.setSelectedBranchId(selectedBranchId);
          });
        }
      },
      error: (err) => console.log('Branch context refresh skipped (unauthorized)')
    });
  }

  private resolveSelectedBranchId(branches: Branch[]): string | number | 'all' {
    const saved = localStorage.getItem('selectedBranchId');
    if (saved === 'all') {
      return 'all';
    }

    const mainBranch = branches.find(branch => branch.isMain);
    const mainBranchId = mainBranch?.id;
    const fallbackBranchId = mainBranchId ?? branches[0]?.id;

    if (!saved) {
      return fallbackBranchId ?? 'all';
    }

    const matchingBranch = branches.find(branch => String(branch.id) === String(saved));
    if (matchingBranch?.id !== undefined) {
      return matchingBranch.id;
    }

    return fallbackBranchId ?? 'all';
  }

  setSelectedBranchId(id: string | number | 'all') {
    this.selectedBranchIdSource.next(id);
    localStorage.setItem('selectedBranchId', String(id));
  }

  getSelectedBranchId(): string | number | 'all' {
    return this.selectedBranchIdSource.getValue();
  }

  isEnabled(): boolean {
    return this.isEnabledSource.getValue();
  }

  getBranches(): Branch[] {
    return this.branchesSource.getValue();
  }

  setHeaderHidden(hidden: boolean) {
    this.isHeaderHiddenSource.next(hidden);
  }
}
