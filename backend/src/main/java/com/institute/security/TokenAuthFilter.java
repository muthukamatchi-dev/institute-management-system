package com.institute.security;

import com.institute.model.Staff;
import com.institute.model.Student;
import com.institute.model.Tenant;
import com.institute.model.User;
import com.institute.repository.StaffRepository;
import com.institute.repository.StudentRepository;
import com.institute.repository.TenantRepository;
import com.institute.repository.UserRepository;
import com.institute.tenant.TenantContext;
import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.*;

/**
 * Token Authentication Filter — SaaS Multi-Tenant Version
 *
 * Request flow:
 * 1. Extract tenant_id from X-Tenant-ID header
 * 2. Validate tenant exists, is active, and trial not expired
 * 3. Route to correct database (shared vs dedicated)
 * 4. Authenticate user via token lookup
 * 5. Set security context with roles
 */
@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;
    private final TenantRepository tenantRepository;
    private final JwtService jwtService;

    public TokenAuthFilter(UserRepository userRepository, StaffRepository staffRepository,
                          StudentRepository studentRepository, TenantRepository tenantRepository,
                          JwtService jwtService) {
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
        this.studentRepository = studentRepository;
        this.tenantRepository = tenantRepository;
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        try {
            // Tenant is already resolved by TenantInterceptor from subdomain/headers.
            // We just read the current context.
            String tenantId = TenantContext.getTenantId();
            if (tenantId == null || tenantId.isEmpty()) {
                tenantId = "DEFAULT";
                TenantContext.setTenantId("DEFAULT");
                TenantContext.setCurrentTenant("default");
                TenantContext.setDatabaseMode("shared");
            }

            // 3. Authenticate via token
            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && !authHeader.isEmpty()) {
                String token = authHeader.replace("Bearer ", "").trim();

                if (isJwt(token) && jwtService.isTokenValid(token)) {
                    Claims claims = jwtService.parseClaims(token);
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", claims.get("id"));
                    details.put("name", claims.get("name"));
                    details.put("email", claims.get("email"));
                    details.put("role", claims.get("role"));
                    details.put("role_name", claims.get("role_name"));
                    details.put("token", token);
                    details.put("type", claims.get("type"));
                    details.put("tenant_id", claims.get("tenant_id"));
                    details.put("branch_id", claims.get("branch_id"));

                    List<SimpleGrantedAuthority> authorities = buildAuthorities(
                        claims.get("role_name") != null ? claims.get("role_name").toString() : null,
                        claims.get("type") != null ? claims.get("type").toString() : null
                    );

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(details, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    filterChain.doFilter(request, response);
                    return;
                }

                // Check users table first
                Optional<User> userOpt = userRepository.findByToken(token);
                if (userOpt.isPresent()) {
                    User user = userOpt.get();
                    Map<String, Object> details = new HashMap<>();
                    details.put("id", user.getId());
                    details.put("name", user.getFullName());
                    details.put("email", user.getEmail());
                    details.put("role", user.getRole() != null ? user.getRole().getRoleName() : "user");
                    details.put("role_name", user.getRole() != null ? user.getRole().getRoleName() : "user");
                    details.put("token", token);
                    details.put("type", "user");
                    details.put("tenant_id", tenantId);

                    List<SimpleGrantedAuthority> authorities = buildAuthorities(
                        user.getRole() != null ? user.getRole().getRoleName() : null, "user");

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(details, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    filterChain.doFilter(request, response);
                    return;
                }

                // 2. Check staff table
                Optional<Staff> staffOpt = staffRepository.findByToken(token);
                if (staffOpt.isPresent()) {
                    Staff staff = staffOpt.get();
                    Map<String, Object> details = new LinkedHashMap<>();
                    details.put("id", staff.getId());
                    details.put("name", staff.getName());
                    details.put("email", staff.getEmail());
                    details.put("staff_id", staff.getStaffId());
                    details.put("type", "staff");
                    details.put("role", "staff");
                    details.put("role_name", "Staff");
                    details.put("token", token);
                    details.put("tenant_id", tenantId);

                    List<SimpleGrantedAuthority> authorities = buildAuthorities(
                        details.get("role_name").toString(), "staff");

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(details, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    filterChain.doFilter(request, response);
                    return;
                }

                // 3. Check students table
                Optional<Student> studentOpt = studentRepository.findByToken(token);
                if (studentOpt.isPresent()) {
                    Student student = studentOpt.get();
                    Map<String, Object> details = new LinkedHashMap<>();
                    details.put("id", student.getId());
                    details.put("name", student.getName());
                    details.put("email", student.getEmail());
                    details.put("reg_number", student.getRegNumber());
                    details.put("type", "student");
                    details.put("role", "student");
                    details.put("role_name", "Student");
                    details.put("token", token);
                    details.put("tenant_id", tenantId);

                    List<SimpleGrantedAuthority> authorities = buildAuthorities("Student", "student");

                    UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(details, null, authorities);
                    SecurityContextHolder.getContext().setAuthentication(authToken);
                    filterChain.doFilter(request, response);
                    return;
                }
            }

            filterChain.doFilter(request, response);
        } finally {
            TenantContext.clear();
        }
    }

    private boolean isJwt(String token) {
        return token != null && token.split("\\.").length == 3;
    }

    private List<SimpleGrantedAuthority> buildAuthorities(String roleName, String userType) {
        List<SimpleGrantedAuthority> authorities = new ArrayList<>();
        if ("staff".equalsIgnoreCase(userType)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_STAFF"));
        }
        if ("student".equalsIgnoreCase(userType)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
        }
        if ("user".equalsIgnoreCase(userType) || "staff".equalsIgnoreCase(userType) || "student".equalsIgnoreCase(userType)) {
            authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
        }

        if (roleName != null) {
            String normalizedRole = roleName.trim().replace("_", "").replace(" ", "").toLowerCase();
            if ("admin".equals(normalizedRole) || "instituteadmin".equals(normalizedRole)) {
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }
            if ("superadmin".equals(normalizedRole) || "systemadmin".equals(normalizedRole)) {
                authorities.add(new SimpleGrantedAuthority("ROLE_SUPER_ADMIN"));
                authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
            }
        }
        return authorities;
    }
}
