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

  constructor(private dataService: DataService) {
    this.refreshContext();
  }

  refreshContext() {
    this.dataService.getSettings().subscribe(settings => {
      const enabled = settings.enableMultipleBranches || settings.enable_multiple_branches == 1;
      this.isEnabledSource.next(enabled);
      
      if (enabled) {
        this.dataService.getActiveBranches().subscribe(branches => {
          this.branchesSource.next(branches);
          
          // Set default if none selected or the selected one isn't in the list
          const saved = localStorage.getItem('selectedBranchId');
          const mainBranchId = branches.find(b => b.isMain)?.id;
          
          if (!saved || (saved !== 'all' && !branches.find(b => String(b.id) === saved))) {
            const defaultId = mainBranchId || 'all';
            this.setSelectedBranchId(defaultId);
          } else {
            this.selectedBranchIdSource.next(saved === 'all' ? 'all' : saved);
          }
        });
      }
    });
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
}
