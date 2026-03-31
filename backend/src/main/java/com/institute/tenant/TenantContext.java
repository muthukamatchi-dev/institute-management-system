package com.institute.tenant;

/**
 * Multi-Tenant Context - ThreadLocal holder
 * NEW ADDITION: Non-breaking multi-tenant support
 * Tenant ID is extracted from X-Tenant-ID header by TokenAuthFilter
 */
public class TenantContext {
    private static final ThreadLocal<String> CURRENT_TENANT = new ThreadLocal<>();

    public static String getCurrentTenant() {
        String tenant = CURRENT_TENANT.get();
        return tenant != null ? tenant : "default";
    }

    public static void setCurrentTenant(String tenant) {
        CURRENT_TENANT.set(tenant);
    }

    public static void clear() {
        CURRENT_TENANT.remove();
    }
}
