package com.institute.security;

import com.institute.context.BranchContext;
import com.institute.tenant.TenantContext;
import jakarta.persistence.EntityManager;
import org.aspectj.lang.annotation.Aspect;
import org.aspectj.lang.annotation.Before;
import org.hibernate.Session;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

/**
 * Hibernate Filter Aspect — enables data isolation filters before every service call.
 * 
 * Two filter dimensions:
 * 1. branchFilter → scopes data to the selected branch (multi-branch support)
 * 2. tenantFilter → scopes data to the current tenant (multi-tenant SaaS isolation)
 * 
 * For dedicated-database tenants, tenantFilter is NOT needed because the entire
 * database belongs to that one tenant. For shared-database tenants, tenantFilter
 * ensures no cross-tenant data leakage.
 */
@Aspect
@Component
public class HibernateFilterAspect {

    @Autowired
    private EntityManager entityManager;

    @Before("execution(* com.institute.service.*.*(..)) " +
            "&& !execution(* com.institute.service.TenantService.*(..)) " +
            "&& !execution(* com.institute.service.AuthService.*(..))")
    public void enableFilters() {
        Session session = entityManager.unwrap(Session.class);

        // 1. Enable branch filter
        String branchId = BranchContext.getCurrentBranchId();
        if (branchId != null && !branchId.equals("all")) {
            try {
                Long bId = Long.parseLong(branchId);
                session.enableFilter("branchFilter").setParameter("branchId", bId);
            } catch (NumberFormatException e) {
                // Ignore if branchId is not a number and not "all"
            }
        }

        // 2. Enable tenant filter (for shared-database tenants)
        String tenantId = TenantContext.getTenantId();
        if (tenantId != null && !"default".equals(tenantId)) {
            // For shared mode, filter by tenant_id
            // For dedicated mode, the tenant has its own DB so no filter needed
            String dbMode = TenantContext.getDatabaseMode();
            if (dbMode == null || "shared".equalsIgnoreCase(dbMode)) {
                session.enableFilter("tenantFilter").setParameter("tenantId", tenantId);
            }
        }
    }
}
