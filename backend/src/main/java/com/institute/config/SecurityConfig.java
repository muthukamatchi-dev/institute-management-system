package com.institute.config;

import com.institute.security.TokenAuthFilter;
import com.institute.security.RateLimitingFilter;
import com.institute.tenant.TenantInterceptor;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfigurationSource;

/**
 * Security Configuration
 * Migrated from: Api_Controller.php -> validate_auth() token-based auth
 * Original: Token validated from Authorization header for every non-login
 * request
 */
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final TokenAuthFilter tokenAuthFilter;
    private final TenantInterceptor tenantInterceptor;
    private final RateLimitingFilter rateLimitingFilter;
    private final CorsConfigurationSource corsConfigurationSource;

    public SecurityConfig(TokenAuthFilter tokenAuthFilter,
                          TenantInterceptor tenantInterceptor,
                          RateLimitingFilter rateLimitingFilter,
                          @Qualifier("corsConfigurationSource") CorsConfigurationSource corsConfigurationSource) {
        this.tokenAuthFilter = tokenAuthFilter;
        this.tenantInterceptor = tenantInterceptor;
        this.rateLimitingFilter = rateLimitingFilter;
        this.corsConfigurationSource = corsConfigurationSource;
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
                .cors(cors -> cors.configurationSource(corsConfigurationSource))
                .csrf(csrf -> csrf.disable())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Public endpoints (no auth required)
                        .requestMatchers("/api/auth/login").permitAll()
                        .requestMatchers("/api/auth/superadmin/login").permitAll()
                        .requestMatchers("/api/auth/validate-tenant").permitAll()
                        .requestMatchers("/api/auth/tenant-info").permitAll()
                        .requestMatchers("/api/auth/find-institute").permitAll()
                        .requestMatchers("/api/exams/fix-exams").permitAll()
                        .requestMatchers("/api/exams/external_login").permitAll()
                        .requestMatchers("/api/exams/submit_external").permitAll()
                        .requestMatchers("/api/exams/external_results/**").permitAll()
                        .requestMatchers("/api/exams/institute_name").permitAll()
                        .requestMatchers("/uploads/**").permitAll()
                        .requestMatchers("/api/exams/external_exam_for_portal/**").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Super Admin endpoints require ROLE_SUPER_ADMIN
                        .requestMatchers("/api/admin/**").hasRole("SUPER_ADMIN")
                        // All other endpoints require authentication
                        .anyRequest().authenticated())
                .addFilterBefore(rateLimitingFilter, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(tenantInterceptor, UsernamePasswordAuthenticationFilter.class)
                .addFilterBefore(tokenAuthFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
