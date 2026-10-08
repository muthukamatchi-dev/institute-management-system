package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.model.*;
import com.institute.service.InstituteService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
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

    @org.springframework.beans.factory.annotation.Autowired
    private com.institute.service.storage.DelegatingStorageService storageService;

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

    private Long parseNullableLong(Object val) {
        if (val == null) return null;
        String str = val.toString().trim();
        if (str.isEmpty() || "null".equalsIgnoreCase(str) || "undefined".equalsIgnoreCase(str)) return null;
        try {
            return Long.valueOf(str);
        } catch (NumberFormatException e) {
            return null;
        }
    }

    // POST /api/institute/save_course
    @PostMapping("/save_course")
    public ResponseEntity<ApiResponse> saveCourse(@RequestBody Map<String, Object> body) {
        Long id = parseNullableLong(body.get("id"));
        Long savedId = service.saveCourse(body, id);
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("id", savedId);
        return ResponseEntity.ok(ApiResponse.success(data, id != null ? "Course updated" : "Course created"));
    }

    // POST /api/institute/delete_course
    @PostMapping("/delete_course")
    public ResponseEntity<ApiResponse> deleteCourse(@RequestBody Map<String, Object> body) {
        Long id = parseNullableLong(body.get("id"));
        if (id != null && service.deleteCourse(id)) {
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
        try {
            Long id = parseNullableLong(body.get("id"));
            Long savedId = service.saveBatch(body, id);
            Map<String, Object> data = new LinkedHashMap<>();
            data.put("id", savedId);
            return ResponseEntity.ok(ApiResponse.success(data, id != null ? "Batch updated" : "Batch created"));
        } catch (Exception e) {
            String msg = e.getMessage();
            if (e.getCause() != null && e.getCause().getMessage() != null) {
                msg = e.getCause().getMessage();
            }
            return ResponseEntity.badRequest().body(ApiResponse.error(msg != null ? msg : "Failed to save batch"));
        }
    }

    // POST /api/institute/delete_batch
    @PostMapping("/delete_batch")
    public ResponseEntity<ApiResponse> deleteBatch(@RequestBody Map<String, Object> body) {
        Long id = parseNullableLong(body.get("id"));
        if (id != null && service.deleteBatch(id)) {
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
            Long id = parseNullableLong(body.get("id"));
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
        Long id = parseNullableLong(body.get("id"));
        if (id == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Invalid student ID"));
        }
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
        Long id = parseNullableLong(body.get("id"));
        Long savedId = service.saveStaff(body, id);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", savedId), id != null ? "Staff updated" : "Staff added"));
    }

    // POST /api/institute/delete_staff
    @PostMapping("/delete_staff")
    public ResponseEntity<ApiResponse> deleteStaff(@RequestBody Map<String, Object> body) {
        Long id = parseNullableLong(body.get("id"));
        if (id != null && service.deleteStaff(id)) {
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

    // GET /api/institute/about
    @GetMapping("/about")
    public ResponseEntity<ApiResponse> getAboutDetails() {
        return ResponseEntity.ok(ApiResponse.success(service.getAboutDetails()));
    }

    // POST /api/institute/save_backup_settings
    @PostMapping("/save_backup_settings")
    public ResponseEntity<ApiResponse> saveBackupSettings(@RequestBody Map<String, Object> body) {
        service.updateSettings(body);
        return ResponseEntity.ok(ApiResponse.success(null, "Backup schedule settings updated successfully"));
    }

    // GET /api/institute/backup/download
    @GetMapping("/backup/download")
    public ResponseEntity<byte[]> downloadBackup() {
        String sql = service.exportDatabaseSqlDump();
        byte[] bytes = sql.getBytes(java.nio.charset.StandardCharsets.UTF_8);
        String filename = "institute_db_backup_" + System.currentTimeMillis() + ".sql";

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .contentLength(bytes.length)
                .body(bytes);
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

    // GET /api/institute/student_courses?student_id={id}
    @GetMapping("/student_courses")
    public ResponseEntity<ApiResponse> getStudentCourses(@RequestParam(name = "student_id") Long studentId) {
        return ResponseEntity.ok(ApiResponse.success(service.getStudentCourses(studentId)));
    }

    // POST /api/institute/enroll_additional_course
    @PostMapping("/enroll_additional_course")
    public ResponseEntity<ApiResponse> enrollAdditionalCourse(@RequestBody Map<String, Object> body) {
        try {
            Long studentId = Long.valueOf(body.get("student_id").toString());
            Map<String, Object> result = service.enrollAdditionalCourse(studentId, body);
            if (result.containsKey("error")) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.get("error").toString()));
            }
            return ResponseEntity.ok(ApiResponse.success(result, "Student enrolled in additional course"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // POST /api/institute/unenroll_course
    @PostMapping("/unenroll_course")
    public ResponseEntity<ApiResponse> unenrollFromCourse(@RequestBody Map<String, Object> body) {
        try {
            Long studentId = Long.valueOf(body.get("student_id").toString());
            Long courseId = Long.valueOf(body.get("course_id").toString());
            Map<String, Object> result = service.unenrollFromCourse(studentId, courseId);
            if (result.containsKey("error")) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.get("error").toString()));
            }
            return ResponseEntity.ok(ApiResponse.success(null, "Student unenrolled from course"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // POST /api/institute/update_student_course
    @PostMapping("/update_student_course")
    public ResponseEntity<ApiResponse> updateStudentCourse(@RequestBody Map<String, Object> body) {
        try {
            Long studentId = Long.valueOf(body.get("student_id").toString());
            Map<String, Object> result = service.updateStudentCourse(studentId, body);
            if (result.containsKey("error")) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.get("error").toString()));
            }
            return ResponseEntity.ok(ApiResponse.success(result, "Course enrollment updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // GET /api/institute/enquiries
    @GetMapping("/enquiries")
    public ResponseEntity<ApiResponse> getEnquiries() {
        return ResponseEntity.ok(ApiResponse.success(service.getEnquiries()));
    }

    // POST /api/institute/enquiries
    @PostMapping("/enquiries")
    public ResponseEntity<ApiResponse> createEnquiry(@RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(ApiResponse.success(service.createEnquiry(body), "Enquiry logged successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // PUT /api/institute/enquiries/{id}
    @PutMapping("/enquiries/{id}")
    public ResponseEntity<ApiResponse> updateEnquiry(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(ApiResponse.success(service.updateEnquiry(id, body), "Enquiry updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }

    // DELETE /api/institute/enquiries/{id}
    @DeleteMapping("/enquiries/{id}")
    public ResponseEntity<ApiResponse> deleteEnquiry(@PathVariable Long id) {
        if (service.deleteEnquiry(id)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Enquiry deleted successfully"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Enquiry not found"));
    }

    // PATCH /api/institute/enquiries/{id}/status
    @PatchMapping("/enquiries/{id}/status")
    public ResponseEntity<ApiResponse> updateEnquiryStatus(@PathVariable Long id, @RequestBody Map<String, Object> body) {
        try {
            return ResponseEntity.ok(ApiResponse.success(service.updateEnquiry(id, body), "Status updated"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
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

    // POST /api/institute/upload_student_image
    @PostMapping("/upload_student_image")
    public ResponseEntity<ApiResponse> uploadStudentImage(@RequestParam(name = "image", required = false) MultipartFile image,
                                                          @RequestParam(name = "file", required = false) MultipartFile file,
                                                          @RequestParam(name = "student_id", required = false) Long studentId) {
        try {
            MultipartFile upload = resolveUploadFile(image, file);
            if (upload == null || upload.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Please select a student profile image."));
            }
            com.institute.service.storage.StorageResult result = storageService.uploadFile("STUDENT_IMAGES", upload, "STUDENT", studentId);
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getErrorMessage()));
            }
            return ResponseEntity.ok(ApiResponse.success(buildUploadResponseMap(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Student photo upload failed: " + e.getMessage()));
        }
    }

    // POST /api/institute/upload_staff_image
    @PostMapping("/upload_staff_image")
    public ResponseEntity<ApiResponse> uploadStaffImage(@RequestParam(name = "image", required = false) MultipartFile image,
                                                        @RequestParam(name = "file", required = false) MultipartFile file,
                                                        @RequestParam(name = "staff_id", required = false) Long staffId) {
        try {
            MultipartFile upload = resolveUploadFile(image, file);
            if (upload == null || upload.isEmpty()) {
                return ResponseEntity.badRequest().body(ApiResponse.error("Please select a staff profile image."));
            }
            com.institute.service.storage.StorageResult result = storageService.uploadFile("STAFF_IMAGES", upload, "STAFF", staffId);
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getErrorMessage()));
            }
            return ResponseEntity.ok(ApiResponse.success(buildUploadResponseMap(result)));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Staff photo upload failed: " + e.getMessage()));
        }
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
            com.institute.service.storage.StorageResult result = storageService.uploadFile("COURSE_IMAGES", upload, "SYLLABUS", null);
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getErrorMessage()));
            }
            return ResponseEntity.ok(ApiResponse.success(buildUploadResponseMap(result)));
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
            com.institute.service.storage.StorageResult result = storageService.uploadFile("COURSE_IMAGES", upload, "COURSE", null);
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getErrorMessage()));
            }
            return ResponseEntity.ok(ApiResponse.success(buildUploadResponseMap(result)));
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
            com.institute.service.storage.StorageResult result = storageService.uploadFile("OTHER_DOCUMENTS", upload, "LOGO", null);
            if (!result.isSuccess()) {
                return ResponseEntity.badRequest().body(ApiResponse.error(result.getErrorMessage()));
            }
            return ResponseEntity.ok(ApiResponse.success(buildUploadResponseMap(result)));
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

    /**
     * Build a consistent upload response map.
     * For Google Drive uploads, returns a proper viewable URL.
     * For images: uses lh3.googleusercontent.com/d/FILE_ID for direct image rendering.
     * For other files: uses webViewLink (drive.google.com/file/d/FILE_ID/view).
     */
    private Map<String, Object> buildUploadResponseMap(com.institute.service.storage.StorageResult result) {
        Map<String, Object> data = new java.util.LinkedHashMap<>();
        String storedPath = result.getRelativePathOrUrl();

        if ("GOOGLE_DRIVE".equals(result.getProvider()) && result.getProviderFileId() != null) {
            String mimeType = result.getMimeType() != null ? result.getMimeType() : "";
            if (mimeType.startsWith("image/")) {
                // For images, use lh3.googleusercontent.com for direct image rendering
                storedPath = "https://lh3.googleusercontent.com/d/" + result.getProviderFileId();
            } else if (result.getWebViewLink() != null) {
                // For documents/PDFs, use Drive viewer link
                storedPath = result.getWebViewLink();
            }
        }

        data.put("path", storedPath);
        data.put("provider", result.getProvider());
        if (result.getProviderFileId() != null) {
            data.put("provider_file_id", result.getProviderFileId());
        }
        return data;
    }
}
