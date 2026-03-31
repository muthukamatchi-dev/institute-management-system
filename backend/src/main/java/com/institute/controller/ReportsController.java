package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.service.ReportsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.*;

/**
 * Reports Controller
 * Migrated from: controllers/api/Reports.php (202 lines)
 */
@RestController
@RequestMapping("/api/reports")
public class ReportsController {

    private final ReportsService service;

    public ReportsController(ReportsService service) {
        this.service = service;
    }

    @GetMapping("/dashboard_stats")
    public ResponseEntity<ApiResponse> dashboardStats() {
        return ResponseEntity.ok(ApiResponse.success(service.getDashboardStats()));
    }

    @GetMapping("/recent_activities")
    public ResponseEntity<ApiResponse> recentActivities() {
        return ResponseEntity.ok(ApiResponse.success(service.getRecentActivities()));
    }

    @GetMapping("/upcoming_deadlines")
    public ResponseEntity<ApiResponse> upcomingDeadlines() {
        return ResponseEntity.ok(ApiResponse.success(service.getUpcomingDeadlines()));
    }

    @GetMapping("/attendance_report")
    public ResponseEntity<ApiResponse> attendanceReport(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getAttendanceReport(filters)));
    }

    @GetMapping("/profit_loss")
    public ResponseEntity<ApiResponse> profitLoss(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getProfitLoss(filters)));
    }

    @GetMapping("/expenses_report")
    public ResponseEntity<ApiResponse> expensesReport(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getExpensesReport(filters)));
    }

    @GetMapping("/batch_performance")
    public ResponseEntity<ApiResponse> batchPerformance(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getBatchPerformance(filters)));
    }

    @GetMapping("/course_revenue")
    public ResponseEntity<ApiResponse> courseRevenue(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getCourseRevenue(filters)));
    }

    @GetMapping("/enrollment_trends")
    public ResponseEntity<ApiResponse> enrollmentTrends(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getEnrollmentTrends(filters)));
    }

    @GetMapping("/student_map")
    public ResponseEntity<ApiResponse> studentMap(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getStudentMap(filters)));
    }

    @GetMapping("/audit_logs")
    public ResponseEntity<ApiResponse> auditLogs(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getAuditLogs(filters)));
    }

    @GetMapping("/staff_worklog")
    public ResponseEntity<ApiResponse> staffWorklog(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getStaffWorklog(filters)));
    }
}
