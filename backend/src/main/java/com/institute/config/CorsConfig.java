package com.institute.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration — Subdomain-Aware
 * Supports wildcard subdomain origins for multi-tenant SaaS.
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins:}")
    private String allowedOrigins;

    @Value("${app.domain:localhost}")
    private String appDomain;

    @Value("${app.host.ip:172.25.112.26}")
    private String appHostIp;

    @Bean
    @Primary
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();

        List<String> origins = new ArrayList<>();

        // 1. Parse custom origins from application.properties / ENV
        if (allowedOrigins != null && !allowedOrigins.trim().isEmpty()) {
            origins.addAll(Arrays.asList(allowedOrigins.split(",")));
        }

        // 2. Always allow localhost & 127.0.0.1 subdomains (e.g.
        // http://learn-academy.localhost:4200)
        origins.add("http://*.localhost:4200");
        origins.add("http://*.localhost:4300");
        origins.add("http://*.localhost:8081");
        origins.add("http://*.localhost");
        origins.add("http://localhost:4200");
        origins.add("http://localhost:4300");
        origins.add("http://localhost:8081");
        origins.add("http://localhost");

        origins.add("http://*.127.0.0.1:4200");
        origins.add("http://*.127.0.0.1:4300");
        origins.add("http://*.127.0.0.1");
        origins.add("http://127.0.0.1:4200");
        origins.add("http://127.0.0.1:4300");

        // 3. Add custom domain wildcard subdomains if configured (e.g. *.classivo.app)
        if (appDomain != null && !appDomain.trim().isEmpty()
                && !"localhost".equalsIgnoreCase(appDomain)
                && !"127.0.0.1".equals(appDomain)) {
            origins.add("https://*." + appDomain);
            origins.add("http://*." + appDomain);
            origins.add("https://*." + appDomain + ":4200");
            origins.add("http://*." + appDomain + ":4200");
            origins.add("https://" + appDomain);
            origins.add("http://" + appDomain);
        }

        // 4. Add dynamic LAN IP wildcard subdomains (e.g. *.172.25.112.26)
        if (appHostIp != null && !appHostIp.trim().isEmpty()
                && !"localhost".equalsIgnoreCase(appHostIp)) {
            origins.add("http://*." + appHostIp + ":4200");
            origins.add("http://*." + appHostIp + ":4300");
            origins.add("http://*." + appHostIp);
            origins.add("http://" + appHostIp + ":4200");
            origins.add("http://" + appHostIp + ":4300");
            origins.add("http://" + appHostIp);
        }

        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(
                Arrays.asList("Authorization", "Content-Disposition", "X-Tenant-ID", "X-Tenant-Subdomain"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
