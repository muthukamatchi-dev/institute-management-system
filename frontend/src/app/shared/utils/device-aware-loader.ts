import { inject } from '@angular/core';
import { DeviceService } from '../../services/device.service';

/**
 * Device-aware lazy component loader for Angular routes.
 * Checks DeviceService.isMobile and loads the appropriate component.
 *
 * @deprecated This utility is not currently used. All routes use the inline
 * `deviceRoute()` helper defined in `app.routes.ts`, which provides the same
 * functionality with additional export-key resolution. Kept for reference
 * and potential future use.
 *
 * @see app.routes.ts — `deviceRoute()` for the active implementation.
 */
export function deviceAwareLoad(
  desktopLoader: () => Promise<any>,
  mobileLoader: () => Promise<any>
): () => Promise<any> {
  return () => {
    const deviceService = inject(DeviceService);
    return deviceService.isMobile ? mobileLoader() : desktopLoader();
  };
}

