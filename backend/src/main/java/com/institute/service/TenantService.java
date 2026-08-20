package com.institute.service;

import com.institute.model.*;
import com.institute.repository.*;
import com.institute.tenant.TenantContext;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.jdbc.core.JdbcTemplate;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Tenant Service — handles all tenant lifecycle operations.
 * This service operates on the MASTER database (default datasource).
 */
@Service
@Slf4j
public class TenantService {

    private final TenantRepository tenantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final InstituteSettingRepository instituteSettingRepository;
    private final BranchRepository branchRepository;
    private final PasswordEncoder passwordEncoder;
    private final DatabaseProvisioningService databaseProvisioningService;
    private final JdbcTemplate jdbcTemplate;

    public TenantService(TenantRepository tenantRepository,
                         UserRepository userRepository,
                         RoleRepository roleRepository,
                         InstituteSettingRepository instituteSettingRepository,
                         BranchRepository branchRepository,
                         PasswordEncoder passwordEncoder,
                         DatabaseProvisioningService databaseProvisioningService,
                         JdbcTemplate jdbcTemplate) {
        this.tenantRepository = tenantRepository;
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.instituteSettingRepository = instituteSettingRepository;
        this.branchRepository = branchRepository;
        this.passwordEncoder = passwordEncoder;
        this.databaseProvisioningService = databaseProvisioningService;
        this.jdbcTemplate = jdbcTemplate;
    }

    // =============================================
    // TENANT CRUD
    // =============================================

    public List<Tenant> getAllTenants() {
        return tenantRepository.findAllOrderByCreatedAtDesc();
    }

    public Optional<Tenant> getTenantById(Long id) {
        return tenantRepository.findById(id);
    }

    public Optional<Tenant> getTenantByCode(String tenantCode) {
        return tenantRepository.findByTenantCodeIgnoreCase(tenantCode);
    }

    /**
     * Validates a tenant for login:
     * 1. Tenant exists
     * 2. Tenant is active
     * 3. Trial not expired
     */
    public Tenant validateTenantForLogin(String tenantCode) {
        if (tenantCode != null) tenantCode = tenantCode.trim().toUpperCase();
        
        Optional<Tenant> tenantOpt = tenantRepository.findByTenantCodeIgnoreCase(tenantCode);
        if (tenantOpt.isEmpty() && "DEFAULT".equalsIgnoreCase(tenantCode)) {
            // Backward compatibility: allow default tenant even if tenants table is empty
            return Tenant.builder()
                    .tenantName("Default Institute")
                    .tenantCode("default")
                    .subdomain("default")
                    .databaseType("shared")
                    .status("active")
                    .isTrialActive(false)
                    .build();
        }
        Tenant tenant = tenantOpt
                .orElseThrow(() -> new RuntimeException("Invalid institute code. Please check and try again."));

        if (!"active".equalsIgnoreCase(tenant.getStatus())) {
            throw new RuntimeException("This institute account has been deactivated. Please contact support.");
        }

        // We now allow login even if trial is expired (read-only mode)
        // Validation logic will be handled by interceptors/filters based on tenant state
        
        return tenant;
    }

    /**
     * Validates a tenant by subdomain for login.
     */
    public Tenant validateTenantBySubdomain(String subdomain) {
        final String searchSubdomain = subdomain != null ? subdomain.trim().toLowerCase() : null;
        
        Optional<Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase(searchSubdomain);
        Tenant tenant = tenantOpt
                .orElseThrow(() -> new RuntimeException("Institute not found for subdomain: " + searchSubdomain));

        if (!"active".equalsIgnoreCase(tenant.getStatus())) {
            throw new RuntimeException("This institute account has been deactivated. Please contact support.");
        }
        
        return tenant;
    }

    /**
     * Search institutes by name or subdomain for the "Find Your Institute" feature.
     * Returns sanitized results (no internal details exposed).
     */
    public List<Map<String, Object>> searchInstitutes(String query) {
        List<Tenant> tenants = tenantRepository.searchByNameOrSubdomain(query);
        return tenants.stream()
                .filter(t -> !"DEFAULT".equalsIgnoreCase(t.getTenantCode()))
                .limit(10)
                .map(t -> {
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("name", t.getTenantName());
                    result.put("subdomain", t.getSubdomain());
                    return result;
                })
                .collect(Collectors.toList());
    }

    // =============================================
    // CLIENT ONBOARDING (Step 7)
    // =============================================

