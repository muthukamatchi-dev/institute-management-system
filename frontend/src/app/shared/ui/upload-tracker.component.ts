import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UploadTrackerService, UploadTask } from '../../services/upload-tracker.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-upload-tracker',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- Floating Upload Tracker Panel -->
    <div *ngIf="tasks.length > 0"
         class="upload-tracker-container"
         [class.collapsed]="isCollapsed">

      <!-- Header -->
      <div class="tracker-header" (click)="toggleCollapse()">
        <div class="header-left">
          <div class="header-icon" [class.spinning]="hasActiveUploads">
            <svg *ngIf="hasActiveUploads" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            <svg *ngIf="!hasActiveUploads" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="header-text">
            <span class="header-title">
              {{ hasActiveUploads ? 'Uploading...' : 'Uploads Complete' }}
            </span>
            <span class="header-count">{{ activeTasks.length > 0 ? activeTasks.length + ' active' : tasks.length + ' done' }}</span>
          </div>
        </div>
        <div class="header-actions">
          <button *ngIf="!hasActiveUploads" class="clear-all-btn" (click)="clearAll($event)" title="Clear all">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
          <button class="collapse-btn" [class.rotated]="isCollapsed">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Task List -->
      <div class="tracker-body" *ngIf="!isCollapsed">
        <div *ngFor="let task of tasks; trackBy: trackTask"
             class="upload-item"
             [class.uploading]="task.status === 'uploading'"
             [class.processing]="task.status === 'processing'"
             [class.completed]="task.status === 'completed'"
             [class.error]="task.status === 'error'"
             [@slideIn]>

          <!-- File Icon -->
          <div class="item-icon">
            <!-- Spinner for uploading/processing -->
            <div *ngIf="task.status === 'uploading' || task.status === 'processing'" class="spinner-ring">
              <svg viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="15" fill="none" stroke="rgba(255,255,255,0.15)" stroke-width="3"/>
                <circle cx="18" cy="18" r="15" fill="none" stroke="currentColor" stroke-width="3"
                  stroke-dasharray="94.2" [attr.stroke-dashoffset]="94.2 - (94.2 * task.progress / 100)"
                  stroke-linecap="round" class="progress-ring"/>
              </svg>
              <span class="spinner-icon">📄</span>
            </div>
            <!-- Success icon -->
            <div *ngIf="task.status === 'completed'" class="success-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <!-- Error icon -->
            <div *ngIf="task.status === 'error'" class="error-icon-wrap">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </div>
          </div>

          <!-- File Info -->
          <div class="item-info">
            <p class="item-filename">{{ truncateFileName(task.fileName) }}</p>
            <p class="item-status">
              <span *ngIf="task.status === 'uploading'">Uploading...</span>
              <span *ngIf="task.status === 'processing'">{{ task.message || 'Processing...' }}</span>
              <span *ngIf="task.status === 'completed'" class="status-success">{{ task.message || 'Done!' }}</span>
              <span *ngIf="task.status === 'error'" class="status-error">{{ task.message || 'Failed' }}</span>
            </p>
          </div>

          <!-- Progress Bar (only for active uploads) -->
          <div *ngIf="task.status === 'uploading' || task.status === 'processing'" class="item-progress-bar">
            <div class="progress-fill" [style.width.%]="task.progress"
                 [class.indeterminate]="task.status === 'processing'"></div>
          </div>

          <!-- Close button -->
          <button class="item-close" (click)="removeTask(task.id, $event)"
                  *ngIf="task.status === 'completed' || task.status === 'error'">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 9999;
      font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    }

    .upload-tracker-container {
      width: 380px;
      max-width: calc(100vw - 48px);
      background: linear-gradient(145deg, #1a1f35, #141829);
      border: 1px solid rgba(99, 102, 241, 0.2);
      border-radius: 20px;
      box-shadow:
        0 20px 60px rgba(0, 0, 0, 0.5),
        0 0 40px rgba(99, 102, 241, 0.08),
        inset 0 1px 0 rgba(255, 255, 255, 0.05);
      overflow: hidden;
      animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
      backdrop-filter: blur(20px);
    }

    @keyframes slideUp {
      from { transform: translateY(40px) scale(0.95); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }

    /* Header */
    .tracker-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 18px;
      cursor: pointer;
      user-select: none;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      transition: background 0.2s;
    }

    .tracker-header:hover {
      background: rgba(255, 255, 255, 0.03);
    }

    .collapsed .tracker-header {
      border-bottom: none;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .header-icon {
      width: 34px;
      height: 34px;
      border-radius: 10px;
      background: linear-gradient(135deg, #6366f1, #818cf8);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      flex-shrink: 0;
    }

    .header-icon svg {
      width: 18px;
      height: 18px;
    }

    .header-icon.spinning {
      animation: pulse 2s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
      50% { box-shadow: 0 0 0 8px rgba(99, 102, 241, 0); }
    }

    .header-text {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .header-title {
      font-size: 13px;
      font-weight: 800;
      color: #e2e8f0;
      letter-spacing: -0.01em;
    }

    .header-count {
      font-size: 10px;
      font-weight: 700;
      color: #6366f1;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .clear-all-btn, .collapse-btn {
      width: 28px;
      height: 28px;
      border: none;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 8px;
      color: #94a3b8;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .clear-all-btn:hover {
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
    }

    .collapse-btn:hover {
      background: rgba(255, 255, 255, 0.1);
      color: #e2e8f0;
    }

    .clear-all-btn svg, .collapse-btn svg {
      width: 14px;
      height: 14px;
    }

    .collapse-btn {
      transition: transform 0.3s ease;
    }

    .collapse-btn.rotated {
      transform: rotate(180deg);
    }

    /* Body */
    .tracker-body {
      max-height: 280px;
      overflow-y: auto;
      padding: 8px;
    }

    .tracker-body::-webkit-scrollbar {
      width: 4px;
    }

    .tracker-body::-webkit-scrollbar-thumb {
      background: rgba(99, 102, 241, 0.3);
      border-radius: 4px;
    }

    /* Upload Item */
    .upload-item {
      position: relative;
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 14px 14px 18px;
      border-radius: 14px;
      margin-bottom: 4px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.04);
      transition: all 0.3s;
      overflow: hidden;
      animation: itemIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes itemIn {
      from { transform: translateX(20px); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .upload-item.completed {
      border-color: rgba(34, 197, 94, 0.15);
      background: rgba(34, 197, 94, 0.05);
    }

    .upload-item.error {
      border-color: rgba(239, 68, 68, 0.15);
      background: rgba(239, 68, 68, 0.05);
    }

    /* Item Icon */
    .item-icon {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-ring {
      width: 40px;
      height: 40px;
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .spinner-ring svg {
      position: absolute;
      width: 40px;
      height: 40px;
      transform: rotate(-90deg);
      color: #6366f1;
    }

    .progress-ring {
      transition: stroke-dashoffset 0.5s ease;
    }

    .spinner-icon {
      font-size: 16px;
      z-index: 1;
    }

    .success-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #22c55e, #16a34a);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      animation: successPop 0.4s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .success-icon-wrap svg {
      width: 18px;
      height: 18px;
    }

    @keyframes successPop {
      0% { transform: scale(0); }
      60% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .error-icon-wrap {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #ef4444, #dc2626);
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
    }

    .error-icon-wrap svg {
      width: 16px;
      height: 16px;
    }

    /* Item Info */
    .item-info {
      flex: 1;
      min-width: 0;
    }

    .item-filename {
      font-size: 12.5px;
      font-weight: 700;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin: 0;
      line-height: 1.3;
    }

    .item-status {
      font-size: 10.5px;
      font-weight: 600;
      color: #6366f1;
      margin: 3px 0 0;
      line-height: 1;
    }

    .status-success {
      color: #22c55e;
    }

    .status-error {
      color: #ef4444;
    }

    /* Progress Bar */
    .item-progress-bar {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: rgba(255, 255, 255, 0.06);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #6366f1, #818cf8, #a78bfa);
      border-radius: 0 3px 3px 0;
      transition: width 0.6s cubic-bezier(0.16, 1, 0.3, 1);
      position: relative;
    }

    .progress-fill::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
      animation: shimmer 1.5s infinite;
    }

    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }

    .progress-fill.indeterminate {
      width: 40% !important;
      animation: indeterminate 1.5s ease-in-out infinite;
    }

    @keyframes indeterminate {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(350%); }
    }

    /* Close button */
    .item-close {
      width: 24px;
      height: 24px;
      border: none;
      background: rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      color: #64748b;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      transition: all 0.2s;
    }

    .item-close:hover {
      background: rgba(255, 255, 255, 0.12);
      color: #e2e8f0;
    }

    .item-close svg {
      width: 12px;
      height: 12px;
    }

    /* Responsive */
    @media (max-width: 480px) {
      :host {
        bottom: 12px;
        right: 12px;
      }
      .upload-tracker-container {
        width: calc(100vw - 24px);
      }
    }
  `]
})
export class UploadTrackerComponent implements OnInit, OnDestroy {
  tasks: UploadTask[] = [];
  isCollapsed = false;
  private sub!: Subscription;

  constructor(private uploadTracker: UploadTrackerService) {}

  ngOnInit() {
    this.sub = this.uploadTracker.tasks$.subscribe(tasks => {
      this.tasks = tasks;
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  get hasActiveUploads(): boolean {
    return this.tasks.some(t => t.status === 'uploading' || t.status === 'processing');
  }

  get activeTasks(): UploadTask[] {
    return this.tasks.filter(t => t.status === 'uploading' || t.status === 'processing');
  }

  toggleCollapse() {
    this.isCollapsed = !this.isCollapsed;
  }

  removeTask(id: string, event: Event) {
    event.stopPropagation();
    this.uploadTracker.removeTask(id);
  }

  clearAll(event: Event) {
    event.stopPropagation();
    const completedOrErrorTasks = this.tasks.filter(t => t.status === 'completed' || t.status === 'error');
    completedOrErrorTasks.forEach(t => this.uploadTracker.removeTask(t.id));
  }

  truncateFileName(name: string): string {
    if (!name) return 'Unknown file';
    if (name.length <= 35) return name;
    const ext = name.lastIndexOf('.') > 0 ? name.substring(name.lastIndexOf('.')) : '';
    const base = name.substring(0, name.lastIndexOf('.') > 0 ? name.lastIndexOf('.') : name.length);
    if (base.length <= 30) return name;
    return base.substring(0, 28) + '...' + ext;
  }

  trackTask(index: number, task: UploadTask): string {
    return task.id;
  }
}
