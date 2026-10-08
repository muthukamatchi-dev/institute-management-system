import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';

export interface UploadTask {
  id: string;
  fileName: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number; // 0-100
  message?: string;
  subscription?: Subscription;
  startedAt: Date;
  completedAt?: Date;
}

@Injectable({
  providedIn: 'root'
})
export class UploadTrackerService {
  private tasks: UploadTask[] = [];
  private tasksSubject = new BehaviorSubject<UploadTask[]>([]);
  private counter = 0;

  get tasks$(): Observable<UploadTask[]> {
    return this.tasksSubject.asObservable();
  }

  get activeTasks(): UploadTask[] {
    return this.tasks.filter(t => t.status === 'uploading' || t.status === 'processing');
  }

  get hasActiveTasks(): boolean {
    return this.activeTasks.length > 0;
  }

  addTask(fileName: string, subscription?: Subscription): string {
    const id = `upload_${++this.counter}_${Date.now()}`;
    const task: UploadTask = {
      id,
      fileName,
      status: 'uploading',
      progress: 0,
      startedAt: new Date(),
      subscription
    };
    this.tasks.unshift(task);
    this.emit();
    return id;
  }

  updateProgress(id: string, progress: number) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.progress = Math.min(100, Math.max(0, progress));
      this.emit();
    }
  }

  setProcessing(id: string, message?: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = 'processing';
      task.progress = 80;
      task.message = message || 'Saving record...';
      this.emit();
    }
  }

  completeTask(id: string, message?: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = 'completed';
      task.progress = 100;
      task.message = message || 'Upload complete!';
      task.completedAt = new Date();
      this.emit();

      // Auto-remove completed task after 4 seconds
      setTimeout(() => this.removeTask(id), 4000);
    }
  }

  failTask(id: string, message?: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.status = 'error';
      task.message = message || 'Upload failed';
      task.completedAt = new Date();
      this.emit();

      // Auto-remove error task after 8 seconds
      setTimeout(() => this.removeTask(id), 8000);
    }
  }

  removeTask(id: string) {
    const task = this.tasks.find(t => t.id === id);
    if (task?.subscription) {
      task.subscription.unsubscribe();
    }
    this.tasks = this.tasks.filter(t => t.id !== id);
    this.emit();
  }

  private emit() {
    this.tasksSubject.next([...this.tasks]);
  }
}
