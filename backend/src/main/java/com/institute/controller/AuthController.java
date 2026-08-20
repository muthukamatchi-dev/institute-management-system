package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.model.Tenant;
import com.institute.service.AuthService;
import com.institute.service.TenantService;
import com.institute.tenant.TenantContext;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import lombok.extern.slf4j.Slf4j;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Auth Controller — Subdomain-Based Multi-Tenant Authentication
 * 
 * Tenant is resolved by the TenantInterceptor from the subdomain in the Host header.
 * Login no longer requires a tenant_code field — it uses the request context.
 */
@RestController
@Slf4j
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final TenantService tenantService;

    public AuthController(AuthService authService, TenantService tenantService) {
        this.authService = authService;
        this.tenantService = tenantService;
    }

    /**
     * POST /api/auth/login
     * 
     * Tenant is already resolved by TenantInterceptor from the subdomain.
     * Body only needs: username + password (no institute code).
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        log.info("Login attempt for user: {} | tenant context: {}", username, TenantContext.getTenantId());

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Username and password are required"));
        }

        String tenantId = TenantContext.getTenantId();
        boolean isSuperAdminUsername = "superadmin".equalsIgnoreCase(username) || "systemadmin".equalsIgnoreCase(username);

        // 1. If username is superadmin / systemadmin OR on main domain (DEFAULT/no subdomain/SYSTEM), try Super Admin first
        if (isSuperAdminUsername || "DEFAULT".equalsIgnoreCase(tenantId) || "SYSTEM".equalsIgnoreCase(tenantId) || tenantId == null) {
            // Also check if tenant_code was sent in body for backward compatibility
            String tenantCode = body.containsKey("tenantCode") ? body.get("tenantCode") : body.get("tenant_code");
            
            if (isSuperAdminUsername || tenantCode == null || tenantCode.trim().isEmpty() || "SYSTEM".equalsIgnoreCase(tenantCode)) {
                // Try Super Admin login
                log.info("Attempting Super Admin auth for: {}", username);
                try {
                    TenantContext.setCurrentTenant("default");
                    TenantContext.setDatabaseMode("shared");
                    TenantContext.setTenantId("SYSTEM");

                    Map<String, Object> user = authService.loginSuperAdmin(username, password);
                    if (user != null) {
                        user.put("tenant_code", "SYSTEM");
                        log.info("Super Admin login successful: {}", username);
                        return ResponseEntity.ok(ApiResponse.builder()
                            .status("success")
                            .data(user)
                            .message("Super Admin login successful")
                            .build().withAdditional("user", user));
                    }
                } finally {
                    // Reset context
                    TenantContext.setTenantId("DEFAULT");
                    TenantContext.setCurrentTenant("default");
                    TenantContext.setDatabaseMode("shared");
                }

                if (isSuperAdminUsername) {
                    log.warn("Super Admin login failed for user: {}", username);
                    return ResponseEntity.status(401).body(ApiResponse.error("Invalid username or password"));
                }

                // Fallback: try DEFAULT institute login
                if (tenantCode == null || tenantCode.trim().isEmpty()) {
                    tenantCode = "DEFAULT";
                }
            }
            
            // Route to specific tenant if code provided (backward compat)
            if (tenantCode != null && !tenantCode.trim().isEmpty() && !"DEFAULT".equalsIgnoreCase(tenantCode)) {
                return loginWithTenantCode(username, password, tenantCode.trim().toUpperCase());
            }
        }

        // 2. Subdomain-resolved tenant login (primary path)
        log.info("Subdomain login for tenant: {}", tenantId);
        
        // Validate tenant exists
        try {
            TenantContext.setCurrentTenant("default");
            TenantContext.setDatabaseMode("shared");
            Tenant tenant = tenantService.validateTenantForLogin(tenantId);

            // Route to correct database
            TenantContext.setTenantId(tenantId);
            String dbName = tenant.getEffectiveDatabaseName();
            TenantContext.setCurrentTenant(dbName);
            TenantContext.setDatabaseMode(tenant.getDatabaseType());

            log.info("Routing login to database: {} mode: {}", dbName, tenant.getDatabaseType());

            Map<String, Object> user = authService.login(username, password);
            if (user != null) {
                user.put("tenant_code", tenantId);
                user.put("subdomain", tenant.getSubdomain());
                log.info("Institute login successful: {} for tenant: {}", username, tenantId);
                return ResponseEntity.ok(ApiResponse.builder()
                    .status("success")
                    .data(user)
                    .message("Login successful")
                    .build().withAdditional("user", user));
            }

            log.warn("Invalid credentials for user: {} in tenant: {}", username, tenantId);
            return ResponseEntity.status(401).body(ApiResponse.error("Invalid username or password"));
        } catch (RuntimeException e) {
            log.warn("Tenant validation failed for {}: {}", tenantId, e.getMessage());
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        }
    }

    /**
     * Backward-compatible login with explicit tenant code.
     */
    private ResponseEntity<ApiResponse> loginWithTenantCode(String username, String password, String tenantCode) {
        log.info("Legacy login with tenant_code: {}", tenantCode);
        
        TenantContext.setCurrentTenant("default");
        TenantContext.setDatabaseMode("shared");
        TenantContext.setTenantId("default");

        Tenant tenant;
        try {
            tenant = tenantService.validateTenantForLogin(tenantCode);
        } catch (RuntimeException e) {
            return ResponseEntity.status(403).body(ApiResponse.error(e.getMessage()));
        }

        try {
            TenantContext.setTenantId(tenantCode);
            String dbName = tenant.getEffectiveDatabaseName();
            TenantContext.setCurrentTenant(dbName);
            TenantContext.setDatabaseMode(tenant.getDatabaseType());

            Map<String, Object> user = authService.login(username, password);
            if (user != null) {
                user.put("tenant_code", tenantCode);
                user.put("subdomain", tenant.getSubdomain());
                return ResponseEntity.ok(ApiResponse.builder()
                    .status("success")
                    .data(user)
                    .message("Login successful")
                    .build().withAdditional("user", user));
            }

            return ResponseEntity.status(401).body(ApiResponse.error("Invalid username or password"));
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * POST /api/auth/superadmin/login
     * Super Admin login using shared/master database.
     */
    @PostMapping("/superadmin/login")
    public ResponseEntity<ApiResponse> superAdminLogin(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Username and password required"));
        }

        try {
            TenantContext.setCurrentTenant("default");
            TenantContext.setDatabaseMode("shared");
            TenantContext.setTenantId("SYSTEM");
            Map<String, Object> user = authService.loginSuperAdmin(username, password);
            if (user != null) {
                user.put("tenant_code", "SYSTEM");
                return ResponseEntity.ok(ApiResponse.builder()
                    .status("success")
                    .data(user)
                    .message("Login successful")
                    .build().withAdditional("user", user));
            }
            return ResponseEntity.status(401).body(ApiResponse.error("Invalid credentials"));
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * GET /api/auth/tenant-info
     * Returns tenant branding/info based on the subdomain in the request.
     * Used by the frontend to display institute name, logo, etc. on the login page.
     */
    @GetMapping("/tenant-info")
    public ResponseEntity<ApiResponse> getTenantInfo() {
        String tenantId = TenantContext.getTenantId();
        if ("DEFAULT".equalsIgnoreCase(tenantId) || tenantId == null) {
            // Main domain — no specific tenant
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("is_main_domain", true);
            info.put("message", "Welcome to Classivo. Please use your institute URL to login.");
            return ResponseEntity.ok(ApiResponse.success(info, "Main domain"));
        }

        try {
            TenantContext.setCurrentTenant("default");
            TenantContext.setDatabaseMode("shared");
            Optional<Tenant> tenantOpt = tenantService.getTenantByCode(tenantId);
            if (tenantOpt.isEmpty()) {
                return ResponseEntity.status(404).body(ApiResponse.error("Institute not found"));
            }

            Tenant tenant = tenantOpt.get();
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("is_main_domain", false);
            info.put("tenant_name", tenant.getTenantName());
            info.put("subdomain", tenant.getSubdomain());
            info.put("status", tenant.getStatus());
            info.put("is_trial_active", tenant.getIsTrialActive());
            info.put("trial_end_date", tenant.getTrialEndDate() != null ? tenant.getTrialEndDate().toString() : null);

            return ResponseEntity.ok(ApiResponse.success(info, "Tenant info loaded"));
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * POST /api/auth/find-institute
     * Allows users on the main domain to search for their institute.
     * Returns matching institutes with their subdomain URLs.
     */
    @PostMapping("/find-institute")
    public ResponseEntity<ApiResponse> findInstitute(@RequestBody Map<String, String> body) {
        String query = body.get("query");
        if (query == null || query.trim().length() < 2) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Please enter at least 2 characters to search."));
        }

        try {
            TenantContext.setCurrentTenant("default");
            TenantContext.setDatabaseMode("shared");
            TenantContext.setTenantId("default");

            List<Map<String, Object>> results = tenantService.searchInstitutes(query.trim());
            return ResponseEntity.ok(ApiResponse.success(results, results.size() + " institute(s) found"));
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * POST /api/auth/validate-tenant — Public endpoint to check tenant validity
     * Kept for backward compatibility.
     */
    @PostMapping("/validate-tenant")
    public ResponseEntity<ApiResponse> validateTenant(@RequestBody Map<String, String> body) {
        String tenantCode = body.get("tenant_code");
        String subdomain = body.get("subdomain");
        
        // Support both tenant_code and subdomain lookup
        String lookup = subdomain != null ? subdomain : tenantCode;
        if (lookup == null || lookup.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("tenant_code or subdomain is required"));
        }
        
        try {
            TenantContext.setCurrentTenant("default");
            TenantContext.setDatabaseMode("shared");
            TenantContext.setTenantId("default");
            
            Tenant tenant;
            if (subdomain != null) {
                tenant = tenantService.validateTenantBySubdomain(subdomain);
            } else {
                tenant = tenantService.validateTenantForLogin(tenantCode);
            }
            
            Map<String, Object> info = new LinkedHashMap<>();
            info.put("tenant_name", tenant.getTenantName());
            info.put("tenant_code", tenant.getTenantCode());
            info.put("subdomain", tenant.getSubdomain());
            info.put("status", tenant.getStatus());
            info.put("trial_end_date", tenant.getTrialEndDate() != null ? tenant.getTrialEndDate().toString() : null);
            info.put("is_trial_active", tenant.getIsTrialActive());
            return ResponseEntity.ok(ApiResponse.success(info, "Tenant is valid."));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * POST /api/auth/logout
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
            Long userId = Long.valueOf(details.get("id").toString());
            String userType = details.get("type").toString();
            authService.logout(userId, userType);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out"));
    }

    /**
     * GET /api/auth/me
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse> me(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Map) {
            return ResponseEntity.ok(ApiResponse.success(auth.getPrincipal()));
        }
        return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
    }

    /**
     * POST /api/auth/change_password
     */
    @PostMapping("/change_password")
    public ResponseEntity<ApiResponse> changePassword(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        String userType = details.get("type").toString();
        String newPassword = body.get("new_password");

        boolean success = authService.changePassword(userId, userType, newPassword);
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(null, "Password changed"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Failed to change password"));
    }

    /**
     * POST /api/auth/update_profile
     */
    @PostMapping("/update_profile")
    public ResponseEntity<ApiResponse> updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        String userType = details.get("type").toString();

        boolean success = authService.updateProfile(userId, userType, body.get("name"), body.get("email"));
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(null, "Profile updated"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update profile"));
    }
}
