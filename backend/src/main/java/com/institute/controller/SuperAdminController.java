package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.model.Tenant;
import com.institute.service.TenantService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * Super Admin Controller — Platform-level management.
 * All endpoints require ROLE_SUPER_ADMIN authority.
 */
@RestController
@RequestMapping("/api/admin")
public class SuperAdminController {

    private final TenantService tenantService;

    public SuperAdminController(TenantService tenantService) {
        this.tenantService = tenantService;
    }

    // =============================================
    // TENANT CRUD
    // =============================================

    /**
     * GET /api/admin/tenants — List all tenants
     */
    @GetMapping("/tenants")
    public ResponseEntity<ApiResponse> getAllTenants(Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied. Super Admin only."));
        }
        List<Tenant> tenants = tenantService.getAllTenants();
        return ResponseEntity.ok(ApiResponse.success(tenants));
    }

    /**
     * GET /api/admin/tenant/{id} — Get single tenant
     */
    @GetMapping("/tenant/{id}")
    public ResponseEntity<ApiResponse> getTenant(@PathVariable Long id, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }
        return tenantService.getTenantById(id)
                .map(t -> ResponseEntity.ok(ApiResponse.success(t)))
                .orElse(ResponseEntity.badRequest().body(ApiResponse.error("Tenant not found")));
    }

    /**
     * POST /api/admin/create-tenant — Create new tenant with full onboarding
     */
    @PostMapping("/create-tenant")
    public ResponseEntity<ApiResponse> createTenant(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        try {
            // Validate required fields
            String validationError = validateTenantPayload(body, false);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(ApiResponse.error(validationError));
            }

            Map<String, Object> result = tenantService.createTenant(body);
            return ResponseEntity.ok(ApiResponse.success(result, "Tenant created successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/admin/update-tenant — Update tenant details
     */
    @PostMapping("/update-tenant")
    public ResponseEntity<ApiResponse> updateTenant(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        try {
            String validationError = validateTenantPayload(body, true);
            if (validationError != null) {
                return ResponseEntity.badRequest().body(ApiResponse.error(validationError));
            }
            Long id = Long.valueOf(body.get("id").toString());
            Tenant updated = tenantService.updateTenant(id, body);
            return ResponseEntity.ok(ApiResponse.success(updated, "Tenant updated successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/admin/disable-tenant — Disable a tenant
     */
    @PostMapping("/disable-tenant")
    public ResponseEntity<ApiResponse> disableTenant(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        try {
            Long id = Long.valueOf(body.get("id").toString());
            Tenant disabled = tenantService.disableTenant(id);
            return ResponseEntity.ok(ApiResponse.success(disabled, "Tenant disabled."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/admin/enable-tenant — Enable a tenant
     */
    @PostMapping("/enable-tenant")
    public ResponseEntity<ApiResponse> enableTenant(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        try {
            Long id = Long.valueOf(body.get("id").toString());
            Tenant enabled = tenantService.enableTenant(id);
            return ResponseEntity.ok(ApiResponse.success(enabled, "Tenant enabled."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/admin/delete-tenant — Delete an institute/tenant completely
     */
    @PostMapping("/delete-tenant")
    public ResponseEntity<ApiResponse> deleteTenant(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        try {
            Long id = Long.valueOf(body.get("id").toString());
            tenantService.deleteTenant(id);
            return ResponseEntity.ok(ApiResponse.success(null, "Institute deleted successfully."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/admin/switch-db-mode — Switch between shared/dedicated
     */
    @PostMapping("/switch-db-mode")
    public ResponseEntity<ApiResponse> switchDatabaseMode(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        try {
            Long id = Long.valueOf(body.get("id").toString());
            String mode = (String) body.get("database_type");
            Tenant updated = tenantService.switchDatabaseMode(id, mode);
            return ResponseEntity.ok(ApiResponse.success(updated, "Database mode changed to " + mode + "."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * POST /api/admin/reset-password — Reset tenant admin password
     */
    @PostMapping("/reset-password")
    public ResponseEntity<ApiResponse> resetAdminPassword(@RequestBody Map<String, Object> body, Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }

        try {
            Long id = Long.valueOf(body.get("id").toString());
            String newPassword = (String) body.getOrDefault("new_password", "admin123");
            boolean success = tenantService.resetAdminPassword(id, newPassword);
            if (success) {
                return ResponseEntity.ok(ApiResponse.success(null, "Admin password reset successfully."));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error("Admin user not found for this tenant."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * GET /api/admin/stats — Super admin dashboard stats
     */
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse> getStats(Authentication auth) {
        if (!isSuperAdmin(auth)) {
            return ResponseEntity.status(403).body(ApiResponse.error("Access denied."));
        }
        return ResponseEntity.ok(ApiResponse.success(tenantService.getSuperAdminStats()));
    }

    // =============================================
    // HELPER
    // =============================================

    private boolean isSuperAdmin(Authentication auth) {
        if (auth == null) return false;
        return auth.getAuthorities().contains(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
    }

    private String validateTenantPayload(Map<String, Object> body, boolean isUpdate) {
        if (isUpdate && !body.containsKey("id")) {
            return "id is required.";
        }

        if (!isUpdate) {
            if (!body.containsKey("tenant_name") || !body.containsKey("tenant_code") || !body.containsKey("admin_email")) {
                return "tenant_name, tenant_code, and admin_email are required.";
            }
        }

        if (body.containsKey("tenant_code")) {
            String code = body.get("tenant_code").toString().trim().toUpperCase();
            body.put("tenant_code", code);
            if (code.isEmpty()) return "tenant_code is required.";
            if (!code.matches("^[A-Z0-9_\\-]{2,50}$")) {
                return "tenant_code must be 2-50 characters (A-Z, 0-9, '_' or '-').";
            }
        }

        if (body.containsKey("tenant_name")) {
            String name = body.get("tenant_name").toString().trim();
            if (name.isEmpty()) return "tenant_name is required.";
        }

        if (body.containsKey("admin_name")) {
            String name = body.get("admin_name").toString().trim();
            if (name.isEmpty()) return "admin_name is required.";
        }

        if (body.containsKey("admin_email")) {
            String email = body.get("admin_email").toString().trim();
            if (email.isEmpty()) return "admin_email is required.";
            if (!email.contains("@")) return "admin_email must be a valid email.";
        }

        if (body.containsKey("admin_username")) {
            String username = body.get("admin_username").toString().trim().toLowerCase();
            body.put("admin_username", username);
            if (username.isEmpty()) return "admin_username is required.";
            if (!username.matches("^[a-z0-9_\\-]{3,50}$")) {
                return "admin_username must be 3-50 characters (lowercase letters, numbers, '_' or '-').";
            }
        }

        if (body.containsKey("database_type")) {
            String dbType = body.get("database_type").toString().trim().toLowerCase();
            if (!dbType.isEmpty() && !dbType.equals("shared") && !dbType.equals("dedicated")) {
                return "database_type must be 'shared' or 'dedicated'.";
            }
        }

        return null;
    }
}
