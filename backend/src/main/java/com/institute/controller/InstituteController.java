package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.model.*;
import com.institute.service.InstituteService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.*;

/**
 * Institute Controller
 * Migrated from: controllers/api/Institute.php (445 lines)
 * API paths preserved exactly
 */
@RestController
@RequestMapping("/api/institute")
public class InstituteController {

    private final InstituteService service;

    @Value("${app.upload.dir:./uploads}")
    private String uploadDir;

    public InstituteController(InstituteService service) {
        this.service = service;
    }

    // GET /api/institute/courses
    @GetMapping("/courses")
    public ResponseEntity<ApiResponse> getCourses() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllCourses()));
    }

    // POST /api/institute/save_course
    @PostMapping("/save_course")
    public ResponseEntity<ApiResponse> saveCourse(@RequestBody Map<String, Object> body) {
        Long id = body.containsKey("id") && body.get("id") != null ? Long.valueOf(body.get("id").toString()) : null;
        Long savedId = service.saveCourse(body, id);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", savedId);
        return ResponseEntity.ok(ApiResponse.success(data, id != null ? "Course updated" : "Course created"));
    }

    // POST /api/institute/delete_course
    @PostMapping("/delete_course")
    public ResponseEntity<ApiResponse> deleteCourse(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        if (service.deleteCourse(id)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Course deleted"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Course not found"));
    }

    // GET /api/institute/batches
    @GetMapping("/batches")
    public ResponseEntity<ApiResponse> getBatches() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllBatches()));
    }

    // POST /api/institute/save_batch
    @PostMapping("/save_batch")
    public ResponseEntity<ApiResponse> saveBatch(@RequestBody Map<String, Object> body) {
        Long id = body.containsKey("id") && body.get("id") != null ? Long.valueOf(body.get("id").toString()) : null;
        Long savedId = service.saveBatch(body, id);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", savedId);
        return ResponseEntity.ok(ApiResponse.success(data, id != null ? "Batch updated" : "Batch created"));
    }

    // POST /api/institute/delete_batch
    @PostMapping("/delete_batch")
    public ResponseEntity<ApiResponse> deleteBatch(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        if (service.deleteBatch(id)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Batch deleted"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Batch not found"));
    }

    // GET /api/institute/students
    @GetMapping("/students")
    public ResponseEntity<ApiResponse> getStudents(
            @RequestParam(name = "batch_id", required = false) Long batch_id,
            @RequestParam(name = "page", required = false) Integer page,
            @RequestParam(name = "size", required = false, defaultValue = "10") Integer size,
            @RequestParam(name = "search", required = false) String search,
            @RequestParam(name = "course_id", required = false) String course_id,
            @RequestParam(name = "status", required = false) String status) {
        if (page != null) {
            Map<String, Object> pagedData = service.getPagedStudents(page, size, batch_id, search, course_id, status);
            return ResponseEntity.ok(ApiResponse.success(pagedData));
        }
        List<Map<String, Object>> students = service.getAllStudents(batch_id);
        return ResponseEntity.ok(ApiResponse.success(students));
    }

    // POST /api/institute/save_student
    @PostMapping("/save_student")
    public ResponseEntity<ApiResponse> saveStudent(@RequestBody Map<String, Object> body) {
        try {
            Long id = body.containsKey("id") && body.get("id") != null ? Long.valueOf(body.get("id").toString()) : null;
            Long savedId = service.saveStudent(body, id);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id", savedId);
            return ResponseEntity.ok(ApiResponse.success(data, id != null ? "Student updated" : "Student enrolled"));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // POST /api/institute/delete_student
    @PostMapping("/delete_student")
    public ResponseEntity<ApiResponse> deleteStudent(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        String result = service.deleteStudent(id);
        if (result.equals("success")) {
            return ResponseEntity.ok(ApiResponse.success(null, "Student deleted"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error(result.replace("error:", "")));
    }

    // GET /api/institute/staff
    @GetMapping("/staff")
    public ResponseEntity<ApiResponse> getStaff() {
        return ResponseEntity.ok(ApiResponse.success(service.getAllStaff()));
    }

    // POST /api/institute/save_staff
    @PostMapping("/save_staff")
    public ResponseEntity<ApiResponse> saveStaff(@RequestBody Map<String, Object> body) {
        Long id = body.containsKey("id") && body.get("id") != null ? Long.valueOf(body.get("id").toString()) : null;
        Long savedId = service.saveStaff(body, id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", savedId), id != null ? "Staff updated" : "Staff added"));
    }

    // POST /api/institute/delete_staff
    @PostMapping("/delete_staff")
    public ResponseEntity<ApiResponse> deleteStaff(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        if (service.deleteStaff(id)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Staff deleted"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Staff not found"));
    }

    // GET /api/institute/settings
    @GetMapping("/settings")
    public ResponseEntity<ApiResponse> getSettings() {
        return ResponseEntity.ok(ApiResponse.success(service.getSettings()));
    }

    // POST /api/institute/save_settings
    @PostMapping("/save_settings")
    public ResponseEntity<ApiResponse> saveSettings(@RequestBody Map<String, Object> body) {
        service.updateSettings(body);
        return ResponseEntity.ok(ApiResponse.success(null, "Settings saved"));
    }

    // GET /api/institute/next_reg_number
    @GetMapping("/next_reg_number")
    public ResponseEntity<ApiResponse> getNextRegNumber() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("next", service.getNextRegNumber())));
    }

    // GET /api/institute/next_staff_id
    @GetMapping("/next_staff_id")
    public ResponseEntity<ApiResponse> getNextStaffId() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("next", service.getNextStaffId())));
    }

    // GET /api/institute/next_course_id
    @GetMapping("/next_course_id")
    public ResponseEntity<ApiResponse> getNextCourseId() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("next", service.getNextCourseId())));
    }

    // GET /api/institute/search
    @GetMapping("/search")
    public ResponseEntity<ApiResponse> search(@RequestParam(name = "q") String q) {
        return ResponseEntity.ok(ApiResponse.success(service.searchAll(q)));
    }

    // GET /api/institute/notifications
    @GetMapping("/notifications")
    public ResponseEntity<ApiResponse> getNotifications(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        String userType = details.get("type").toString();
        return ResponseEntity.ok(ApiResponse.success(service.getUserNotifications(userId, userType)));
    }

    // POST /api/institute/mark_notification_read
    @PostMapping("/mark_notification_read")
    public ResponseEntity<ApiResponse> markNotificationRead(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        String userType = details.get("type").toString();
        service.markNotificationsRead(userId, userType);
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    // POST /api/institute/mark_completed
    @PostMapping("/mark_completed")
    public ResponseEntity<ApiResponse> markCompleted(@RequestBody Map<String, Object> body) {
        if (service.markStudentsCompleted(body)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Marked as completed"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Failed"));
    }

    // POST /api/institute/update_allocation
    @PostMapping("/update_allocation")
    public ResponseEntity<ApiResponse> updateAllocation(@RequestBody Map<String, Object> body) {
        Long studentId = Long.valueOf(body.get("id").toString());
        if (service.updateOneToOneAllocation(studentId, body)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Allocation updated"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Student not found"));
    }

    // POST /api/institute/schedule_class
    @PostMapping("/schedule_class")
    public ResponseEntity<ApiResponse> scheduleClass(@RequestBody Map<String, Object> body, Authentication auth) {
        try {
            Long id = service.scheduleClass(body, getStaffContextId(auth));
            return ResponseEntity.ok(ApiResponse.success(Map.of("id", id)));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // POST /api/institute/delete_schedule
    @PostMapping("/delete_schedule")
    public ResponseEntity<ApiResponse> deleteSchedule(@RequestBody Map<String, Object> body) {
        service.deleteSchedule(Long.valueOf(body.get("id").toString()));
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
    }

    // GET /api/institute/my_schedule
    @GetMapping("/my_schedule")
    public ResponseEntity<ApiResponse> getMySchedule(Authentication auth,
                                                     @RequestParam(name = "date", required = false) String date,
                                                     @RequestParam(name = "staff_id", required = false) Long staffId) {
        Long userId = getStaffContextId(auth);
        LocalDate schedDate = date != null ? LocalDate.parse(date) : LocalDate.now();
        return ResponseEntity.ok(ApiResponse.success(service.getStaffSchedule(userId, staffId, schedDate)));
    }

    // POST /api/institute/upload_syllabus
    @PostMapping("/upload_syllabus")
    public ResponseEntity<ApiResponse> uploadSyllabus(@RequestParam(name = "syllabus", required = false) MultipartFile syllabus,
                                                      @RequestParam(name = "file", required = false) MultipartFile file) {
        try {
            MultipartFile upload = resolveUploadFile(syllabus, file);
            if (upload == null || upload.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Please choose a PDF syllabus file to upload."));
            }
            if (upload.getOriginalFilename() == null || !upload.getOriginalFilename().toLowerCase().endsWith(".pdf")) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only PDF syllabus files are allowed."));
            }
            Path dir = resolveUploadDirectory("syllabi");
            String filename = System.currentTimeMillis() + "_" + sanitizeFilename(upload.getOriginalFilename());
            Path targetPath = dir.resolve(filename);
            Files.copy(upload.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(ApiResponse.success(Map.of("path", "uploads/syllabi/" + filename)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    // POST /api/institute/upload_course_image
    @PostMapping("/upload_course_image")
    public ResponseEntity<ApiResponse> uploadCourseImage(@RequestParam(name = "image", required = false) MultipartFile image,
                                                         @RequestParam(name = "file", required = false) MultipartFile file) {
        try {
            MultipartFile upload = resolveUploadFile(image, file);
            if (upload == null || upload.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Please choose an image file to upload."));
            }
            if (upload.getContentType() == null || !upload.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only image uploads are allowed for course artwork."));
            }
            Path dir = resolveUploadDirectory("course_images");
            String filename = System.currentTimeMillis() + "_" + sanitizeFilename(upload.getOriginalFilename());
            Path targetPath = dir.resolve(filename);
            Files.copy(upload.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(ApiResponse.success(Map.of("path", "uploads/course_images/" + filename)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    // POST /api/institute/upload_logo
    @PostMapping("/upload_logo")
    public ResponseEntity<ApiResponse> uploadLogo(@RequestParam(name = "logo", required = false) MultipartFile logo,
                                                  @RequestParam(name = "file", required = false) MultipartFile file) {
        try {
            MultipartFile upload = resolveUploadFile(logo, file);
            if (upload == null || upload.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Please choose a logo file to upload."));
            }
            if (upload.getContentType() == null || !upload.getContentType().startsWith("image/")) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Only image uploads are allowed for the institute logo."));
            }
            Path dir = resolveUploadDirectory("logos");
            String filename = "logo_" + System.currentTimeMillis() + "_" + sanitizeFilename(upload.getOriginalFilename());
            Path targetPath = dir.resolve(filename);
            Files.copy(upload.getInputStream(), targetPath, StandardCopyOption.REPLACE_EXISTING);
            return ResponseEntity.ok(ApiResponse.success(Map.of("path", "uploads/logos/" + filename)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Upload failed: " + e.getMessage()));
        }
    }

    // GET /api/institute/my_students - staff view
    @GetMapping("/my_students")
    public ResponseEntity<ApiResponse> getMyStudents(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getStudentsForStaff(getStaffContextId(auth))));
    }

    // GET /api/institute/my_courses - staff view
    @GetMapping("/my_courses")
    public ResponseEntity<ApiResponse> getMyCourses(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getCoursesForStaff(getStaffContextId(auth))));
    }

    // GET /api/institute/my_batches - staff view
    @GetMapping("/my_batches")
    public ResponseEntity<ApiResponse> getMyBatches(Authentication auth) {
        return ResponseEntity.ok(ApiResponse.success(service.getBatchesForStaff(getStaffContextId(auth))));
    }

    // GET /api/institute/staff_resources
    @GetMapping("/staff_resources")
    public ResponseEntity<ApiResponse> getStaffResources(@RequestParam(name = "staff_id") String staff_id) {
        return ResponseEntity.ok(ApiResponse.success(service.getStaffResources(Long.valueOf(staff_id))));
    }

    // GET /api/institute/clone_previous_schedule
    @GetMapping("/clone_previous_schedule")
    public ResponseEntity<ApiResponse> clonePreviousSchedule(Authentication auth,
                                                             @RequestParam(name = "date") String date) {
        int copied = service.clonePreviousSchedule(getStaffContextId(auth), LocalDate.parse(date));
        String message = copied > 0
            ? "Copied " + copied + " schedule entries from the previous day"
            : "No previous-day schedule entries were available to clone";
        return ResponseEntity.ok(ApiResponse.success(Map.of("count", copied), message));
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

    private MultipartFile resolveUploadFile(MultipartFile primary, MultipartFile fallback) {
        if (primary != null && !primary.isEmpty()) {
            return primary;
        }
        if (fallback != null && !fallback.isEmpty()) {
            return fallback;
        }
        return primary != null ? primary : fallback;
    }

    private String sanitizeFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "upload";
        }
        return originalFilename.trim()
            .replace("\\", "_")
            .replace("/", "_")
            .replace("..", "_")
            .replace(" ", "_");
    }

    private Path resolveUploadDirectory(String subdirectory) throws Exception {
        Path basePath = Paths.get(uploadDir).toAbsolutePath().normalize();
        Path directory = basePath.resolve(subdirectory).normalize();
        Files.createDirectories(directory);
        return directory;
    }
}