    /**
     * Full onboarding: creates tenant record, admin user, default settings, default branch.
     */
    @Transactional
    public Map<String, Object> createTenant(Map<String, Object> request) {
        String tenantName = (String) request.get("tenant_name");
        String tenantCode = ((String) request.getOrDefault("tenant_code", "")).trim().toUpperCase();
        String adminEmail = (String) request.get("admin_email");
        String adminPhone = (String) request.getOrDefault("admin_phone", "");
        String databaseType = (String) request.getOrDefault("database_type", "shared");
        String adminPassword = (String) request.getOrDefault("admin_password", "admin123");
        String adminUsernameInput = (String) request.getOrDefault("admin_username", "");
        String adminUsername = (adminUsernameInput != null && !adminUsernameInput.trim().isEmpty())
            ? adminUsernameInput.trim().toLowerCase()
            : tenantCode.toLowerCase() + "_admin";
        String adminNameInput = (String) request.getOrDefault("admin_name", "");
        String adminName = (adminNameInput != null && !adminNameInput.trim().isEmpty())
            ? adminNameInput.trim()
            : tenantName + " Admin";
        int trialDays = Integer.parseInt(request.getOrDefault("trial_days", "7").toString());
        
        // Auto-generate subdomain from tenant_name if not provided
        String subdomain = request.containsKey("subdomain") 
            ? ((String) request.get("subdomain")).trim().toLowerCase()
            : generateSubdomain(tenantName);

        // Validate format
        if (!tenantCode.matches("^[A-Z0-9_\\-]{2,50}$")) {
            throw new RuntimeException("Invalid institute code format.");
        }
        if (!subdomain.matches("^[a-z0-9][a-z0-9\\-]{1,61}[a-z0-9]$")) {
            throw new RuntimeException("Invalid subdomain format. Use only lowercase letters, numbers, and hyphens.");
        }

        // Validate uniqueness
        if (tenantRepository.existsByTenantCode(tenantCode)) {
            throw new RuntimeException("Institute code '" + tenantCode + "' is already taken.");
        }
        if (tenantRepository.existsBySubdomain(subdomain)) {
            throw new RuntimeException("Subdomain '" + subdomain + "' is already taken.");
        }
        if (tenantRepository.existsByAdminEmail(adminEmail)) {
            throw new RuntimeException("Email '" + adminEmail + "' is already registered.");
        }

        // 1. Create tenant record
        Tenant tenant = Tenant.builder()
                .tenantName(tenantName)
                .tenantCode(tenantCode)
                .subdomain(subdomain)
                .adminEmail(adminEmail)
                .adminPhone(adminPhone)
                .databaseType(databaseType)
                .status("active")
                .isTrialActive(true)
                .trialStartDate(LocalDate.now())
                .trialEndDate(LocalDate.now().plusDays(trialDays))
                .maxStudents(500)
                .maxStaff(50)
                .build();

        // For dedicated mode, set database name
        if ("dedicated".equalsIgnoreCase(databaseType)) {
            String dbName = "ims_" + tenantCode.toLowerCase() + "_db";
            tenant.setDatabaseName(dbName);
            // Create the database for dedicated tenants
            databaseProvisioningService.createDatabaseIfMissing(dbName);
        }

        tenantRepository.save(tenant);

        // 2. Set tenant context for creating tenant-specific data
        String previousTenant = TenantContext.getCurrentTenant();
        String previousMode = TenantContext.getDatabaseMode();
        String previousTenantId = TenantContext.getTenantId();
        try {
            if ("dedicated".equalsIgnoreCase(databaseType) && tenant.getDatabaseName() != null) {
                TenantContext.setCurrentTenant(tenant.getDatabaseName());
                TenantContext.setDatabaseMode("dedicated");
                TenantContext.setTenantId(tenantCode);
            } else {
                TenantContext.setCurrentTenant("default"); // shared DB
                TenantContext.setDatabaseMode("shared");
                TenantContext.setTenantId(tenantCode);
            }

            // 3. Create admin role for this tenant (if not exists)
            Role adminRole = roleRepository.findByRoleNameAndTenantId("Admin", tenantCode)
                    .orElseGet(() -> {
                        Role r = Role.builder().roleName("Admin").tenantId(tenantCode).build();
                        return roleRepository.save(r);
                    });

            // 4. Create admin user for this tenant
            User adminUser = User.builder()
                    .username(adminUsername)
                    .password(passwordEncoder.encode(adminPassword))
                    .email(adminEmail)
                    .fullName(adminName)
                    .roleId(adminRole.getId())
                    .status("active")
                    .createdAt(LocalDateTime.now())
                    .tenantId(tenantCode)
                    .build();
            userRepository.save(adminUser);

            // 5. Create default institute settings for this tenant
            InstituteSetting settings = InstituteSetting.builder()
                    .id(null) // auto-generate
                    .name(tenantName)
                    .instituteName(tenantName)
                    .email(adminEmail)
                    .phone(adminPhone)
                    .regPrefix("STU")
                    .regStartFrom("1")
                    .regLastNumber("0")
                    .regMode("auto")
                    .staffIdPrefix("STF")
                    .staffIdStartFrom("1")
                    .staffIdLastNumber("0")
                    .staffIdMode("auto")
                    .courseIdPrefix("CRS")
                    .courseIdStartFrom("1")
                    .courseIdLastNumber("0")
                    .courseIdMode("auto")
                    .tenantId(tenantCode)
                    .build();
            instituteSettingRepository.save(settings);

            // 6. Create default branch for this tenant
            Branch branch = Branch.builder()
                    .name("Main Branch")
                    .code("MAIN")
                    .isMain(true)
                    .status("Active")
                    .tenantId(tenantCode)
                    .build();
            branchRepository.save(branch);

        } finally {
            TenantContext.setCurrentTenant(previousTenant);
            TenantContext.setDatabaseMode(previousMode);
            TenantContext.setTenantId(previousTenantId);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("tenant_id", tenant.getId());
        result.put("tenant_code", tenant.getTenantCode());
        result.put("subdomain", tenant.getSubdomain());
        result.put("admin_username", adminUsername);
        result.put("admin_password", adminPassword);
        result.put("trial_end_date", tenant.getTrialEndDate().toString());
        result.put("database_type", tenant.getDatabaseType());

        return result;
    }

    // =============================================
    // TENANT MANAGEMENT (Super Admin operations)
    // =============================================

    @Transactional
    public Tenant updateTenant(Long id, Map<String, Object> request) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        if (request.containsKey("tenant_name")) tenant.setTenantName((String) request.get("tenant_name"));
        if (request.containsKey("admin_email")) tenant.setAdminEmail((String) request.get("admin_email"));
        if (request.containsKey("admin_phone")) tenant.setAdminPhone((String) request.get("admin_phone"));
        if (request.containsKey("domain")) tenant.setDomain((String) request.get("domain"));
        if (request.containsKey("max_students")) tenant.setMaxStudents(Integer.parseInt(request.get("max_students").toString()));
        if (request.containsKey("max_staff")) tenant.setMaxStaff(Integer.parseInt(request.get("max_staff").toString()));
        if (request.containsKey("status")) tenant.setStatus((String) request.get("status"));

        // Extend trial
        if (request.containsKey("trial_days")) {
            int days = Integer.parseInt(request.get("trial_days").toString());
            tenant.setTrialEndDate(LocalDate.now().plusDays(days));
            tenant.setIsTrialActive(true);
        }

        // Disable trial (make permanent)
        if (request.containsKey("disable_trial") && Boolean.parseBoolean(request.get("disable_trial").toString())) {
            tenant.setIsTrialActive(false);
        }

        return tenantRepository.save(tenant);
    }

