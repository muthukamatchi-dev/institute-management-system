package com.institute.service;

import com.institute.tenant.TenantContext;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * Database provisioning for dedicated tenants.
 * Uses the shared/master datasource to create dedicated databases.
 */
@Service
public class DatabaseProvisioningService {

    private final JdbcTemplate jdbcTemplate;

    public DatabaseProvisioningService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public void createDatabaseIfMissing(String databaseName) {
        if (databaseName == null || !databaseName.matches("^[A-Za-z0-9_]+$")) {
            throw new IllegalArgumentException("Invalid database name.");
        }
        String previousTenant = TenantContext.getCurrentTenant();
        String previousMode = TenantContext.getDatabaseMode();
        String previousTenantId = TenantContext.getTenantId();
        try {
            // Ensure we use the shared/master datasource for provisioning.
            TenantContext.setCurrentTenant("default");
            TenantContext.setDatabaseMode("shared");
            TenantContext.setTenantId("default");
            jdbcTemplate.execute("CREATE DATABASE IF NOT EXISTS `" + databaseName + "`");
        } finally {
            TenantContext.setCurrentTenant(previousTenant);
            TenantContext.setDatabaseMode(previousMode);
            TenantContext.setTenantId(previousTenantId);
        }
    }
}
