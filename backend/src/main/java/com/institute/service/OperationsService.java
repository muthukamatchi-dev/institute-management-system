package com.institute.service;

import com.institute.model.*;
import com.institute.repository.*;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;

/**
 * Operations Service
 * Line-by-line migration of: Operations_model.php (499 lines)
 * Covers: fees, attendance, receipts, study materials, expenses
 */
@Service
public class OperationsService {

    private final FeeRepository feeRepo;
    private final ReceiptRepository receiptRepo;
    private final AttendanceRepository attendanceRepo;
    private final StudentRepository studentRepo;
    private final CourseRepository courseRepo;
    private final BatchRepository batchRepo;
    private final StaffRepository staffRepo;
    private final StudyMaterialRepository materialRepo;
    private final StudyMaterialAssignmentRepository materialAssignRepo;
    private final ExpenseRepository expenseRepo;
    private final ActivityLogRepository activityLogRepo;
    private final NotificationRepository notificationRepo;
    private final UserRepository userRepo;
    private final ScheduledClassRepository scheduledClassRepo;
    private final PasswordEncoder passwordEncoder;

    public OperationsService(FeeRepository feeRepo, ReceiptRepository receiptRepo,
                             AttendanceRepository attendanceRepo, StudentRepository studentRepo,
                             CourseRepository courseRepo, BatchRepository batchRepo, StaffRepository staffRepo,
                             StudyMaterialRepository materialRepo, StudyMaterialAssignmentRepository materialAssignRepo,
                             ExpenseRepository expenseRepo, ActivityLogRepository activityLogRepo,
                             NotificationRepository notificationRepo, UserRepository userRepo,
                             ScheduledClassRepository scheduledClassRepo,
                             PasswordEncoder passwordEncoder) {
        this.feeRepo = feeRepo;
        this.receiptRepo = receiptRepo;
        this.attendanceRepo = attendanceRepo;
        this.studentRepo = studentRepo;
        this.courseRepo = courseRepo;
        this.batchRepo = batchRepo;
        this.staffRepo = staffRepo;
        this.materialRepo = materialRepo;
        this.materialAssignRepo = materialAssignRepo;
        this.expenseRepo = expenseRepo;
        this.activityLogRepo = activityLogRepo;
        this.notificationRepo = notificationRepo;
        this.userRepo = userRepo;
        this.scheduledClassRepo = scheduledClassRepo;
        this.passwordEncoder = passwordEncoder;
    }

    // ============ FEES (Operations_model.php lines 7-65) ============

    public List<Map<String, Object>> getAllFees() {
        List<Fee> fees = feeRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Fee f : fees) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", f.getId());
            map.put("student_id", f.getStudentId());
            map.put("total_amount", f.getTotalAmount());
            map.put("paid_amount", f.getPaidAmount());
            map.put("balance_amount", f.getBalanceAmount());
            map.put("last_payment_date", f.getLastPaymentDate());
            map.put("status", f.getStatus());

            // Join student & course info (Operations_model.php lines 8-30)
            studentRepo.findById(f.getStudentId()).ifPresent(s -> {
                map.put("student_name", s.getName());
                map.put("regNumber", s.getRegNumber());
                map.put("student_status", s.getStatus());
                if (s.getBatchId() != null) {
                    map.put("batch_id", s.getBatchId());
                    batchRepo.findById(s.getBatchId()).ifPresent(b -> {
                        map.put("batch_name", b.getBatchName());
                        map.put("batch_status", b.getStatus());
                    });
                }
            });

            map.put("reminder_date", f.getReminderDate());
            map.put("is_reminder_enabled", f.getIsReminderEnabled());

