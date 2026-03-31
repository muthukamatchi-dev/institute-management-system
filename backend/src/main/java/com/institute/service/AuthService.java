package com.institute.service;

import com.institute.model.*;
import com.institute.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Auth Service
 * Line-by-line migration of: Auth_model.php
 * Covers: login (users/staff/students), verify_token, update_password
 * 
 * FIXED: Password comparison now uses BCryptPasswordEncoder instead of
 * plain-text comparison. The original PHP system stored passwords as
 * bcrypt hashes ($2y$10$...) which are compatible with Java's BCrypt ($2a$).
 */
@Service
public class AuthService {

    private final UserRepository userRepository;
    private final StaffRepository staffRepository;
    private final StudentRepository studentRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public AuthService(UserRepository userRepository, StaffRepository staffRepository,
                       StudentRepository studentRepository, RoleRepository roleRepository,
                       PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.staffRepository = staffRepository;
        this.studentRepository = studentRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /**
     * Migrated from: Auth_model.php -> login()
     * Original logic checks 3 tables: users, staff (by staff_id + mobile as password), students (by reg_number + password/dob)
     * 
     * FIXED: Now uses BCrypt for user password verification.
     * PHP's $2y$ hashes are compatible with Java's BCrypt ($2a$).
     */
    public Map<String, Object> login(String username, String password) {
        // 1. Check users table (Auth_model.php line 18-38)
        // FIXED: Find by username first, then verify password with bcrypt
        Optional<User> userOpt = userRepository.findByUsername(username);
        if (userOpt.isPresent()) {
            User user = userOpt.get();
            // PHP bcrypt uses $2y$ prefix, Java uses $2a$ - they are compatible
            // We need to handle both formats
            String storedPassword = user.getPassword();
            boolean passwordMatch = false;
            
            if (storedPassword != null) {
                if (storedPassword.startsWith("$2") && storedPassword.length() >= 60) {
                    // Looks like BCrypt (PHP $2y$ or Java $2a$)
                    String normalizedHash = storedPassword;
                    if (normalizedHash.startsWith("$2y$")) {
                        normalizedHash = "$2a$" + normalizedHash.substring(4);
                    }
                    try {
                        passwordMatch = passwordEncoder.matches(password, normalizedHash);
                    } catch (Exception e) {
                        passwordMatch = storedPassword.equals(password);
                    }
                } else {
                    // Plain text or other format
                    passwordMatch = storedPassword.equals(password);
                }
            }
            
            if (passwordMatch) {
                String token = UUID.randomUUID().toString().replace("-", "");
                user.setToken(token);
                user.setLastLogin(LocalDateTime.now());
                userRepository.save(user);

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("id", user.getId());
                result.put("name", user.getFullName());
                result.put("email", user.getEmail());
                result.put("username", user.getUsername());
                result.put("role", user.getRole() != null ? user.getRole().getRoleName() : "user");
                result.put("role_name", user.getRole() != null ? user.getRole().getRoleName() : "user");
                result.put("token", token);
                result.put("type", "user");
                result.put("branch_id", user.getBranchId());
                return result;
            }
        }

        // 2. Check staff table (staff_id = username, mobile = password) (Auth_model.php line 42-62)
        // Staff uses plain-text mobile as password (original PHP behavior)
        Optional<Staff> staffOpt = staffRepository.findByStaffIdAndMobile(username, password);
        if (staffOpt.isPresent()) {
            Staff staff = staffOpt.get();
            String token = UUID.randomUUID().toString().replace("-", "");
            staff.setToken(token);
            staff.setLastLogin(LocalDateTime.now());
            staffRepository.save(staff);

            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", staff.getId());
            result.put("name", staff.getName());
            result.put("email", staff.getEmail());
            result.put("staff_id", staff.getStaffId());
            result.put("role", "staff");
            result.put("role_name", "Staff");
            result.put("token", token);
            result.put("type", "staff");
            result.put("branch_id", staff.getBranchId());
            return result;
        }

        // 3. Check students table (reg_number = username, password or dob) (Auth_model.php line 65-100)
        Optional<Student> studentOpt = studentRepository.findByRegNumber(username);
        if (studentOpt.isPresent()) {
            Student student = studentOpt.get();
            boolean passwordMatch = false;

            // Check password field first
            if (student.getPassword() != null && student.getPassword().equals(password)) {
                passwordMatch = true;
            }
            // Fallback: check DOB as password (original behavior)
            if (!passwordMatch && student.getDob() != null) {
                String dobStr = student.getDob().toString(); // yyyy-MM-dd
                if (dobStr.equals(password)) {
                    passwordMatch = true;
                }
            }

            if (passwordMatch) {
                String token = UUID.randomUUID().toString().replace("-", "");
                student.setToken(token);
                student.setLastLogin(LocalDateTime.now());
                studentRepository.save(student);

                Map<String, Object> result = new LinkedHashMap<>();
                result.put("id", student.getId());
                result.put("name", student.getName());
                result.put("email", student.getEmail());
                result.put("reg_number", student.getRegNumber());
                result.put("role", "student");
                result.put("role_name", "Student");
                result.put("token", token);
                result.put("type", "student");
                result.put("branch_id", student.getBranchId());
                return result;
            }
        }

        return null; // Login failed
    }

    /**
     * Migrated from: Auth_model.php -> update_password()
     * FIXED: Now hashes new passwords with BCrypt before storing
     */
    public boolean changePassword(Long userId, String userType, String newPassword) {
        if ("user".equals(userType)) {
            Optional<User> opt = userRepository.findById(userId);
            if (opt.isPresent()) {
                User user = opt.get();
                user.setPassword(passwordEncoder.encode(newPassword));
                userRepository.save(user);
                return true;
            }
        } else if ("student".equals(userType)) {
            Optional<Student> opt = studentRepository.findById(userId);
            if (opt.isPresent()) {
                Student student = opt.get();
                student.setPassword(newPassword);
                studentRepository.save(student);
                return true;
            }
        }
        return false;
    }

    /**
     * Logout - clear token (original Auth.php -> logout)
     */
    public void logout(Long userId, String userType) {
        if ("user".equals(userType)) {
            userRepository.findById(userId).ifPresent(u -> { u.setToken(null); userRepository.save(u); });
        } else if ("staff".equals(userType)) {
            staffRepository.findById(userId).ifPresent(s -> { s.setToken(null); staffRepository.save(s); });
        } else if ("student".equals(userType)) {
            studentRepository.findById(userId).ifPresent(s -> { s.setToken(null); studentRepository.save(s); });
        }
    }

    /**
     * Update profile - original Auth.php -> update_profile
     */
    public boolean updateProfile(Long userId, String userType, String name, String email) {
        if ("user".equals(userType)) {
            Optional<User> opt = userRepository.findById(userId);
            if (opt.isPresent()) {
                User user = opt.get();
                user.setFullName(name);
                user.setEmail(email);
                userRepository.save(user);
                return true;
            }
        }
        return false;
    }
}
