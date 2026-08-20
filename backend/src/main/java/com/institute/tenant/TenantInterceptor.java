package com.institute.tenant;

import com.institute.model.Tenant;
import com.institute.repository.TenantRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.util.Optional;

/**
 * Tenant Interceptor (Filter) — Subdomain-Based Resolution
 * 
 * Resolution priority:
 * 1. Subdomain from Host header (e.g., abcschool.classivo.app → "abcschool")
 * 2. X-Tenant-Subdomain header (for local dev / API clients)
 * 3. X-Tenant-ID header (backward compatibility)
 * 4. Falls back to "DEFAULT" tenant
 */
@Component
@Slf4j
public class TenantInterceptor extends OncePerRequestFilter {

    private final TenantRepository tenantRepository;

    @Value("${app.domain:localhost}")
    private String appDomain;

    @Value("${app.tenant.header:X-Tenant-ID}")
    private String tenantHeader;

    public TenantInterceptor(TenantRepository tenantRepository) {
        this.tenantRepository = tenantRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        try {
            String path = request.getRequestURI();
            boolean isSuperAdminLogin = path.contains("/api/auth/superadmin/login");

            // 1. Try to resolve subdomain from Host header
            String subdomain = extractSubdomainFromHost(request);

            // 2. Fallback: X-Tenant-Subdomain header (local dev / API clients)
            if (subdomain == null) {
                subdomain = request.getHeader("X-Tenant-Subdomain");
                if (subdomain != null) {
                    subdomain = subdomain.trim().toLowerCase();
                }
            }

            // 3. Fallback: X-Tenant-ID header (backward compatibility)
            String tenantCode = request.getHeader(tenantHeader);
            if (tenantCode != null) {
                tenantCode = tenantCode.trim().toUpperCase();
            }

            // Super Admin path
            if (isSuperAdminLogin || "SYSTEM".equalsIgnoreCase(tenantCode)) {
                TenantContext.setTenantId("SYSTEM");
                TenantContext.setCurrentTenant("default");
                TenantContext.setDatabaseMode("shared");
                filterChain.doFilter(request, response);
                return;
            }

            // --- Subdomain-based resolution (primary) ---
            if (subdomain != null && !subdomain.isEmpty() && !"www".equals(subdomain)) {
                log.debug("Resolving tenant from subdomain: {}", subdomain);
                Optional<Tenant> tenantOpt = tenantRepository.findBySubdomainIgnoreCase(subdomain);

                if (tenantOpt.isEmpty()) {
                    // Try matching by tenant_code as fallback
                    tenantOpt = tenantRepository.findByTenantCodeIgnoreCase(subdomain.toUpperCase());
                }

                if (tenantOpt.isEmpty()) {
                    log.warn("Invalid subdomain: {}", subdomain);
                    response.setStatus(404);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":\"error\",\"message\":\"Institute not found. Please check your URL.\",\"code\":\"INVALID_SUBDOMAIN\"}");
                    return;
                }

                Tenant tenant = tenantOpt.get();
                configureTenantContext(tenant, request, response, filterChain, path);
                return;
            }

            // --- Legacy X-Tenant-ID header resolution ---
            if (tenantCode != null && !tenantCode.isEmpty() && !"DEFAULT".equalsIgnoreCase(tenantCode)) {
                if (!tenantCode.matches("^[A-Za-z0-9_\\-]{2,50}$")) {
                    response.setStatus(400);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid tenant code format.\"}");
                    return;
                }

                Optional<Tenant> tenantOpt = tenantRepository.findByTenantCodeIgnoreCase(tenantCode);
                if (tenantOpt.isEmpty()) {
                    boolean isLoginReq = path.contains("/api/auth/login") || path.contains("/api/auth/superadmin/login");
                    if (isLoginReq) {
                        TenantContext.setTenantId("DEFAULT");
                        TenantContext.setCurrentTenant("default");
                        TenantContext.setDatabaseMode("shared");
                        filterChain.doFilter(request, response);
                        return;
                    }
                    response.setStatus(400);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"status\":\"error\",\"message\":\"Invalid institute code.\"}");
                    return;
                }

