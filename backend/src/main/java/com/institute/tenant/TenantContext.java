package com.institute.tenant;

/**
 * Multi-Tenant Context - ThreadLocal holder
 * Stores:
 * 1) Tenant ID (business tenant_code) for data isolation filters.
 * 2) Data source key (shared DB or dedicated DB name) for routing.
 * 3) Database mode (shared/dedicated).
 */
public class TenantContext {
    private static final ThreadLocal<String> TENANT_ID = new ThreadLocal<>();
    private static final ThreadLocal<String> DATA_SOURCE_KEY = new ThreadLocal<>();
    private static final ThreadLocal<String> DATABASE_MODE = new ThreadLocal<>();

    /**
     * Tenant ID used for tenant_id filters (shared database mode).
     */
    public static String getTenantId() {
        String tenant = TENANT_ID.get();
        return tenant != null ? tenant : "DEFAULT";
    }

    public static void setTenantId(String tenantId) {
        TENANT_ID.set(tenantId);
    }

    /**
     * Data source key used for routing.
     * For shared tenants -> "default" (shared database)
     * For dedicated tenants -> actual database name
     */
    public static String getCurrentTenant() {
        String key = DATA_SOURCE_KEY.get();
        return key != null ? key : "default";
    }

    public static void setCurrentTenant(String dataSourceKey) {
        DATA_SOURCE_KEY.set(dataSourceKey);
    }

    public static String getDatabaseMode() {
        return DATABASE_MODE.get();
    }

    public static void setDatabaseMode(String mode) {
        DATABASE_MODE.set(mode);
    }

    private static final ThreadLocal<Boolean> IS_READ_ONLY = new ThreadLocal<>();
    
    /**
     * Is this tenant in read-only mode (trial expired)?
     */
    public static boolean isReadOnly() {
        Boolean value = IS_READ_ONLY.get();
        return value != null && value;
    }

    public static void setReadOnly(boolean readOnly) {
        IS_READ_ONLY.set(readOnly);
    }

    public static void clear() {
        TENANT_ID.remove();
        DATA_SOURCE_KEY.remove();
        DATABASE_MODE.remove();
        IS_READ_ONLY.remove();
    }
}
