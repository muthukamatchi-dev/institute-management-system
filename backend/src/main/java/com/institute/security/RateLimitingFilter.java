package com.institute.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Simple IP-based rate limiting filter without external dependencies.
 * Limits requests per IP per rolling time window.
 */
@Component
public class RateLimitingFilter extends OncePerRequestFilter {

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    @Value("${app.ratelimit.enabled:true}")
    private boolean enabled;

    @Value("${app.ratelimit.capacity:120}")
    private long capacity;

    @Value("${app.ratelimit.refill-seconds:60}")
    private long refillSeconds;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {
        if (!enabled) {
            filterChain.doFilter(request, response);
            return;
        }

        String key = resolveKey(request);
        Counter counter = counters.computeIfAbsent(key, k -> new Counter());

        if (counter.allow(capacity, refillSeconds)) {
            filterChain.doFilter(request, response);
        } else {
            response.setStatus(429);
            response.setContentType("application/json");
            response.getWriter().write("{\"status\":\"error\",\"message\":\"Too many requests. Please try again later.\"}");
        }
    }

    private String resolveKey(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            return forwarded.split(",")[0].trim();
        }
        return request.getRemoteAddr() != null ? request.getRemoteAddr() : "unknown";
    }

    private static class Counter {
        private long windowStartEpoch;
        private long count;

        synchronized boolean allow(long capacity, long windowSeconds) {
            long now = Instant.now().getEpochSecond();
            if (now - windowStartEpoch >= windowSeconds) {
                windowStartEpoch = now;
                count = 0;
            }
            if (count < capacity) {
                count++;
                return true;
            }
            return false;
        }
    }
}
