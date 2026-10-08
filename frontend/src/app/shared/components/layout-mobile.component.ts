import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { PlanService } from '../../services/plan.service';
import { HeaderMobileComponent } from './header-mobile.component';
import { LayoutComponent } from './layout.component';

/**
 * Mobile layout shell — provides mobile header + router-outlet.
 *
 * Extends LayoutComponent to reuse all shared business logic
 * (role-based redirects, page-title resolution, read-only mode,
 * subscription cleanup). Only the template/styles differ.
 */
@Component({
  selector: 'app-layout-mobile',
  standalone: true,
  imports: [CommonModule, RouterModule, HeaderMobileComponent],
  template: `
    <div class="mobile-layout">
      <!-- Read-only banner -->
      <div *ngIf="isReadOnly" class="mobile-readonly-banner">
        <span>⚠️ READ-ONLY MODE</span>
        <span class="mobile-readonly-sub">Subscription expired</span>
      </div>

      <!-- Mobile Header -->
      <app-header-mobile [title]="pageTitle"></app-header-mobile>

      <!-- Main Content -->
      <main class="mobile-main-content">
        <router-outlet (activate)="onActivate($event)"></router-outlet>
      </main>
    </div>
  `,
  styles: [`
    .mobile-layout {
      display: flex;
      flex-direction: column;
      height: 100dvh;
      background: var(--bg-main);
      overflow: hidden;
    }
    .mobile-readonly-banner {
      background: linear-gradient(135deg, #d97706, #b45309);
      color: white;
      padding: 6px 16px;
      font-size: 10px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      text-align: center;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex-shrink: 0;
    }
    .mobile-readonly-sub {
      opacity: 0.8;
      font-weight: 700;
    }
    .mobile-main-content {
      flex: 1;
      overflow-y: auto;
      overflow-x: hidden;
      -webkit-overflow-scrolling: touch;
      padding-bottom: env(safe-area-inset-bottom, 0);
    }
  `]
})
export class LayoutMobileComponent extends LayoutComponent {
  constructor(
    authService: AuthService,
    router: Router,
    planService: PlanService
  ) {
    super(authService, router, planService);
  }
}