                Tenant tenant = tenantOpt.get();
                configureTenantContext(tenant, request, response, filterChain, path);
                return;
            }

            // --- Default / main domain (no subdomain) ---
            TenantContext.setTenantId("DEFAULT");
            TenantContext.setCurrentTenant("default");
            TenantContext.setDatabaseMode("shared");

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    /**
     * Extract subdomain from the Host header.
     * Examples:
     *   abcschool.classivo.app    → "abcschool"
     *   abcschool.localhost       → "abcschool"
     *   abcschool.localhost:4200  → "abcschool"
     *   localhost                 → null
     *   classivo.app              → null
     */
    private String extractSubdomainFromHost(HttpServletRequest request) {
        String host = request.getHeader("Host");
        if (host == null || host.isEmpty()) {
            return null;
        }

        // Remove port number if present
        String hostname = host.contains(":") ? host.substring(0, host.indexOf(":")) : host;

        // Handle localhost-based dev environment (e.g., abcschool.localhost)
        if (hostname.endsWith(".localhost") || hostname.endsWith(".127.0.0.1")) {
            String sub = hostname.substring(0, hostname.lastIndexOf("."));
            return sub.isEmpty() ? null : sub.toLowerCase();
        }

        // Handle IP addresses — no subdomain
        if (hostname.matches("^\\d+\\.\\d+\\.\\d+\\.\\d+$")) {
            return null;
        }

        // Handle bare localhost or bare app domain
        if ("localhost".equals(hostname) || hostname.equals(appDomain)) {
            return null;
        }

        // Handle subdomain.appDomain (e.g., abcschool.classivo.app)
        if (hostname.endsWith("." + appDomain)) {
            String sub = hostname.substring(0, hostname.length() - appDomain.length() - 1);
            if (!sub.isEmpty() && !sub.contains(".")) {
                return sub.toLowerCase();
            }
            // Multi-level subdomain (e.g., www.abcschool.classivo.app) — take first part
            if (sub.contains(".")) {
                String[] parts = sub.split("\\.");
                // Skip "www" prefix
                String candidate = parts[0];
                if ("www".equals(candidate) && parts.length > 1) {
                    candidate = parts[1];
                }
                return candidate.toLowerCase();
            }
        }

        // Generic: extract first part of hostname if it has 3+ segments
        String[] parts = hostname.split("\\.");
        if (parts.length >= 3) {
            String candidate = parts[0];
            return "www".equals(candidate) ? null : candidate.toLowerCase();
        }

        return null;
    }

    /**
     * Configure TenantContext and proceed with filter chain.
     */
    private void configureTenantContext(Tenant tenant, HttpServletRequest request,
                                         HttpServletResponse response, FilterChain filterChain,
                                         String path) throws ServletException, IOException {
        String tenantCode = tenant.getTenantCode().toUpperCase();
        boolean isLoginRequest = path.contains("/api/auth/login") || path.contains("/api/auth/tenant-info");

        if (!isLoginRequest) {
            if (!"active".equalsIgnoreCase(tenant.getStatus())) {
                response.setStatus(403);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Institute account is deactivated.\"}");
                return;
            }
            if (tenant.isTrialExpired()) {
                response.setStatus(403);
                response.setContentType("application/json");
                response.getWriter().write("{\"status\":\"error\",\"message\":\"Subscription expired. Please renew.\"}");
                return;
            }
        }

        TenantContext.setTenantId(tenantCode);
        TenantContext.setDatabaseMode(tenant.getDatabaseType());
        if ("dedicated".equalsIgnoreCase(tenant.getDatabaseType()) && tenant.getDatabaseName() != null) {
            TenantContext.setCurrentTenant(tenant.getDatabaseName());
        } else {
            TenantContext.setCurrentTenant("default");
        }

        filterChain.doFilter(request, response);
    }
}
