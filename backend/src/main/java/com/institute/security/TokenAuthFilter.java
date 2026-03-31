package com.institute.security;

import com.institute.model.Staff;
import com.institute.model.Student;
import com.institute.model.User;
import com.institute.repository.StaffRepository;
import com.institute.repository.StudentRepository;
import com.institute.repository.UserRepository;
import com.institute.tenant.TenantContext;
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
 * Token Authentication Filter
 * Migrated from: Api_Controller.php -> validate_auth()
 * Original logic: 
 *   1. Get token from Authorization header
 *   2. Check users table, then staff table, then students table
 *   3. Return user object with role info
 */
@Component
public class TokenAuthFilter extends OncePerRequestFilter {

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;

    public TokenAuthFilter(UserRepository userRepository, StaffRepository staffRepository,
                          StudentRepository studentRepository) {
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
        this.studentRepository = studentRepository;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response,
                                     FilterChain filterChain) throws ServletException, IOException {
        try {
            String tenantId = request.getHeader("X-Tenant-ID");
            if (tenantId != null && !tenantId.isEmpty()) {
                TenantContext.setCurrentTenant(tenantId);
            } else {
                TenantContext.setCurrentTenant("default");
            }

            String authHeader = request.getHeader("Authorization");
            if (authHeader != null && !authHeader.isEmpty()) {
                String token = authHeader.replace("Bearer ", "").trim();

                // Check users table first (same as Auth_model.php -> verify_token)
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

                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    if (user.getRole() != null) {
                        String roleName = user.getRole().getRoleName();
                        if ("Admin".equalsIgnoreCase(roleName) || "Super Admin".equalsIgnoreCase(roleName)) {
                            authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        }
                    }
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

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

                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_STAFF"));
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));
                    
                    // If staff designation is Admin, give Admin role
                    if (staff.getDesignation() != null && staff.getDesignation().equalsIgnoreCase("Admin")) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_ADMIN"));
                        details.put("role", "admin");
                        details.put("role_name", "Admin");
                    }

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

                    List<SimpleGrantedAuthority> authorities = new ArrayList<>();
                    authorities.add(new SimpleGrantedAuthority("ROLE_STUDENT"));
                    authorities.add(new SimpleGrantedAuthority("ROLE_USER"));

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
}
