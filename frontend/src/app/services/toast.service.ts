import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toasts: Toast[] = [];
  private toastsSubject = new BehaviorSubject<Toast[]>([]);
  private counter = 0;

  get toasts$(): Observable<Toast[]> {
    return this.toastsSubject.asObservable();
  }

  success(message: string, duration = 4000) {
    this.show(message, 'success', duration);
  }

  error(message: string, duration = 5000) {
    this.show(message, 'error', duration);
  }

  warning(message: string, duration = 4500) {
    this.show(message, 'warning', duration);
  }

  info(message: string, duration = 4000) {
    this.show(message, 'info', duration);
  }

  private show(message: string, type: Toast['type'], duration: number) {
    const id = this.counter++;
    const toast: Toast = { id, message, type, duration };
    this.toasts.push(toast);
    this.toastsSubject.next([...this.toasts]);

    if (duration > 0) {
      setTimeout(() => this.remove(id), duration);
    }
  }

  remove(id: number) {
    this.toasts = this.toasts.filter(t => t.id !== id);
    this.toastsSubject.next([...this.toasts]);
  }
}
