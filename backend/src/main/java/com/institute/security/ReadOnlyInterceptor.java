package com.institute.security;

import com.institute.tenant.TenantContext;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

/**
 * ReadOnly Interceptor
 * 
 * Blocks all state-changing requests (POST, PUT, DELETE, PATCH) 
 * if the tenant's subscription/trial has expired.
 * 
 * Super Admins are exempted to allow them to fix issues or renew subscriptions.
 */
@Component
public class ReadOnlyInterceptor implements HandlerInterceptor {

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String method = request.getMethod();
        
        // Allow all GET/READ operations
        if ("GET".equalsIgnoreCase(method) || "OPTIONS".equalsIgnoreCase(method) || "HEAD".equalsIgnoreCase(method)) {
            return true;
        }

        // If not in read-only mode, proceed normally
        if (!TenantContext.isReadOnly()) {
            return true;
        }

        // Check if user is Super Admin (exempted)
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_SUPER_ADMIN"))) {
            return true;
        }

        // Block state-changing requests for expired tenants
        response.setStatus(403);
        response.setContentType("application/json");
        response.getWriter().write("{\"status\":\"error\",\"message\":\"Subscription expired. Please renew to perform this action.\"}");
        return false;
    }
}
