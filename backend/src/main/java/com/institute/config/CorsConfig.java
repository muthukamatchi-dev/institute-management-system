package com.institute.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.List;

/**
 * CORS Configuration — Subdomain-Aware
 * Supports wildcard subdomain origins for multi-tenant SaaS.
 */
@Configuration
public class CorsConfig {

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Value("${app.domain:localhost}")
    private String appDomain;

    @Bean
    @Primary
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        
        // Parse configured origins
        List<String> origins = new java.util.ArrayList<>(Arrays.asList(allowedOrigins.split(",")));
        
        // Add wildcard subdomain patterns for the app domain
        // Spring CORS supports *.domain.com patterns
        if (!"localhost".equals(appDomain)) {
            origins.add("https://*." + appDomain);
            origins.add("http://*." + appDomain);
        }
        
        // For local development — support *.localhost
        origins.add("http://*.localhost:4200");
        origins.add("http://*.localhost:4300");
        origins.add("http://*.localhost");
        
        config.setAllowedOriginPatterns(origins);
        config.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setAllowCredentials(true);
        config.setExposedHeaders(Arrays.asList("Authorization", "Content-Disposition"));
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }
}
