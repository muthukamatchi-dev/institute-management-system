import { Injectable, OnDestroy } from '@angular/core';
import { fromEvent, merge, Observable, BehaviorSubject, Subscription } from 'rxjs';
import { distinctUntilChanged, debounceTime } from 'rxjs/operators';

export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Presentation mode used for route-level component selection.
 *
 * Two-mode policy:
 *   Phone / Tablet  → 'mobile'  → Mobile UI components
 *   Laptop / Desktop → 'desktop' → Desktop UI components
 */
export type PresentationMode = 'mobile' | 'desktop';

/**
 * DeviceService — Multi-signal device detection for presentation routing.
 *
 * ## Purpose
 * Determines whether to render Mobile UI or Desktop UI components.
 * This is **strictly a UI/presentation decision** — it NEVER controls:
 *   - Authentication or authorization
 *   - User roles or permissions
 *   - Tenant or branch isolation
 *   - API access or security boundaries
 *   - Business rules
 *
 * ## Detection Signals
 * Uses multiple client-side signals (none individually authoritative):
 *   1. User-Agent string patterns (mobile/tablet keywords)
 *   2. iPad detection (iPadOS 13+ reports as Macintosh)
 *   3. Touch capability (`ontouchstart`, `maxTouchPoints`)
 *   4. Viewport width (<=1024px combined with touch = mobile)
 *   5. Resize and orientation change events (debounced)
 *
 * ## Two-Mode Policy
 * Internal detection classifies into `mobile`, `tablet`, `desktop`,
 * but the public `isMobile` property maps to two modes:
 *   - `mobile` + `tablet` → isMobile = true  → Mobile UI
 *   - `desktop`           → isMobile = false → Desktop UI
 *
 * ## Security Note
 * All detection signals are client-controlled and can be spoofed.
 * A user changing their User-Agent or viewport ONLY changes which
 * UI they see — it cannot grant additional permissions. The backend
 * enforces all security rules independently via JWT, tenant resolution,
 * and role-based access control.
 */
@Injectable({ providedIn: 'root' })
export class DeviceService implements OnDestroy {

  private readonly MOBILE_MAX_WIDTH = 767;
  private readonly TABLET_MAX_WIDTH = 1024;

  private readonly mobileSubject = new BehaviorSubject<boolean>(this.detectMobile());
  private resizeSub?: Subscription;

  /** Observable that emits true when the device is mobile/tablet */
  readonly isMobile$: Observable<boolean> = this.mobileSubject.asObservable().pipe(
    distinctUntilChanged()
  );

  /** Current synchronous value — true for phones and tablets */
  get isMobile(): boolean {
    return this.mobileSubject.value;
  }

  /**
   * Returns the presentation mode used for route-level component selection.
   * Mobile + Tablet → 'mobile', Desktop → 'desktop'.
   */
  get presentationMode(): PresentationMode {
    return this.isMobile ? 'mobile' : 'desktop';
  }

  /** Returns the fine-grained device type (mobile, tablet, desktop) */
  get deviceType(): DeviceType {
    return this.detectDeviceType();
  }

  constructor() {
    // Listen for resize and orientation changes (debounced to avoid excessive processing)
    if (typeof window !== 'undefined') {
      this.resizeSub = merge(
        fromEvent(window, 'resize'),
        fromEvent(window, 'orientationchange')
      ).pipe(
        debounceTime(150)
      ).subscribe(() => {
        this.mobileSubject.next(this.detectMobile());
      });
    }
  }

  ngOnDestroy(): void {
    this.resizeSub?.unsubscribe();
  }

  /**
   * Multi-signal detection for mobile devices.
   * Uses UA string + viewport width + touch capability.
   */
  private detectMobile(): boolean {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    const ua = navigator.userAgent || '';

    // 1. Check User-Agent for known mobile/tablet patterns
    const mobileUAPatterns = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile|CriOS|FxiOS/i;
    const isUAMobile = mobileUAPatterns.test(ua);

    // 2. Check for iPad specifically (iPadOS 13+ reports as Mac)
    const isIPad = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;

    // 3. Check viewport width
    const viewportWidth = window.innerWidth;
    const isSmallViewport = viewportWidth <= this.TABLET_MAX_WIDTH;

    // 4. Check touch capability
    const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

    // Decision logic:
    // - If UA says mobile → mobile (phone or tablet)
    // - If iPad (even if UA says Mac) → mobile (tablet treated as mobile)
    // - If small viewport AND has touch → mobile
    // - Otherwise → desktop
    if (isUAMobile || isIPad) {
      return true;
    }

    if (isSmallViewport && hasTouch) {
      return true;
    }

    return false;
  }

  private detectDeviceType(): DeviceType {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return 'desktop';
    }

    const ua = navigator.userAgent || '';
    const viewportWidth = window.innerWidth;

    // Tablets
    const isTabletUA = /iPad|Android(?!.*Mobile)/i.test(ua);
    const isIPad = /Macintosh/i.test(ua) && navigator.maxTouchPoints > 1;

    if (isTabletUA || isIPad) {
      return 'tablet';
    }

    // Phones
    const isMobileUA = /iPhone|iPod|Android.*Mobile|webOS|BlackBerry|IEMobile|Opera Mini/i.test(ua);
    if (isMobileUA) {
      return 'mobile';
    }

    // Fallback to viewport
    if (viewportWidth <= this.MOBILE_MAX_WIDTH) {
      return 'mobile';
    }
    if (viewportWidth <= this.TABLET_MAX_WIDTH) {
      return 'tablet';
    }

    return 'desktop';
  }
}

