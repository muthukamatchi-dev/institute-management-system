package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.service.OperationsService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.util.*;

/**
 * Operations Controller
 * Migrated from: controllers/api/Operations.php (224 lines)
 */
@RestController
@RequestMapping("/api/operations")
public class OperationsController {

    private final OperationsService service;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public OperationsController(OperationsService service) {
        this.service = service;
    }

    @GetMapping("/fees")
    public ResponseEntity<ApiResponse> getFees() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllFees()));
    }

    @PostMapping("/collect_fee")
    public ResponseEntity<ApiResponse> collectFee(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("student_id").toString());
        BigDecimal amount = new BigDecimal(body.get("amount").toString());
        String method = (String) body.getOrDefault("method", "Cash");
        String refNo = (String) body.get("ref_no");
        Map<String, Object> result = service.collectFee(studentId, amount, method, refNo);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(ApiResponse.error(result.get("error").toString()));
        }
        return ResponseEntity.ok(ApiResponse.success(result, "Fee collected"));
    }

    @GetMapping("/receipts")
    public ResponseEntity<ApiResponse> getReceipts() {
        return ResponseEntity.ok(ApiResponse.success(service.getReceipts()));
    }

    @PostMapping("/delete_receipt")
    public ResponseEntity<ApiResponse> deleteReceipt(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        Map<String, Object> result = service.deleteReceipt(id);
        if (result.containsKey("error")) {
            return ResponseEntity.badRequest().body(ApiResponse.error(result.get("error").toString()));
        }
        return ResponseEntity.ok(ApiResponse.success(result, "Receipt deleted successfully"));
    }

    @GetMapping("/get_attendance")
    public ResponseEntity<ApiResponse> getAttendance(@RequestParam(name = "batch_id", required = false) Long batch_id,
                                                      @RequestParam(name = "date") String date) {
        return ResponseEntity.ok(ApiResponse.success(service.getAttendance(batch_id, LocalDate.parse(date))));
    }

    @PostMapping("/save_attendance")
    public ResponseEntity<ApiResponse> saveAttendance(Authentication auth, @RequestBody Map<String, Object> body) {
        try {
            body.put("staff_id", getStaffContextId(auth));
            if (service.saveAttendance(body)) {
                return ResponseEntity.ok(ApiResponse.success(null, "Attendance saved"));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error("Failed to save attendance"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(ApiResponse.error("Server Error: " + e.getMessage()));
        }
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

    @GetMapping("/get_class_attendance")
    public ResponseEntity<ApiResponse> getClassAttendance(@RequestParam(name = "class_id") Long class_id) {
        return ResponseEntity.ok(ApiResponse.success(service.getClassAttendance(class_id)));
    }

    @GetMapping("/student_progress")
    public ResponseEntity<ApiResponse> getStudentProgress(@RequestParam(name = "student_id") Long student_id) {
        return ResponseEntity.ok(ApiResponse.success(service.getStudentProgress(student_id)));
    }

    @GetMapping("/study_materials")
    public ResponseEntity<ApiResponse> getStudyMaterials() {
        return ResponseEntity.ok(ApiResponse.success(service.getStudyMaterials()));
    }

    @GetMapping("/my_study_materials")
    public ResponseEntity<ApiResponse> getMyStudyMaterials(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        String userType = details.get("type").toString();
        return ResponseEntity.ok(ApiResponse.success(service.getStudyMaterialsForUser(userId, userType)));
    }

    @PostMapping("/save_study_material")
    public ResponseEntity<ApiResponse> saveStudyMaterial(Authentication auth, @RequestBody Map<String, Object> body) {
        try {
            if (!body.containsKey("uploaded_by") && !body.containsKey("uploadedBy")) {
                body.put("uploaded_by", getStaffContextId(auth));
            }
            Long id = service.saveStudyMaterial(body);
            return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Study material saved"));
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.internalServerError().body(ApiResponse.error("Server Error: " + e.getMessage()));
        }
    }

    @PostMapping("/delete_study_material")
    public ResponseEntity<ApiResponse> deleteStudyMaterial(@RequestBody Map<String, Object> body) {
        service.deleteStudyMaterial(Long.valueOf(body.get("id").toString()));
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
    }

    @PostMapping("/upload_study_material")
    public ResponseEntity<ApiResponse> uploadStudyMaterial(@RequestParam("material") MultipartFile file) {
        try {
            String dir = uploadDir + "/study_materials";
            Files.createDirectories(Paths.get(dir));
            String filename = System.currentTimeMillis() + "_" + file.getOriginalFilename();
            Path targetPath = Paths.get(dir, filename);
            file.transferTo(targetPath.toFile());
            return ResponseEntity.ok(ApiResponse.success(Map.of(
                "path", "uploads/study_materials/" + filename,
                "file_name", file.getOriginalFilename(),
                "file_type", file.getContentType()
            )));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    @GetMapping("/expenses")
    public ResponseEntity<ApiResponse> getExpenses() {
        return ResponseEntity.ok(ApiResponse.success(service.getExpenses()));
    }

    @PostMapping("/save_expense")
    public ResponseEntity<ApiResponse> saveExpense(@RequestBody Map<String, Object> body) {
        Long id = service.saveExpense(body);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Expense saved"));
    }

    @PostMapping("/save_fee_reminder")
    public ResponseEntity<ApiResponse> saveFeeReminder(@RequestBody Map<String, Object> body) {
        if (service.saveFeeReminder(body)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Reminder saved"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Failed to save reminder"));
    }

    @PostMapping("/delete_expense")
    public ResponseEntity<ApiResponse> deleteExpense(@RequestBody Map<String, Object> body) {
        service.deleteExpense(Long.valueOf(body.get("id").toString()));
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
    }

    @GetMapping("/expense_stats")
    public ResponseEntity<ApiResponse> getExpenseStats(@RequestParam(required = false) Map<String, String> filters) {
        return ResponseEntity.ok(ApiResponse.success(service.getExpenseStats(filters)));
    }
}