            result.add(map);
        }
        return result;
    }

    @Transactional
    public boolean saveFeeReminder(Map<String, Object> data) {
        Long studentId = extractLong(data, "student_id");
        if (studentId == null) return false;

        List<Fee> fees = feeRepo.findByStudentId(studentId);
        if (fees.isEmpty()) return false;

        Fee fee = fees.get(0);
        Object dateVal = data.get("reminder_date");
        String dateStr = dateVal != null ? dateVal.toString() : null;
        fee.setReminderDate(dateStr != null && !dateStr.isBlank() ? LocalDate.parse(dateStr) : null);
        fee.setIsReminderEnabled(Integer.valueOf(data.getOrDefault("is_enabled", 0).toString()));
        feeRepo.save(fee);
        return true;
    }

    /**
     * Migrated from: Operations_model.php -> record_payment() lines 34-65
     */
    @Transactional
    public Map<String, Object> collectFee(Long studentId, BigDecimal amount, String method, String refNo) {
        List<Fee> fees = feeRepo.findByStudentId(studentId);
        Fee fee = fees.isEmpty() ? null : fees.get(0);
        if (fee == null) {
            return Collections.singletonMap("error", "No fee record found for student");
        }

        if (amount.compareTo(fee.getBalanceAmount()) > 0) {
            return Collections.singletonMap("error", "Payment amount cannot exceed balance amount: " + fee.getBalanceAmount());
        }

        BigDecimal newPaid = fee.getPaidAmount().add(amount);
        BigDecimal newBalance = fee.getTotalAmount().subtract(newPaid);
        fee.setPaidAmount(newPaid);
        fee.setBalanceAmount(newBalance);
        fee.setLastPaymentDate(LocalDate.now());

        if (newBalance.compareTo(BigDecimal.ZERO) <= 0) {
            fee.setStatus("paid");
        } else if (newPaid.compareTo(BigDecimal.ZERO) > 0) {
            fee.setStatus("partially_paid");
        }

        feeRepo.save(fee);

        // Create receipt (Operations_model.php lines 42-52)
        String receiptNo = "RCT-" + System.currentTimeMillis();
        Receipt receipt = Receipt.builder()
            .receiptNo(receiptNo)
            .studentId(studentId)
            .feeId(fee.getId())
            .amountPaid(amount)
            .paymentMethod(method != null ? method : "Cash")
            .paymentDate(LocalDate.now())
            .build();
        receiptRepo.save(receipt);

        // Log activity (Operations_model.php lines 55-60)
        Student student = studentRepo.findById(studentId).orElse(null);
        String studentName = student != null ? student.getName() : "Unknown";

        ActivityLog log = ActivityLog.builder()
            .userId(0L).userType("admin").action("Fee Payment")
            .description("Payment of " + amount + " received from " + studentName)
            .createdAt(LocalDateTime.now()).build();
        activityLogRepo.save(log);

        Notification notif = Notification.builder()
            .userId(null).userType("admin").title("Fee Payment")
            .message("Fee of " + amount + " collected from " + studentName)
            .type("fee").isRead(0).createdAt(LocalDateTime.now())
            .build();
        notificationRepo.save(notif);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("receipt_no", receiptNo);
        result.put("amount", amount);
        return result;
    }

    public List<Map<String, Object>> getReceipts() {
        List<Receipt> receipts = receiptRepo.findAllByOrderByPaymentDateDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Receipt r : receipts) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("receipt_no", r.getReceiptNo());
            map.put("student_id", r.getStudentId());
            map.put("amount_paid", r.getAmountPaid());
            map.put("payment_date", r.getPaymentDate());
            map.put("payment_method", r.getPaymentMethod());
            studentRepo.findById(r.getStudentId()).ifPresent(s -> {
                map.put("student_name", s.getName());
                if (s.getCourseId() != null) {
                    courseRepo.findById(s.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
                }
            });
            result.add(map);
        }
        return result;
    }

    // ============ ATTENDANCE (Operations_model.php lines 67-140) ============

    public List<Map<String, Object>> getAttendance(Long batchId, LocalDate date) {
        List<Student> students = batchId != null ? studentRepo.findByBatchId(batchId) : studentRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Student s : students) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("student_id", s.getId());
            map.put("student_name", s.getName());
            map.put("student_status", s.getStatus());
            map.put("batch_id", batchId);

            Optional<Attendance> att = batchId != null ?
                attendanceRepo.findByStudentIdAndAttendanceDateAndBatchId(s.getId(), date, batchId).stream().findFirst() :
                attendanceRepo.findByStudentIdAndAttendanceDate(s.getId(), date).stream().findFirst();

            if (att.isPresent()) {
                map.put("id", att.get().getId());
                map.put("attendance_date", att.get().getAttendanceDate());
                map.put("status", att.get().getStatus());
            } else {
                map.put("id", null);
                map.put("attendance_date", date);
                map.put("status", "absent");
            }

            result.add(map);
        }
        return result;
    }

    /**
     * Migrated from: Operations_model.php -> save_attendance() lines 77-140
     */
    @Transactional
    public boolean saveAttendance(Map<String, Object> data) {
        if (!data.containsKey("records") || !(data.get("records") instanceof List)) return false;

        List<Map<String, Object>> records = (List<Map<String, Object>>) data.get("records");
        Long batchId = extractLong(data, "batch_id");
        String dateStr = (String) data.getOrDefault("date", LocalDate.now().toString());
        LocalDate date = LocalDate.parse(dateStr);
        Long staffId = extractLong(data, "staff_id");
        Long classId = data.containsKey("scheduled_class_id") ? extractLong(data, "scheduled_class_id") : extractLong(data, "class_id");
        String description = (String) data.getOrDefault("description", null);

        for (Map<String, Object> record : records) {
            Long studentId = extractLong(record, "student_id");
            String status = (String) record.getOrDefault("status", "absent");
            String remarks = (String) record.getOrDefault("remarks", description);

            // Upsert attendance (Operations_model.php lines 100-130)
            Optional<Attendance> existing = (classId != null) ?
                attendanceRepo.findByStudentIdAndScheduledClassId(studentId, classId).stream().findFirst() :
                (batchId != null ?
                    attendanceRepo.findByStudentIdAndAttendanceDateAndBatchId(studentId, date, batchId).stream().findFirst() :
                    attendanceRepo.findByStudentIdAndAttendanceDate(studentId, date).stream().findFirst());

            Attendance attendance;
            if (existing.isPresent()) {
                attendance = existing.get();
            } else {
                attendance = new Attendance();
                attendance.setStudentId(studentId);
                attendance.setAttendanceDate(date);
                attendance.setBatchId(batchId);
            }
            attendance.setStatus(status);
            attendance.setRemarks(remarks);
            attendance.setStaffId(staffId);
            attendance.setScheduledClassId(classId);
            attendanceRepo.save(attendance);
        }

        return true;
    }

    public List<Map<String, Object>> getStudentProgress(Long studentId) {
        List<Attendance> attendance = attendanceRepo.findByStudentIdOrderByAttendanceDateDesc(studentId);
        List<Map<String, Object>> result = new ArrayList<>();
        
        for (Attendance a : attendance) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", a.getId());
            map.put("attendance_date", a.getAttendanceDate());
            map.put("status", a.getStatus());
            map.put("remarks", a.getRemarks());
            
            if (a.getScheduledClassId() != null) {
                scheduledClassRepo.findById(a.getScheduledClassId()).ifPresent(sc -> {
                   map.put("topic", sc.getTopic());
                   staffRepo.findById(sc.getStaffId()).ifPresent(st -> map.put("staff_name", st.getName()));
                });
            }
            
            if (a.getBatchId() != null) {
                batchRepo.findById(a.getBatchId()).ifPresent(b -> {
                    if (b.getCourseId() != null) {
                        courseRepo.findById(b.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
                    }
                    if (map.get("staff_name") == null && b.getInstructor() != null) {
                         try {
                              Long instId = Long.valueOf(b.getInstructor());
                              staffRepo.findById(instId).ifPresent(st -> map.put("staff_name", st.getName()));
                         } catch (Exception ignored) {}
                    }
                });
            } else {
                 studentRepo.findById(studentId).ifPresent(s -> {
                     if (s.getCourseId() != null) {
                         courseRepo.findById(s.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
                     }
                 });
            }
            
            result.add(map);
        }
        return result;
    }

    // ============ STUDY MATERIALS (Operations_model.php lines 279-350) ============

    public List<Map<String, Object>> getStudyMaterials() {
        List<StudyMaterial> materials = materialRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (StudyMaterial m : materials) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", m.getId());
            map.put("title", m.getTitle());
            map.put("description", m.getDescription());
            map.put("course_id", m.getCourseId());
            map.put("file_url", m.getFileUrl());
            map.put("file_name", m.getFileName());
            map.put("file_type", m.getFileType());
            map.put("target_type", m.getTargetType());
            map.put("target_ids", m.getTargetIds());
            map.put("uploaded_by", m.getUploadedBy());
            map.put("uploaded_at", m.getUploadedAt());

            courseRepo.findById(m.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
            
            Long uploaderId = m.getUploadedBy();
            if (uploaderId != null) {
                if (uploaderId >= 1000000) {
                    map.put("uploaded_by_type", "admin");
                    userRepo.findById(uploaderId - 1000000).ifPresent(u -> map.put("uploaded_by_name", u.getFullName()));
                } else {
                    map.put("uploaded_by_type", "staff");
                    staffRepo.findById(uploaderId).ifPresent(s -> map.put("uploaded_by_name", s.getName()));
                }
            } else {
                map.put("uploaded_by_name", "System");
                map.put("uploaded_by_type", "system");
            }

            // Get assignments (Operations_model.php -> get_study_materials)
            List<StudyMaterialAssignment> assignments = materialAssignRepo.findByMaterialId(m.getId());
            List<Long> batchTargets = new ArrayList<>();
            List<Long> studentTargets = new ArrayList<>();
            for (StudyMaterialAssignment a : assignments) {
                if ("batch".equals(a.getTargetType())) batchTargets.add(a.getTargetId());
                else if ("student".equals(a.getTargetType())) studentTargets.add(a.getTargetId());
            }
            map.put("batch_target_ids", batchTargets);
            map.put("student_target_ids", studentTargets);

            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getStudyMaterialsForUser(Long userId, String userType) {
        List<Map<String, Object>> materials = getStudyMaterials();
        if ("student".equalsIgnoreCase(userType)) {
            Student student = studentRepo.findById(userId).orElse(null);
            if (student == null) {
                return Collections.emptyList();
            }
            return materials.stream()
                .filter(material -> isVisibleToStudent(material, student))
                .toList();
        }

        if ("staff".equalsIgnoreCase(userType)) {
            Set<Long> visibleCourseIds = batchRepo.findByInstructor(String.valueOf(userId)).stream()
                .map(Batch::getCourseId)
                .filter(Objects::nonNull)
                .collect(java.util.stream.Collectors.toCollection(LinkedHashSet::new));
            return materials.stream()
                .filter(material -> {
                    Object courseId = material.get("course_id");
                    if (courseId == null) {
                        return false;
                    }
                    return visibleCourseIds.contains(Long.valueOf(courseId.toString()));
                })
                .toList();
        }

        return materials;
    }

    public List<Map<String, Object>> getClassAttendance(Long classId) {
        List<Map<String, Object>> result = new ArrayList<>();
        for (Attendance attendance : attendanceRepo.findByScheduledClassId(classId)) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", attendance.getId());
            map.put("student_id", attendance.getStudentId());
            map.put("batch_id", attendance.getBatchId());
            map.put("attendance_date", attendance.getAttendanceDate());
            map.put("status", attendance.getStatus());
            map.put("remarks", attendance.getRemarks());
            studentRepo.findById(attendance.getStudentId()).ifPresent(student -> {
                map.put("student_name", student.getName());
                map.put("reg_number", student.getRegNumber());
                map.put("mobile", student.getMobile());
            });
            result.add(map);
        }
        return result;
    }

    @Transactional
    public Long saveStudyMaterial(Map<String, Object> data) {
        Long id = extractLong(data, "id");
        StudyMaterial material;
        if (id != null) {
            material = materialRepo.findById(id).orElse(new StudyMaterial());
        } else {
            material = new StudyMaterial();
            material.setUploadedAt(LocalDateTime.now());
        }

        if (!data.containsKey("course_id") && !data.containsKey("courseId")) {
            throw new IllegalArgumentException("Course ID is required to save study material");
        }

        if (data.containsKey("title")) material.setTitle((String) data.get("title"));
        if (data.containsKey("description")) material.setDescription((String) data.get("description"));
        if (data.containsKey("course_id") || data.containsKey("courseId")) {
            material.setCourseId(data.containsKey("course_id") ? extractLong(data, "course_id") : extractLong(data, "courseId"));
        }
        if (data.containsKey("file_url")) material.setFileUrl((String) data.get("file_url"));
        if (data.containsKey("fileUrl")) material.setFileUrl((String) data.get("fileUrl"));
        if (data.containsKey("file_name")) material.setFileName((String) data.get("file_name"));
        if (data.containsKey("fileName")) material.setFileName((String) data.get("fileName"));
        if (data.containsKey("file_type")) material.setFileType((String) data.get("file_type"));
        if (data.containsKey("fileType")) material.setFileType((String) data.get("fileType"));
        if (data.containsKey("uploaded_by") || data.containsKey("uploadedBy")) {
            Long uploaderId = data.containsKey("uploaded_by") ? extractLong(data, "uploaded_by") : extractLong(data, "uploadedBy");
            material.setUploadedBy(uploaderId);
            if (uploaderId != null) {
                material.setUploadedByType(uploaderId >= 1000000 ? "admin" : "staff");
            }
        }
        if (data.containsKey("target_type")) material.setTargetType((String) data.get("target_type"));
        if (data.containsKey("targetType")) material.setTargetType((String) data.get("targetType"));
        if (data.containsKey("target_ids")) material.setTargetIds(data.get("target_ids") != null ? data.get("target_ids").toString() : null);
        if (data.containsKey("targetIds")) material.setTargetIds(data.get("targetIds") != null ? data.get("targetIds").toString() : null);

        StudyMaterial saved = materialRepo.save(material);

        // Handle assignments
        materialAssignRepo.deleteByMaterialId(saved.getId());
        List<Long> batchTargetIds = extractTargetIds(data.get("batch_target_ids"));
        List<Long> studentTargetIds = extractTargetIds(data.get("student_target_ids"));
        if (batchTargetIds.isEmpty() && studentTargetIds.isEmpty()) {
            List<Long> sharedIds = extractTargetIds(data.get("targetIds"));
            Object targetType = data.get("targetType");
            if ("batch".equals(targetType)) {
                batchTargetIds = sharedIds;
            } else if ("student".equals(targetType)) {
                studentTargetIds = sharedIds;
            }
        }
        for (Long bid : batchTargetIds) {
                materialAssignRepo.save(StudyMaterialAssignment.builder()
                    .materialId(saved.getId()).targetType("batch")
                    .targetId(bid).assignedAt(LocalDateTime.now()).build());
        }
        for (Long sid : studentTargetIds) {
                materialAssignRepo.save(StudyMaterialAssignment.builder()
                    .materialId(saved.getId()).targetType("student")
                    .targetId(sid).assignedAt(LocalDateTime.now()).build());
        }

        return saved.getId();
    }

    private boolean isVisibleToStudent(Map<String, Object> material, Student student) {
        String targetType = Objects.toString(material.get("target_type"), "all");
        if ("all".equalsIgnoreCase(targetType) || "none".equalsIgnoreCase(targetType) || "mixed".equalsIgnoreCase(targetType)) {
            return true;
        }
        List<Long> batchTargets = toLongList(material.get("batch_target_ids"));
        List<Long> studentTargets = toLongList(material.get("student_target_ids"));
        return (student.getBatchId() != null && batchTargets.contains(student.getBatchId()))
            || studentTargets.contains(student.getId());
    }

    private List<Long> extractTargetIds(Object value) {
        if (value instanceof List<?> list) {
            List<Long> ids = new ArrayList<>();
            for (Object item : list) {
                if (item != null) {
                    ids.add(Long.valueOf(item.toString()));
                }
            }
            return ids;
        }
        if (value instanceof String stringValue && !stringValue.isBlank()) {
            String normalized = stringValue.trim();
            if (normalized.startsWith("[") && normalized.endsWith("]")) {
                normalized = normalized.substring(1, normalized.length() - 1);
            }
            if (normalized.isBlank()) {
                return new ArrayList<>();
            }
            List<Long> ids = new ArrayList<>();
            for (String token : normalized.split(",")) {
                String cleaned = token.replace("\"", "").trim();
                if (!cleaned.isEmpty()) {
                    ids.add(Long.valueOf(cleaned));
                }
            }
            return ids;
        }
        return new ArrayList<>();
    }

    private List<Long> toLongList(Object value) {
        if (!(value instanceof List<?> list)) {
            return Collections.emptyList();
        }
        List<Long> ids = new ArrayList<>();
        for (Object item : list) {
            if (item != null) {
                ids.add(Long.valueOf(item.toString()));
            }
        }
        return ids;
    }

    public boolean deleteStudyMaterial(Long id) {
        materialAssignRepo.deleteByMaterialId(id);
        materialRepo.deleteById(id);
        return true;
    }

    // ============ EXPENSES (Operations_model.php lines 371-432) ============

    public List<Expense> getExpenses() {
        return expenseRepo.findAllByOrderByExpenseDateDesc();
    }

    @Transactional
    public Long saveExpense(Map<String, Object> data) {
        Long id = data.containsKey("id") && data.get("id") != null ? Long.valueOf(data.get("id").toString()) : null;
        Expense expense;
        if (id != null) {
            expense = expenseRepo.findById(id).orElse(new Expense());
        } else {
            expense = new Expense();
            expense.setCreatedAt(LocalDateTime.now());
        }

        if (data.containsKey("title")) expense.setTitle((String) data.get("title"));
        if (data.containsKey("category")) expense.setCategory((String) data.get("category"));
        if (data.containsKey("amount")) expense.setAmount(new BigDecimal(data.get("amount").toString()));
        if (data.containsKey("expense_date")) expense.setExpenseDate(LocalDate.parse(data.get("expense_date").toString()));
        if (data.containsKey("description")) expense.setDescription((String) data.get("description"));
        if (data.containsKey("reference_no")) expense.setReferenceNo((String) data.get("reference_no"));
        if (data.containsKey("payment_method")) expense.setPaymentMethod((String) data.get("payment_method"));
        if (data.containsKey("created_by")) expense.setCreatedBy(Long.valueOf(data.get("created_by").toString()));

        return expenseRepo.save(expense).getId();
    }

    public boolean deleteExpense(Long id) {
        expenseRepo.deleteById(id);
        return true;
    }

    public List<Map<String, Object>> getExpenseStats() {
        List<Object[]> stats = expenseRepo.getExpenseStatsByCategory();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : stats) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("category", row[0]);
            map.put("total_amount", row[1]);
            result.add(map);
        }
        return result;
    }

    private Long extractLong(Map<String, Object> data, String key) {
        if (!data.containsKey(key) || data.get(key) == null || String.valueOf(data.get(key)).isBlank() || "null".equals(String.valueOf(data.get(key)))) {
            return null;
        }
        try {
            return Long.valueOf(String.valueOf(data.get(key)));
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