    @Transactional
    public Tenant disableTenant(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        tenant.setStatus("inactive");
        return tenantRepository.save(tenant);
    }

    @Transactional
    public Tenant enableTenant(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));
        tenant.setStatus("active");
        return tenantRepository.save(tenant);
    }

    /**
     * Switch tenant between shared and dedicated database mode.
     */
    @Transactional
    public Tenant switchDatabaseMode(Long id, String newMode) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        if ("dedicated".equalsIgnoreCase(newMode)) {
            String dbName = "ims_" + tenant.getTenantCode().toLowerCase() + "_db";
            tenant.setDatabaseType("dedicated");
            tenant.setDatabaseName(dbName);
            databaseProvisioningService.createDatabaseIfMissing(dbName);
        } else {
            tenant.setDatabaseType("shared");
            tenant.setDatabaseName(null);
        }

        return tenantRepository.save(tenant);
    }

    /**
     * Reset tenant admin password.
     */
    @Transactional
    public boolean resetAdminPassword(Long tenantId, String newPassword) {
        Tenant tenant = tenantRepository.findById(tenantId)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        String adminUsername = tenant.getTenantCode().toLowerCase() + "_admin";

        String previousTenant = TenantContext.getCurrentTenant();
        String previousMode = TenantContext.getDatabaseMode();
        String previousTenantId = TenantContext.getTenantId();
        try {
            if ("dedicated".equalsIgnoreCase(tenant.getDatabaseType()) && tenant.getDatabaseName() != null) {
                TenantContext.setCurrentTenant(tenant.getDatabaseName());
                TenantContext.setDatabaseMode("dedicated");
            } else {
                TenantContext.setCurrentTenant("default");
                TenantContext.setDatabaseMode("shared");
            }
            TenantContext.setTenantId(tenant.getTenantCode());
            Optional<User> userOpt = userRepository.findByUsername(adminUsername);
            if (userOpt.isPresent()) {
                User user = userOpt.get();
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return true;
            }
        } finally {
            TenantContext.setCurrentTenant(previousTenant);
            TenantContext.setDatabaseMode(previousMode);
            TenantContext.setTenantId(previousTenantId);
        }
        return false;
    }

    /**
     * Get dashboard stats for super admin.
     */
    public Map<String, Object> getSuperAdminStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        List<Tenant> all = tenantRepository.findAll();

        stats.put("total_tenants", all.size());
        stats.put("active_tenants", all.stream().filter(t -> "active".equalsIgnoreCase(t.getStatus())).count());
        stats.put("inactive_tenants", all.stream().filter(t -> "inactive".equalsIgnoreCase(t.getStatus())).count());
        stats.put("trial_active", all.stream().filter(t -> Boolean.TRUE.equals(t.getIsTrialActive()) && !t.isTrialExpired()).count());
        stats.put("trial_expired", all.stream().filter(Tenant::isTrialExpired).count());
        stats.put("shared_tenants", all.stream().filter(t -> "shared".equalsIgnoreCase(t.getDatabaseType())).count());
        stats.put("dedicated_tenants", all.stream().filter(t -> "dedicated".equalsIgnoreCase(t.getDatabaseType())).count());

        return stats;
    }

    /**
     * Generate a URL-safe subdomain from tenant name.
     * E.g., "ABC School of Technology" → "abc-school-of-technology"
     */
    private String generateSubdomain(String tenantName) {
        if (tenantName == null) return "institute";
        String subdomain = tenantName.trim().toLowerCase()
                .replaceAll("[^a-z0-9\\s-]", "")  // remove special chars
                .replaceAll("\\s+", "-")           // spaces to hyphens
                .replaceAll("-+", "-")              // collapse multiple hyphens
                .replaceAll("^-|-$", "");            // trim leading/trailing hyphens
        
        // Ensure minimum length
        if (subdomain.length() < 3) {
            subdomain = subdomain + "-institute";
        }
        // Ensure uniqueness by appending number if needed
        String base = subdomain;
        int counter = 1;
        while (tenantRepository.existsBySubdomain(subdomain)) {
            subdomain = base + "-" + counter++;
        }
        return subdomain;
    }

    @Transactional
    public void deleteTenant(Long id) {
        Tenant tenant = tenantRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Tenant not found"));

        String tenantCode = tenant.getTenantCode();

        // Switch context to clean up tenant-specific data
        String previousTenant = TenantContext.getCurrentTenant();
        String previousMode = TenantContext.getDatabaseMode();
        String previousTenantId = TenantContext.getTenantId();
        try {
            if ("dedicated".equalsIgnoreCase(tenant.getDatabaseType()) && tenant.getDatabaseName() != null) {
                // If it is dedicated, drop the dedicated database
                TenantContext.setCurrentTenant("default");
                TenantContext.setDatabaseMode("shared");
                TenantContext.setTenantId("default");
                try {
                    jdbcTemplate.execute("DROP DATABASE IF EXISTS `" + tenant.getDatabaseName() + "`");
                } catch (Exception e) {
                    log.error("Failed to drop dedicated database: " + tenant.getDatabaseName(), e);
                }
            } else {
                // In shared database mode, clean up tenant-specific tables in the default DB
                TenantContext.setCurrentTenant("default");
                TenantContext.setDatabaseMode("shared");
                TenantContext.setTenantId("default");

                jdbcTemplate.update("DELETE FROM users WHERE tenant_id = ?", tenantCode);
                jdbcTemplate.update("DELETE FROM institute_settings WHERE tenant_id = ?", tenantCode);
                jdbcTemplate.update("DELETE FROM branches WHERE tenant_id = ?", tenantCode);
                jdbcTemplate.update("DELETE FROM roles WHERE tenant_id = ?", tenantCode);
            }
        } finally {
            TenantContext.setCurrentTenant(previousTenant);
            TenantContext.setDatabaseMode(previousMode);
            TenantContext.setTenantId(previousTenantId);
        }

        // Finally delete the tenant master record
        tenantRepository.delete(tenant);
    }
}
