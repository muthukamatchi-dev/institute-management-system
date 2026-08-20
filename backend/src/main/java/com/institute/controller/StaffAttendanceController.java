package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.model.StaffAttendance;
import com.institute.repository.StaffAttendanceRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/staff-attendance")
public class StaffAttendanceController {

    private final StaffAttendanceRepository repository;

    public StaffAttendanceController(StaffAttendanceRepository repository) {
        this.repository = repository;
    }

    @GetMapping("/today")
    public ResponseEntity<ApiResponse> getTodayAttendance(Authentication auth) {
        if (auth == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }

        Long staffId = getStaffContextId(auth);
        LocalDate today = LocalDate.now();

        Optional<StaffAttendance> attendance = repository.findByStaffIdAndAttendanceDate(staffId, today);
        return ResponseEntity.ok(ApiResponse.success(attendance.orElse(null)));
    }

    @PostMapping("/save")
    public ResponseEntity<ApiResponse> saveAttendance(Authentication auth, @RequestBody Map<String, String> body) {
        if (auth == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("Not authenticated"));
        }

        Long staffId = getStaffContextId(auth);
        LocalDate today = LocalDate.now();

        StaffAttendance attendance = repository.findByStaffIdAndAttendanceDate(staffId, today)
                .orElseGet(() -> StaffAttendance.builder()
                        .staffId(staffId)
                        .attendanceDate(today)
                        .build());

        if (body.containsKey("loginTime")) {
            attendance.setLoginTime(body.get("loginTime"));
        }
        if (body.containsKey("logoutTime")) {
            attendance.setLogoutTime(body.get("logoutTime"));
        }

        StaffAttendance saved = repository.save(attendance);
        return ResponseEntity.ok(ApiResponse.success(saved, "Attendance saved successfully"));
    }

    private Long getStaffContextId(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long id = Long.valueOf(details.get("id").toString());
        String type = details.containsKey("type") ? details.get("type").toString() : "";
        if ("user".equalsIgnoreCase(type)) {
            return 1000000 + id;
        }
        return id;
    }
}
