package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.service.AuthService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Auth Controller
 * Migrated from: controllers/api/Auth.php
 * API Contract: Exact same paths as original
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    /**
     * POST /api/auth/login
     * Migrated from: Auth.php -> login()
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse> login(@RequestBody Map<String, String> body) {
        String username = body.get("username");
        String password = body.get("password");

        if (username == null || password == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Username and password required"));
        }

        Map<String, Object> user = authService.login(username, password);
        if (user != null) {
            Map<String, Object> responseMap = new java.util.LinkedHashMap<>();
            responseMap.put("status", "success");
            responseMap.put("user", user);
            responseMap.put("message", "Login successful");
            return ResponseEntity.ok(ApiResponse.builder()
                .status("success")
                .data(user)
                .message("Login successful")
                .build().withAdditional("user", user));
        }

        return ResponseEntity.status(401).body(ApiResponse.error("Invalid credentials"));
    }

    /**
     * POST /api/auth/logout
     * Migrated from: Auth.php -> logout()
     */
    @PostMapping("/logout")
    public ResponseEntity<ApiResponse> logout(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Map) {
            Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
            Long userId = Long.valueOf(details.get("id").toString());
            String userType = details.get("type").toString();
            authService.logout(userId, userType);
        }
        return ResponseEntity.ok(ApiResponse.success(null, "Logged out"));
    }

    /**
     * GET /api/auth/me
     * Migrated from: Auth.php -> me()
     */
    @GetMapping("/me")
    public ResponseEntity<ApiResponse> me(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof Map) {
            return ResponseEntity.ok(ApiResponse.success(auth.getPrincipal()));
        }
        return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
    }

    /**
     * POST /api/auth/change_password
     * Migrated from: Auth.php -> change_password()
     */
    @PostMapping("/change_password")
    public ResponseEntity<ApiResponse> changePassword(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        String userType = details.get("type").toString();
        String newPassword = body.get("new_password");

        boolean success = authService.changePassword(userId, userType, newPassword);
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(null, "Password changed"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Failed to change password"));
    }

    /**
     * POST /api/auth/update_profile
     * Migrated from: Auth.php -> update_profile()
     */
    @PostMapping("/update_profile")
    public ResponseEntity<ApiResponse> updateProfile(@RequestBody Map<String, String> body, Authentication auth) {
        if (auth == null) return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));

        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        String userType = details.get("type").toString();

        boolean success = authService.updateProfile(userId, userType, body.get("name"), body.get("email"));
        if (success) {
            return ResponseEntity.ok(ApiResponse.success(null, "Profile updated"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Failed to update profile"));
    }
}
