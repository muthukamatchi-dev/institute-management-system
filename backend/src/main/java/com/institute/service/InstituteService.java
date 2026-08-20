package com.institute.service;

import com.institute.model.*;
import com.institute.repository.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Institute Service
 * Line-by-line migration of: Institute_model.php (1336 lines)
 * Covers: courses, batches, students, staff, settings, search, notifications, auto-ID generation
 */
@Service
public class InstituteService {

    private final CourseRepository courseRepo;
    private final BatchRepository batchRepo;
    private final StudentRepository studentRepo;
    private final StudentBatchRepository studentBatchRepo;
    private final StaffRepository staffRepo;
    private final FeeRepository feeRepo;
    private final ReceiptRepository receiptRepo;
    private final AttendanceRepository attendanceRepo;
    private final InstituteSettingRepository settingRepo;
    private final ActivityLogRepository activityLogRepo;
    private final NotificationRepository notificationRepo;
    private final ScheduledClassRepository scheduledClassRepo;
    private final UserRepository userRepo;

    public InstituteService(CourseRepository courseRepo, BatchRepository batchRepo,
                            StudentRepository studentRepo, StudentBatchRepository studentBatchRepo,
                            StaffRepository staffRepo, FeeRepository feeRepo, ReceiptRepository receiptRepo,
                            AttendanceRepository attendanceRepo, InstituteSettingRepository settingRepo,
                            ActivityLogRepository activityLogRepo, NotificationRepository notificationRepo,
                            ScheduledClassRepository scheduledClassRepo, UserRepository userRepo) {
        this.courseRepo = courseRepo;
        this.batchRepo = batchRepo;
        this.studentRepo = studentRepo;
        this.studentBatchRepo = studentBatchRepo;
        this.staffRepo = staffRepo;
        this.feeRepo = feeRepo;
        this.receiptRepo = receiptRepo;
        this.attendanceRepo = attendanceRepo;
        this.settingRepo = settingRepo;
        this.activityLogRepo = activityLogRepo;
        this.notificationRepo = notificationRepo;
        this.scheduledClassRepo = scheduledClassRepo;
        this.userRepo = userRepo;
    }

    // ============ COURSES (Institute_model.php lines 7-33) ============

    public List<Course> getAllCourses() {
        return courseRepo.findAll();
    }

    public Course getCourse(Long id) {
        return courseRepo.findById(id).orElse(null);
    }

    /**
     * Migrated from: Institute_model.php -> save_course() lines 15-33
     */
    @Transactional
    public Long saveCourse(Map<String, Object> data, Long id) {
        Course course;
        if (id != null) {
            course = courseRepo.findById(id).orElse(new Course());
            course.setId(id);
        } else {
            course = new Course();
            course.setCreatedAt(LocalDateTime.now());
        }

        if (data.containsKey("name")) course.setName((String) data.get("name"));
        if (data.containsKey("description")) course.setDescription((String) data.get("description"));
        if (data.containsKey("category")) course.setCategory((String) data.get("category"));
        if (data.containsKey("duration")) course.setDuration((String) data.get("duration"));
        if (data.containsKey("fees")) course.setFees(new BigDecimal(data.get("fees").toString()));
        if (data.containsKey("status")) course.setStatus((String) data.get("status"));
        if (data.containsKey("syllabus_path")) course.setSyllabusPath((String) data.get("syllabus_path"));
        if (data.containsKey("image_path")) course.setImagePath((String) data.get("image_path"));
        if (data.containsKey("course_id")) course.setCourseId((String) data.get("course_id"));
        if (data.containsKey("courseType")) course.setCourseType((String) data.get("courseType"));
        if (data.containsKey("course_type")) course.setCourseType((String) data.get("course_type"));
        if (data.containsKey("feePeriod")) course.setFeePeriod((String) data.get("feePeriod"));
        if (data.containsKey("fee_period")) course.setFeePeriod((String) data.get("fee_period"));
        if (data.containsKey("subjects")) {
            Object subj = data.get("subjects");
            if (subj instanceof String) {
                course.setSubjects((String) subj);
            } else {
                try {
                    course.setSubjects(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(subj));
                } catch (Exception e) {
                    course.setSubjects("[]");
                }
            }
        }

        Course saved = courseRepo.save(course);

        if (id != null) {
            logActivity(0L, "admin", "Course Modified", "Course '" + course.getName() + "' details were updated.");
        } else {
            generateAndAssignCourseId(saved.getId());
            logActivity(0L, "admin", "New Course Added", "Course '" + course.getName() + "' has been created.");
            createNotification(null, "all", "New Course", "New course '" + course.getName() + "' is now available.", "course");
        }

        return saved.getId();
    }

    @Transactional
    public boolean deleteCourse(Long id) {
        Course course = courseRepo.findById(id).orElse(null);
        if (course == null) return false;

        // Clear students association (Institute_model.php line 270)
        List<Student> students = studentRepo.findByCourseId(id);
        for (Student s : students) {
            s.setCourseId(null);
            studentRepo.save(s);
        }

        // Delete batches (Institute_model.php line 273-276)
        List<Batch> batches = batchRepo.findByCourseId(id);
        for (Batch b : batches) {
            deleteBatch(b.getId());
        }

        courseRepo.deleteById(id);
        logActivity(0L, "admin", "Course Deleted", "Course '" + course.getName() + "' was deleted.");
        return true;
    }

    // ============ BATCHES (Institute_model.php lines 36-118) ============

    public List<Map<String, Object>> getAllBatches() {
        syncBatchStatusesAndNotifications();
        List<Batch> batches = batchRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Batch b : batches) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", b.getId());
            map.put("batch_name", b.getBatchName());
            map.put("course_id", b.getCourseId());
            map.put("instructor", b.getInstructor());
            map.put("timing", b.getTiming());
            map.put("start_date", b.getStartDate());
            map.put("status", b.getStatus());
            map.put("subject", b.getSubject());

            // Join course name (Institute_model.php line 37-39)
            Course course = courseRepo.findById(b.getCourseId()).orElse(null);
            map.put("course_name", course != null ? course.getName() : "");

            // Instructor name (resolve from staff or use raw)
            String instructorName = b.getInstructor();
            if (b.getInstructor() != null) {
                try {
                    Long instId = Long.parseLong(b.getInstructor());
                    if (instId >= 1000000) {
                        userRepo.findById(instId - 1000000).ifPresent(u -> {});
                        Optional<User> uOpt = userRepo.findById(instId - 1000000);
                        instructorName = uOpt.map(User::getFullName).orElse(b.getInstructor());
                    } else {
                        Optional<Staff> sOpt = staffRepo.findById(instId);
                        instructorName = sOpt.map(Staff::getName).orElse(b.getInstructor());
                    }
                } catch (NumberFormatException e) {
                    // Keep raw string
                }
            }
            map.put("instructor_name", instructorName);

            // Student count (subquery in original)
            long studentCount = studentRepo.findByBatchId(b.getId()).size();
            map.put("student_count", studentCount);

            result.add(map);
        }
        return result;
    }

    /**
     * Migrated from: Institute_model.php -> save_batch() lines 80-118
     */
    @Transactional
    public Long saveBatch(Map<String, Object> data, Long id) {
        Batch batch;
        if (id != null) {
            batch = batchRepo.findById(id).orElse(new Batch());

            // Handle status transition: completed -> active (line 83-91)
            String newStatus = (String) data.get("status");
            if (newStatus != null && ("ongoing".equals(newStatus) || "upcoming".equals(newStatus))) {
                if ("completed".equals(batch.getStatus())) {
                    List<Student> batchStudents = studentRepo.findByBatchId(id);
                    for (Student s : batchStudents) {
                        if ("completed".equals(s.getStatus())) {
                            s.setStatus("active");
                            studentRepo.save(s);
                        }
                    }
                }
            }
        } else {
            batch = new Batch();
            batch.setCreatedAt(LocalDateTime.now());
        }

        if (data.containsKey("batch_name")) batch.setBatchName((String) data.get("batch_name"));
        if (data.containsKey("course_id")) batch.setCourseId(Long.valueOf(data.get("course_id").toString()));
        if (data.containsKey("instructor")) batch.setInstructor(data.get("instructor") != null ? data.get("instructor").toString() : null);
        if (data.containsKey("timing")) batch.setTiming((String) data.get("timing"));
        if (data.containsKey("start_date") && data.get("start_date") != null) {
            batch.setStartDate(LocalDate.parse(data.get("start_date").toString()));
        }
        if (data.containsKey("status")) batch.setStatus((String) data.get("status"));
        if (data.containsKey("subject")) batch.setSubject((String) data.get("subject"));

        applyAutomaticBatchStatus(batch);

        Batch saved = batchRepo.save(batch);
        ensureBatchStartTodayNotifications(saved);

        // Handle students assignment (line 100-114)
        if (data.containsKey("students") && data.get("students") instanceof List) {
            List<?> studentIds = (List<?>) data.get("students");

            // Duplicate Validation logic
            Course course = courseRepo.findById(saved.getCourseId()).orElse(null);
            boolean isStandard = course != null && "standard".equalsIgnoreCase(course.getCourseType());
            
            for (Object sid : studentIds) {
                Long studentId = Long.valueOf(sid.toString());
                List<StudentBatch> studentBatches = studentBatchRepo.findByStudentId(studentId);
                for (StudentBatch sb : studentBatches) {
                    if (!sb.getBatchId().equals(saved.getId())) {
                        Batch otherBatch = batchRepo.findById(sb.getBatchId()).orElse(null);
                        if (otherBatch != null && otherBatch.getCourseId().equals(saved.getCourseId())) {
                            if (isStandard) {
                                String curSubject = saved.getSubject() != null ? saved.getSubject().trim() : "";
                                String otherSubject = otherBatch.getSubject() != null ? otherBatch.getSubject().trim() : "";
                                if (curSubject.equalsIgnoreCase(otherSubject)) {
                                    Student studentObj = studentRepo.findById(studentId).orElse(null);
                                    String studentName = studentObj != null ? studentObj.getName() : "Student ID " + studentId;
                                    String courseName = course != null ? course.getName() : "Course ID " + saved.getCourseId();
                                    throw new RuntimeException(studentName + " is already assigned to another batch for " 
                                        + courseName + " - " + (curSubject.isEmpty() ? "General" : curSubject) + ".");
                                }
                            } else {
                                // Non-standard course: student can only be in one batch for this course
                                Student studentObj = studentRepo.findById(studentId).orElse(null);
                                String studentName = studentObj != null ? studentObj.getName() : "Student ID " + studentId;
                                String courseName = course != null ? course.getName() : "Course ID " + saved.getCourseId();
                                throw new RuntimeException(studentName + " is already assigned to another batch for " + courseName + ".");
                            }
                        }
                    }
                }
            }

            assignStudentsToBatch(saved.getId(), studentIds);
        }

        logActivity(0L, "admin", id != null ? "Batch Updated" : "New Batch Created",
            "Batch '" + batch.getBatchName() + "' " + (id != null ? "was updated." : "has been created."));

        if (id == null) {
            createNotification(null, "admin", "New Batch", "Batch '" + batch.getBatchName() + "' has been scheduled.", "batch");
            createNotification(null, "staff", "New Batch", "Batch '" + batch.getBatchName() + "' has been scheduled.", "batch");
        }

        return saved.getId();
    }

    private void syncStudentBatchId(Long studentId) {
        studentRepo.findById(studentId).ifPresent(s -> {
            List<StudentBatch> list = studentBatchRepo.findByStudentId(studentId);
            if (list.isEmpty()) {
                s.setBatchId(null);
            } else {
                s.setBatchId(list.get(0).getBatchId());
            }
            studentRepo.save(s);
        });
    }

    /**
     * Migrated from: Institute_model.php -> assign_students_to_batch() lines 120-136
     */
    @Transactional
    public void assignStudentsToBatch(Long batchId, List<?> studentIds) {
        // Find student IDs currently in this batch in the join table
        List<StudentBatch> currentAssocs = studentBatchRepo.findByBatchId(batchId);
        List<Long> oldStudentIds = currentAssocs.stream().map(StudentBatch::getStudentId).collect(Collectors.toList());

        // Reset existing student_batches of this batch
        studentBatchRepo.deleteByBatchId(batchId);

        // Add new associations
        if (studentIds != null && !studentIds.isEmpty()) {
            for (Object sid : studentIds) {
                Long studentId = Long.valueOf(sid.toString());
                StudentBatch sb = StudentBatch.builder()
                        .studentId(studentId)
                        .batchId(batchId)
                        .build();
                studentBatchRepo.save(sb);
            }
        }

        // Sync batchId for all affected students
        Set<Long> affectedStudentIds = new HashSet<>(oldStudentIds);
        if (studentIds != null) {
            for (Object sid : studentIds) {
                affectedStudentIds.add(Long.valueOf(sid.toString()));
            }
        }
        for (Long studentId : affectedStudentIds) {
            syncStudentBatchId(studentId);
        }
    }

    @Transactional
    public boolean deleteBatch(Long id) {
        Batch batch = batchRepo.findById(id).orElse(null);
        if (batch == null) return false;

        // Clear student batch associations for this batch in the join table
        List<StudentBatch> currentAssocs = studentBatchRepo.findByBatchId(id);
        List<Long> studentIds = currentAssocs.stream().map(StudentBatch::getStudentId).collect(Collectors.toList());

        studentBatchRepo.deleteByBatchId(id);

        // Sync legacy batchId for these students
        for (Long studentId : studentIds) {
            syncStudentBatchId(studentId);
        }

        batchRepo.deleteById(id);
        logActivity(0L, "admin", "Batch Deleted", "Batch '" + batch.getBatchName() + "' was deleted.");
        return true;
    }

    // ============ STUDENTS (Institute_model.php lines 148-264) ============

    public Map<String, Object> getPagedStudents(int page, int size, Long batchId, String search, String courseId, String status) {
        syncBatchStatusesAndNotifications();

        List<Student> all = studentRepo.findAllByOrderByRegNumberAsc();

        Set<Long> batchStudentIds = Collections.emptySet();
        if (batchId != null) {
            batchStudentIds = studentBatchRepo.findByBatchId(batchId).stream()
                    .map(StudentBatch::getStudentId)
                    .collect(Collectors.toSet());
        }
        final Set<Long> finalBatchStudentIds = batchStudentIds;

        List<Student> filtered = all.stream().filter(s -> {
            if (batchId != null && !finalBatchStudentIds.contains(s.getId())) {
                return false;
            }
            if (courseId != null && !courseId.trim().isEmpty()) {
                try {
                    Long cId = Long.parseLong(courseId);
                    if (!cId.equals(s.getCourseId())) return false;
                } catch (NumberFormatException e) {
                    if (s.getCourseId() == null || !courseId.equals(String.valueOf(s.getCourseId()))) return false;
                }
            }
            if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
                if (!status.equalsIgnoreCase(s.getStatus())) return false;
            }
            if (search != null && !search.trim().isEmpty()) {
                String q = search.trim().toLowerCase();
                boolean matchesName = s.getName() != null && s.getName().toLowerCase().contains(q);
                boolean matchesMobile = s.getMobile() != null && s.getMobile().toLowerCase().contains(q);
                boolean matchesReg = s.getRegNumber() != null && s.getRegNumber().toLowerCase().contains(q);
                boolean matchesEmail = s.getEmail() != null && s.getEmail().toLowerCase().contains(q);
                if (!matchesName && !matchesMobile && !matchesReg && !matchesEmail) return false;
            }
            return true;
        }).collect(Collectors.toList());

        int totalElements = filtered.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        if (totalPages == 0) totalPages = 1;

        int startIdx = page * size;
        List<Student> pagedList;
        if (startIdx >= totalElements) {
            pagedList = Collections.emptyList();
        } else {
            int endIdx = Math.min(startIdx + size, totalElements);
            pagedList = filtered.subList(startIdx, endIdx);
        }

        List<StudentBatch> allAssocs = studentBatchRepo.findAll();
        Map<Long, List<Long>> studentBatchIdsMap = allAssocs.stream()
                .collect(Collectors.groupingBy(StudentBatch::getStudentId,
                        Collectors.mapping(StudentBatch::getBatchId, Collectors.toList())));

        Map<Long, String> batchSubjectsMap = batchRepo.findAll().stream()
                .filter(b -> b.getSubject() != null)
                .collect(Collectors.toMap(b -> b.getId(), b -> b.getSubject(), (a, b) -> a));

        Map<Long, String> courseNames = courseRepo.findAll().stream()
                .collect(Collectors.toMap(c -> c.getId(), c -> c.getName(), (a, b) -> a));
        Map<Long, String> batchNames = batchRepo.findAll().stream()
                .collect(Collectors.toMap(b -> b.getId(), b -> b.getBatchName(), (a, b) -> a));

        List<Map<String, Object>> resultList = new ArrayList<>();
        for (Student s : pagedList) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getName());
            map.put("mobile", s.getMobile());
            map.put("email", s.getEmail());
            map.put("reg_number", s.getRegNumber());
            map.put("father_name", s.getFatherName());
            map.put("parent_mobile", s.getParentMobile());
            map.put("dob", s.getDob());
            map.put("qualification", s.getQualification());
            map.put("course_id", s.getCourseId());
            
            Long displayedBatchId = batchId != null ? batchId : s.getBatchId();
            map.put("batch_id", displayedBatchId);
            map.put("joining_date", s.getJoiningDate());
            map.put("status", s.getStatus());
            map.put("referred_by", s.getReferredBy());
            map.put("referral_profession", s.getReferralProfession());
            map.put("instructor", s.getInstructor());
            map.put("timing", s.getTiming());
            map.put("start_date", s.getStartDate());
            map.put("photo", s.getPhoto());
            map.put("selected_subjects", s.getSelectedSubjects());
            map.put("subject_allocations", s.getSubjectAllocations());

            List<Long> sBatchIds = studentBatchIdsMap.getOrDefault(s.getId(), Collections.emptyList());
            List<String> sBatchSubjects = sBatchIds.stream()
                    .map(bid -> batchSubjectsMap.get(bid))
                    .filter(sub -> sub != null)
                    .collect(Collectors.toList());

            map.put("batch_ids", sBatchIds);
            map.put("batch_subjects", sBatchSubjects);

            if (s.getCourseId() != null) {
                map.put("course_name", courseNames.get(s.getCourseId()));
            }
            if (displayedBatchId != null && displayedBatchId != 0L) {
                map.put("batch_name", batchNames.get(displayedBatchId));
            }

            List<Fee> fees = feeRepo.findByStudentId(s.getId());
            if (!fees.isEmpty()) map.put("fee_status", fees.get(0).getStatus());
            if (!map.containsKey("fee_status")) map.put("fee_status", "pending");

            resultList.add(map);
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("content", resultList);
        response.put("totalElements", totalElements);
        response.put("totalPages", totalPages);
        response.put("currentPage", page + 1);
        response.put("pageSize", size);
        return response;
    }

    public List<Map<String, Object>> getAllStudents() {
        return getAllStudents(null);
    }

    public List<Map<String, Object>> getAllStudents(Long batchId) {
        syncBatchStatusesAndNotifications();
        List<Student> students = studentRepo.findAllByOrderByRegNumberAsc();
        
        Set<Long> batchStudentIds = Collections.emptySet();
        if (batchId != null) {
            batchStudentIds = studentBatchRepo.findByBatchId(batchId).stream()
                    .map(StudentBatch::getStudentId)
                    .collect(Collectors.toSet());
        }

        List<StudentBatch> allAssocs = studentBatchRepo.findAll();
        Map<Long, List<Long>> studentBatchIdsMap = allAssocs.stream()
                .collect(Collectors.groupingBy(StudentBatch::getStudentId,
                        Collectors.mapping(StudentBatch::getBatchId, Collectors.toList())));

        Map<Long, String> batchSubjectsMap = batchRepo.findAll().stream()
                .filter(b -> b.getSubject() != null)
                .collect(Collectors.toMap(b -> b.getId(), b -> b.getSubject(), (a, b) -> a));

        Map<Long, String> batchNames = batchRepo.findAll().stream()
                .collect(Collectors.toMap(b -> b.getId(), b -> b.getBatchName(), (a, b) -> a));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Student s : students) {
            if (batchId != null && !batchStudentIds.contains(s.getId())) {
                continue;
            }

            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("name", s.getName());
            map.put("mobile", s.getMobile());
            map.put("email", s.getEmail());
            map.put("reg_number", s.getRegNumber());
            map.put("father_name", s.getFatherName());
            map.put("parent_mobile", s.getParentMobile());
            map.put("dob", s.getDob());
            map.put("qualification", s.getQualification());
            map.put("course_id", s.getCourseId());
            
            Long displayedBatchId = batchId != null ? batchId : s.getBatchId();
            map.put("batch_id", displayedBatchId);
            map.put("joining_date", s.getJoiningDate());
            map.put("status", s.getStatus());
            map.put("referred_by", s.getReferredBy());
            map.put("referral_profession", s.getReferralProfession());
            map.put("instructor", s.getInstructor());
            map.put("timing", s.getTiming());
            map.put("start_date", s.getStartDate());
            map.put("photo", s.getPhoto());
            map.put("selected_subjects", s.getSelectedSubjects());
            map.put("subject_allocations", s.getSubjectAllocations());

            List<Long> sBatchIds = studentBatchIdsMap.getOrDefault(s.getId(), Collections.emptyList());
            List<String> sBatchSubjects = sBatchIds.stream()
                    .map(bid -> batchSubjectsMap.get(bid))
                    .filter(sub -> sub != null)
                    .collect(Collectors.toList());

            map.put("batch_ids", sBatchIds);
            map.put("batch_subjects", sBatchSubjects);

            // Course name join (Institute_model.php line 150-152)
            if (s.getCourseId() != null) {
                courseRepo.findById(s.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
            }
            // Batch name join
            if (displayedBatchId != null && displayedBatchId != 0L) {
                batchRepo.findById(displayedBatchId).ifPresent(b -> {
                    String currentTenant = com.institute.tenant.TenantContext.getTenantId();
                    if (currentTenant == null || "DEFAULT".equalsIgnoreCase(currentTenant) || currentTenant.equals(b.getTenantId())) {
                        map.put("batch_name", b.getBatchName());
                    }
                });
            }
            // Fee status join
            List<Fee> fees = feeRepo.findByStudentId(s.getId());
            if (!fees.isEmpty()) map.put("fee_status", fees.get(0).getStatus());
            if (!map.containsKey("fee_status")) map.put("fee_status", "pending");

            // Instructor name
            String instructorName = s.getInstructor();
            if (s.getInstructor() != null) {
                try {
                    Long instId = Long.parseLong(s.getInstructor());
                    Optional<Staff> sOpt = staffRepo.findById(instId);
                    instructorName = sOpt.map(Staff::getName).orElse(s.getInstructor());
                } catch (NumberFormatException e) { }
            }
            map.put("instructor_name", instructorName);

            result.add(map);
        }
        return result;
    }

    /**
     * Migrated from: Institute_model.php -> save_student() lines 167-217
     */
    @Transactional
    public Long saveStudent(Map<String, Object> data, Long id) {
        // Handle batch_id '0' as NULL (line 177-179)
        if (data.containsKey("batch_id")) {
            Object batchId = data.get("batch_id");
            if (batchId == null || "0".equals(batchId.toString()) || "".equals(batchId.toString())) {
                data.put("batch_id", null);
            }
        }

        // Upsert by reg_number (line 182-187)
        if (id == null && data.containsKey("reg_number") && data.get("reg_number") != null) {
            String regNumber = data.get("reg_number").toString();
            if (!regNumber.isEmpty()) {
                Optional<Student> existing = studentRepo.findByRegNumber(regNumber);
                if (existing.isPresent()) {
                    id = existing.get().getId();
                }
            }
        }

        Student student;
        boolean isNew = (id == null);

        // Feature: Validate Duplicate Reg Number (Don't Allow)
        if (data.containsKey("reg_number") && data.get("reg_number") != null && !data.get("reg_number").toString().isEmpty()) {
            String regNumber = data.get("reg_number").toString();
            Optional<Student> existingWithReg = studentRepo.findByRegNumber(regNumber);
            if (existingWithReg.isPresent()) {
                if (isNew || !existingWithReg.get().getId().equals(id)) {
                    throw new RuntimeException("Registration Number '" + regNumber + "' already exists for another student.");
                }
            }
        }

        if (id != null) {
            student = studentRepo.findById(id).orElse(new Student());
        } else {
            student = new Student();
            student.setCreatedAt(LocalDateTime.now());
        }

        if (data.containsKey("name")) student.setName((String) data.get("name"));
        if (data.containsKey("mobile")) student.setMobile((String) data.get("mobile"));
        if (data.containsKey("email")) student.setEmail((String) data.get("email"));
        if (data.containsKey("father_name")) student.setFatherName((String) data.get("father_name"));
        if (data.containsKey("parent_mobile")) student.setParentMobile((String) data.get("parent_mobile"));
        if (data.containsKey("qualification")) student.setQualification((String) data.get("qualification"));
        if (data.containsKey("referred_by")) student.setReferredBy((String) data.get("referred_by"));
        if (data.containsKey("referral_profession")) student.setReferralProfession((String) data.get("referral_profession"));
        if (data.containsKey("status")) student.setStatus((String) data.get("status"));
        if (data.containsKey("reg_number") && data.get("reg_number") != null) {
            student.setRegNumber(data.get("reg_number").toString());
        }
        if (data.containsKey("course_id") && data.get("course_id") != null) {
            student.setCourseId(Long.valueOf(data.get("course_id").toString()));
        }
        if (data.containsKey("batch_id") && data.get("batch_id") != null) {
            student.setBatchId(Long.valueOf(data.get("batch_id").toString()));
        } else if (data.containsKey("batch_id")) {
            student.setBatchId(null);
        }
        if (data.containsKey("dob") && data.get("dob") != null && !data.get("dob").toString().isEmpty()) {
            student.setDob(LocalDate.parse(data.get("dob").toString()));
        }
        if (data.containsKey("joining_date") && data.get("joining_date") != null && !data.get("joining_date").toString().isEmpty()) {
            student.setJoiningDate(LocalDate.parse(data.get("joining_date").toString()));
        }
        if (data.containsKey("photo")) {
            student.setPhoto((String) data.get("photo"));
        }
        if (data.containsKey("selectedSubjects")) {
            Object selSub = data.get("selectedSubjects");
            if (selSub instanceof String) {
                student.setSelectedSubjects((String) selSub);
            } else {
                try {
                    student.setSelectedSubjects(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(selSub));
                } catch (Exception e) {
                    student.setSelectedSubjects("[]");
                }
            }
        }
        if (data.containsKey("selected_subjects")) {
            Object selSub = data.get("selected_subjects");
            if (selSub instanceof String) {
                student.setSelectedSubjects((String) selSub);
            } else {
                try {
                    student.setSelectedSubjects(new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(selSub));
                } catch (Exception e) {
                    student.setSelectedSubjects("[]");
                }
            }
        }

        Student saved = studentRepo.save(student);

        // Sync student_batches join table
        if (data.containsKey("batch_id")) {
            Long newBatchId = saved.getBatchId();
            if (newBatchId == null) {
                studentBatchRepo.deleteByStudentId(saved.getId());
            } else {
                Batch newBatchObj = batchRepo.findById(newBatchId).orElse(null);
                if (newBatchObj != null) {
                    String newSubject = newBatchObj.getSubject();
                    // Find all batches the student is currently associated with
                    List<StudentBatch> currentAssocs = studentBatchRepo.findByStudentId(saved.getId());
                    for (StudentBatch assoc : currentAssocs) {
                        if (!assoc.getBatchId().equals(newBatchId)) {
                            // If the other batch is for the SAME subject, remove it
                            Batch otherBatch = batchRepo.findById(assoc.getBatchId()).orElse(null);
                            if (otherBatch != null && otherBatch.getSubject() != null && newSubject != null
                                    && otherBatch.getSubject().trim().equalsIgnoreCase(newSubject.trim())) {
                                studentBatchRepo.delete(assoc);
                            }
                        }
                    }
                }
                // Add the new one if not present
                if (!studentBatchRepo.findByStudentIdAndBatchId(saved.getId(), newBatchId).isPresent()) {
                    studentBatchRepo.save(StudentBatch.builder()
                            .studentId(saved.getId())
                            .batchId(newBatchId)
                            .build());
                }
            }
        }

        if (isNew) {
            if (saved.getRegNumber() != null && !saved.getRegNumber().isBlank()) {
                advanceRegSequenceForSubmittedValue(saved.getRegNumber());
            }

            // Auto-assign register number (line 199)
            generateAndAssignReg(saved.getId());

            // Auto create initial fee record (line 201-210)
            if (saved.getCourseId() != null) {
                Course course = courseRepo.findById(saved.getCourseId()).orElse(null);
                if (course != null) {
                    BigDecimal baseFee = course.getFees() != null ? course.getFees() : BigDecimal.ZERO;
                    
                    if ("standard".equalsIgnoreCase(course.getCourseType()) && saved.getSelectedSubjects() != null && !saved.getSelectedSubjects().isEmpty()) {
                        try {
                            java.util.List<String> selectedNames = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                                saved.getSelectedSubjects(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {}
                            );
                            
                            java.util.List<java.util.Map<String, Object>> courseSubjects = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                                course.getSubjects(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {}
                            );
                            
                            BigDecimal selectedSum = BigDecimal.ZERO;
                            for (java.util.Map<String, Object> sub : courseSubjects) {
                                String name = (String) sub.get("name");
                                if (selectedNames.contains(name)) {
                                    selectedSum = selectedSum.add(new BigDecimal(sub.get("fees").toString()));
                                }
                            }
                            baseFee = selectedSum;
                        } catch (Exception e) {
                            // fallback to course.getFees()
                        }
                    }

                    int units = parseDurationUnits(course.getDuration(), course.getFeePeriod());
                    BigDecimal totalFee = baseFee.multiply(new BigDecimal(units));

                    Fee fee = Fee.builder()
                        .studentId(saved.getId())
                        .totalAmount(totalFee)
                        .paidAmount(BigDecimal.ZERO)
                        .balanceAmount(totalFee)
                        .status("pending")
                        .build();
                    feeRepo.save(fee);
                }
            }

            logActivity(0L, "admin", "New Student Added", "Student '" + saved.getName() + "' has been enrolled.");
            String courseName = saved.getCourseId() != null ?
                courseRepo.findById(saved.getCourseId()).map(Course::getName).orElse("course") : "course";
            
            // Notify both Admin and Staff
            createNotification(null, "admin", "New Enrollment", "Student '" + saved.getName() + "' enrolled in " + courseName, "enrollment");
            createNotification(null, "staff", "New Enrollment", "Student '" + saved.getName() + "' enrolled in " + courseName, "enrollment");
        } else {
            logActivity(0L, "admin", "Student Updated", "Student '" + saved.getName() + "' profile was updated.");
        }

        return saved.getId();
    }

    /**
     * Migrated from: Institute_model.php -> delete_student() lines 219-264
     */
    @Transactional
    public String deleteStudent(Long id) {
        Student student = studentRepo.findById(id).orElse(null);
        if (student == null) return "error:Student not found";

        // Feature: Don't allow delete if appended to course/batch/fees/attendance
        //if (student.getCourseId() != null) return "error:Cannot delete student assigned to a course.";
        if (student.getBatchId() != null) return "error:Cannot delete student assigned to a batch.";
        
        List<Fee> fees = feeRepo.findByStudentId(id);
        boolean hasPaidFeeHistory = fees.stream()
            .anyMatch(fee -> fee.getPaidAmount() != null && fee.getPaidAmount().compareTo(BigDecimal.ZERO) > 0);
        long receiptCount = receiptRepo.findByStudentIdOrderByPaymentDateDesc(id).size();
        if (hasPaidFeeHistory || receiptCount > 0) {
            return "error:Cannot delete student with payment records.";
        }

        long attendanceCount = attendanceRepo.findByStudentIdOrderByAttendanceDateDesc(id).size();
        if (attendanceCount > 0) return "error:Cannot delete student with attendance records.";

        if (!fees.isEmpty()) {
            feeRepo.deleteByStudentId(id);
        }

        studentRepo.deleteById(id);
        logActivity(0L, "admin", "Student Deleted", "Student '" + student.getName() + "' was deleted.");
        return "success";
    }

    // ============ STAFF (Institute_model.php lines 851-1192) ============

    /**
     * Migrated from: Institute_model.php -> get_all_staff() lines 917-956
     * Original: Returns staff + admin users combined list
     */
    public List<Map<String, Object>> getAllStaff() {
        List<Map<String, Object>> result = new ArrayList<>();

        // Real staff
        List<Staff> staffList = staffRepo.findAll();
        for (Staff s : staffList) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("staff_id", s.getStaffId());
            map.put("name", s.getName());
            map.put("email", s.getEmail());
            map.put("mobile", s.getMobile());
            map.put("qualification", s.getQualification());
            map.put("experience", s.getExperience());
            map.put("designation", s.getDesignation());
            map.put("joining_date", s.getJoiningDate());
            map.put("status", s.getStatus());
            map.put("salary", s.getSalary());
            map.put("photo", s.getPhoto());
            map.put("is_admin_staff", false);
            result.add(map);
        }

        // Admin users as staff (Institute_model.php lines 926-953)
        List<User> admins = userRepo.findAdminUsers();
        for (User a : admins) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", 1000000 + a.getId());
            map.put("staff_id", "ADM" + a.getId());
            map.put("name", a.getFullName());
            map.put("email", a.getEmail());
            map.put("mobile", "0000000000");
            map.put("qualification", "Admin");
            map.put("experience", "N/A");
            map.put("designation", a.getRole() != null ? a.getRole().getRoleName() : "Admin");
            map.put("joining_date", LocalDate.now());
            map.put("status", "active");
            map.put("salary", 0);
            map.put("is_admin_staff", true);
            result.add(map);
        }

        return result;
    }

    /**
     * Migrated from: Institute_model.php -> save_staff() lines 1156-1182
     */
    @Transactional
    public Long saveStaff(Map<String, Object> data, Long id) {
        Staff staff;
        boolean isNew = (id == null || "undefined".equals(id.toString()) || "null".equals(id.toString()));

        if (!isNew) {
            staff = staffRepo.findById(id).orElse(new Staff());
        } else {
            staff = new Staff();
            staff.setCreatedAt(LocalDateTime.now());
        }

        if (data.containsKey("name")) staff.setName((String) data.get("name"));
        if (data.containsKey("email")) staff.setEmail((String) data.get("email"));
        if (data.containsKey("mobile")) staff.setMobile((String) data.get("mobile"));
        if (data.containsKey("qualification")) staff.setQualification((String) data.get("qualification"));
        if (data.containsKey("experience")) staff.setExperience((String) data.get("experience"));
        if (data.containsKey("designation")) staff.setDesignation((String) data.get("designation"));
        if (data.containsKey("status")) staff.setStatus((String) data.get("status"));
        if (data.containsKey("photo")) staff.setPhoto((String) data.get("photo"));
        if (data.containsKey("salary") && data.get("salary") != null) {
            staff.setSalary(new BigDecimal(data.get("salary").toString()));
        }
        if (data.containsKey("joining_date") && data.get("joining_date") != null && !data.get("joining_date").toString().isEmpty()) {
            staff.setJoiningDate(LocalDate.parse(data.get("joining_date").toString()));
        }

        Staff saved = staffRepo.save(staff);

        if (isNew) {
            generateAndAssignStaffId(saved.getId());
            logActivity(0L, "admin", "New Staff Added", "Staff member '" + saved.getName() + "' has been added.");
            createNotification(null, "admin", "New Staff", "Staff member '" + saved.getName() + "' joined the team.", "staff");
            createNotification(null, "staff", "New Staff", "Staff member '" + saved.getName() + "' joined the team.", "staff");
        } else {
            logActivity(0L, "admin", "Staff Updated", "Staff member '" + saved.getName() + "' profile was updated.");
        }

        return saved.getId();
    }

    public boolean deleteStaff(Long id) {
        Staff staff = staffRepo.findById(id).orElse(null);
        if (staff == null) return false;
        staffRepo.deleteById(id);
        logActivity(0L, "admin", "Staff Deleted", "Staff '" + staff.getName() + "' was deleted.");
        return true;
    }

    // ============ SETTINGS (Institute_model.php lines 327-341) ============

    @Transactional
    public InstituteSetting getCurrentTenantSettings() {
        String currentTenant = com.institute.tenant.TenantContext.getTenantId();
        if (currentTenant != null && !"DEFAULT".equals(currentTenant) && !"SYSTEM".equals(currentTenant)) {
            settingRepo.fixLegacyTenants(currentTenant);
        }
        List<InstituteSetting> list = settingRepo.findAll();
        if (!list.isEmpty()) {
            return list.get(0);
        }
        // Create brand new settings record for this tenant starting from 1
        InstituteSetting s = InstituteSetting.builder()
            .name(currentTenant != null ? currentTenant : "Institute")
            .instituteName(currentTenant != null ? currentTenant : "Institute")
            .tenantId(currentTenant != null ? currentTenant : "DEFAULT")
            .regPrefix("STU")
            .regStartFrom("1")
            .regLastNumber("0")
            .regMode("auto")
            .staffIdPrefix("STF")
            .staffIdStartFrom("1")
            .staffIdLastNumber("0")
            .staffIdMode("auto")
            .courseIdPrefix("CRS")
            .courseIdStartFrom("1")
            .courseIdLastNumber("0")
            .courseIdMode("auto")
            .build();
        return settingRepo.save(s);
    }

    @Transactional
    public InstituteSetting getSettings() {
        return getCurrentTenantSettings();
    }

    private static Integer parseBooleanInt(Object raw) {
        if (raw == null) return null;
        if (raw instanceof Number n) return n.intValue();
        String s = raw.toString().trim();
        if (s.isEmpty()) return null;
        if ("true".equalsIgnoreCase(s) || "on".equalsIgnoreCase(s) || "yes".equalsIgnoreCase(s)) return 1;
        if ("false".equalsIgnoreCase(s) || "off".equalsIgnoreCase(s) || "no".equalsIgnoreCase(s)) return 0;
        try {
            return Integer.valueOf(s);
        } catch (NumberFormatException e) {
            // Unknown input; safest default is disabled rather than enabling a feature unexpectedly.
            return 0;
        }
    }

    @Transactional
    public void updateSettings(Map<String, Object> data) {
        InstituteSetting settings = getCurrentTenantSettings();

        if (data.containsKey("name") && data.get("name") != null) settings.setName(data.get("name").toString());
        if (data.containsKey("institute_name") && data.get("institute_name") != null) {
            String instName = data.get("institute_name").toString();
            settings.setInstituteName(instName);
            settings.setName(instName); // Ensure the non-null name field is also updated
        }
        if (data.containsKey("email")) settings.setEmail(data.get("email") != null ? data.get("email").toString() : null);
        if (data.containsKey("phone")) settings.setPhone(data.get("phone") != null ? data.get("phone").toString() : null);
        if (data.containsKey("address")) settings.setAddress(data.get("address") != null ? data.get("address").toString() : null);
        if (data.containsKey("logo_path")) settings.setLogoPath(data.get("logo_path") != null ? data.get("logo_path").toString() : null);
        if (data.containsKey("registration_id")) settings.setRegistrationId(data.get("registration_id") != null ? data.get("registration_id").toString() : null);
        if (data.containsKey("reg_prefix")) settings.setRegPrefix(data.get("reg_prefix") != null ? data.get("reg_prefix").toString() : null);
        if (data.containsKey("reg_suffix")) settings.setRegSuffix(data.get("reg_suffix") != null ? data.get("reg_suffix").toString() : null);
        if (data.containsKey("reg_start_from")) settings.setRegStartFrom(data.get("reg_start_from") != null ? data.get("reg_start_from").toString() : null);
        if (data.containsKey("reg_mode")) settings.setRegMode(data.get("reg_mode") != null ? data.get("reg_mode").toString() : null);
        if (data.containsKey("reg_last_number")) settings.setRegLastNumber(data.get("reg_last_number") != null ? data.get("reg_last_number").toString() : null);
        if (data.containsKey("staff_id_prefix")) settings.setStaffIdPrefix(data.get("staff_id_prefix") != null ? data.get("staff_id_prefix").toString() : null);
        if (data.containsKey("staff_id_suffix")) settings.setStaffIdSuffix(data.get("staff_id_suffix") != null ? data.get("staff_id_suffix").toString() : null);
        if (data.containsKey("staff_id_start_from")) settings.setStaffIdStartFrom(data.get("staff_id_start_from") != null ? data.get("staff_id_start_from").toString() : null);
        if (data.containsKey("staff_id_mode")) settings.setStaffIdMode(data.get("staff_id_mode") != null ? data.get("staff_id_mode").toString() : null);
        if (data.containsKey("staff_id_last_number")) settings.setStaffIdLastNumber(data.get("staff_id_last_number") != null ? data.get("staff_id_last_number").toString() : null);
        if (data.containsKey("course_id_prefix")) settings.setCourseIdPrefix(data.get("course_id_prefix") != null ? data.get("course_id_prefix").toString() : null);
        if (data.containsKey("course_id_suffix")) settings.setCourseIdSuffix(data.get("course_id_suffix") != null ? data.get("course_id_suffix").toString() : null);
        if (data.containsKey("course_id_start_from")) settings.setCourseIdStartFrom(data.get("course_id_start_from") != null ? data.get("course_id_start_from").toString() : null);
        if (data.containsKey("course_id_mode")) settings.setCourseIdMode(data.get("course_id_mode") != null ? data.get("course_id_mode").toString() : null);
        if (data.containsKey("course_id_last_number")) settings.setCourseIdLastNumber(data.get("course_id_last_number") != null ? data.get("course_id_last_number").toString() : null);
        if (data.containsKey("appearance_color")) settings.setAppearanceColor(data.get("appearance_color") != null ? data.get("appearance_color").toString() : null);
        if (data.containsKey("appearance_mode")) settings.setAppearanceMode(data.get("appearance_mode") != null ? data.get("appearance_mode").toString() : null);

        Object adminAsStaffRaw = null;
        if (data.containsKey("adminAsStaff")) adminAsStaffRaw = data.get("adminAsStaff");
        if (adminAsStaffRaw == null && data.containsKey("admin_as_staff")) adminAsStaffRaw = data.get("admin_as_staff");
        if (adminAsStaffRaw != null) settings.setAdminAsStaff(parseBooleanInt(adminAsStaffRaw));

        Object allowPerfExamsRaw = null;
        if (data.containsKey("allowPerformanceExams")) allowPerfExamsRaw = data.get("allowPerformanceExams");
        if (allowPerfExamsRaw == null && data.containsKey("allow_performance_exams")) allowPerfExamsRaw = data.get("allow_performance_exams");
        if (allowPerfExamsRaw != null) settings.setAllowPerformanceExams(parseBooleanInt(allowPerfExamsRaw));

        // The frontend historically sends snake_case; keep supporting camelCase too.
        Object enableBranchesRaw = null;
        if (data.containsKey("enableMultipleBranches")) enableBranchesRaw = data.get("enableMultipleBranches");
        if (enableBranchesRaw == null && data.containsKey("enable_multiple_branches")) enableBranchesRaw = data.get("enable_multiple_branches");
        if (enableBranchesRaw != null) settings.setEnableMultipleBranches(parseBooleanInt(enableBranchesRaw));

        Object enableStdCoursesRaw = null;
        if (data.containsKey("enableStandardCourses")) enableStdCoursesRaw = data.get("enableStandardCourses");
        if (enableStdCoursesRaw == null && data.containsKey("enable_standard_courses")) enableStdCoursesRaw = data.get("enable_standard_courses");
        if (enableStdCoursesRaw != null) settings.setEnableStandardCourses(parseBooleanInt(enableStdCoursesRaw));

        settings.setUpdatedAt(LocalDateTime.now());
        settingRepo.save(settings);
    }

    // ============ AUTO-ID GENERATION (Institute_model.php lines 750-849) ============

    /**
     * Migrated from: Institute_model.php -> generate_and_assign_reg() lines 766-785
     */
    @Transactional
    public void generateAndAssignReg(Long studentId) {
        Student student = studentRepo.findById(studentId).orElse(null);
        if (student == null || (student.getRegNumber() != null && !student.getRegNumber().isEmpty())) return;

        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || !"auto".equals(settings.getRegMode())) return;

        String prefix = settings.getRegPrefix() != null ? settings.getRegPrefix() : "STU";
        String suffix = settings.getRegSuffix() != null ? settings.getRegSuffix() : "";
        int start = settings.getRegStartFrom() != null ? Integer.parseInt(settings.getRegStartFrom()) : 1;
        int last = settings.getRegLastNumber() != null ? Integer.parseInt(settings.getRegLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);
        String padded = String.format("%03d", next);
        String reg = (prefix + "-" + padded + (suffix.isEmpty() ? "" : "-" + suffix)).trim();

        student.setRegNumber(reg);
        studentRepo.save(student);
        settings.setRegLastNumber(String.valueOf(next));
        settingRepo.save(settings);
    }

    @Transactional
    public void advanceRegSequenceForSubmittedValue(String submittedRegNumber) {
        if (submittedRegNumber == null || submittedRegNumber.isBlank()) return;

        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || settings.getRegMode() == null || !"auto".equalsIgnoreCase(settings.getRegMode())) return;

        String expectedNext = getNextRegNumber();
        if (!submittedRegNumber.trim().equals(expectedNext)) return;

        int start = settings.getRegStartFrom() != null ? Integer.parseInt(settings.getRegStartFrom()) : 1;
        int last = settings.getRegLastNumber() != null ? Integer.parseInt(settings.getRegLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);

        settings.setRegLastNumber(String.valueOf(next));
        settingRepo.save(settings);
    }

    /**
     * Migrated from: Institute_model.php -> generate_and_assign_staff_id() lines 801-817
     */
    @Transactional
    public void generateAndAssignStaffId(Long staffDbId) {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || !"auto".equals(settings.getStaffIdMode())) return;

        String prefix = settings.getStaffIdPrefix() != null ? settings.getStaffIdPrefix() : "STF";
        String suffix = settings.getStaffIdSuffix() != null ? settings.getStaffIdSuffix() : "";
        int start = settings.getStaffIdStartFrom() != null ? Integer.parseInt(settings.getStaffIdStartFrom()) : 1;
        int last = settings.getStaffIdLastNumber() != null ? Integer.parseInt(settings.getStaffIdLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);
        String padded = String.format("%03d", next);
        String idStr = (prefix + "-" + padded + (suffix.isEmpty() ? "" : "-" + suffix)).trim();

        Staff staff = staffRepo.findById(staffDbId).orElse(null);
        if (staff != null) {
            staff.setStaffId(idStr);
            staffRepo.save(staff);
        }
        settings.setStaffIdLastNumber(String.valueOf(next));
        settingRepo.save(settings);
    }

    /**
     * Migrated from: Institute_model.php -> generate_and_assign_course_id() lines 833-849
     */
    @Transactional
    public void generateAndAssignCourseId(Long courseDbId) {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || !"auto".equals(settings.getCourseIdMode())) return;

        String prefix = settings.getCourseIdPrefix() != null ? settings.getCourseIdPrefix() : "CRS";
        String suffix = settings.getCourseIdSuffix() != null ? settings.getCourseIdSuffix() : "";
        int start = settings.getCourseIdStartFrom() != null ? Integer.parseInt(settings.getCourseIdStartFrom()) : 1;
        int last = settings.getCourseIdLastNumber() != null ? Integer.parseInt(settings.getCourseIdLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);
        String padded = String.format("%03d", next);
        String idStr = (prefix + "-" + padded + (suffix.isEmpty() ? "" : "-" + suffix)).trim();

        Course course = courseRepo.findById(courseDbId).orElse(null);
        if (course != null) {
            course.setCourseId(idStr);
            courseRepo.save(course);
        }
        settings.setCourseIdLastNumber(String.valueOf(next));
        settingRepo.save(settings);
    }

    public String getNextRegNumber() {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null) return "REG-001";
        String prefix = settings.getRegPrefix() != null ? settings.getRegPrefix() : "STU";
        String suffix = settings.getRegSuffix() != null ? settings.getRegSuffix() : "";
        int start = settings.getRegStartFrom() != null ? Integer.parseInt(settings.getRegStartFrom()) : 1;
        int last = settings.getRegLastNumber() != null ? Integer.parseInt(settings.getRegLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);
        return (prefix + "-" + String.format("%03d", next) + (suffix.isEmpty() ? "" : "-" + suffix)).trim();
    }

    public String getNextStaffId() {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null) return "STF-001";
        String prefix = settings.getStaffIdPrefix() != null ? settings.getStaffIdPrefix() : "STF";
        String suffix = settings.getStaffIdSuffix() != null ? settings.getStaffIdSuffix() : "";
        int start = settings.getStaffIdStartFrom() != null ? Integer.parseInt(settings.getStaffIdStartFrom()) : 1;
        int last = settings.getStaffIdLastNumber() != null ? Integer.parseInt(settings.getStaffIdLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);
        return (prefix + "-" + String.format("%03d", next) + (suffix.isEmpty() ? "" : "-" + suffix)).trim();
    }

    public String getNextCourseId() {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null) return "CRS-001";
        String prefix = settings.getCourseIdPrefix() != null ? settings.getCourseIdPrefix() : "CRS";
        String suffix = settings.getCourseIdSuffix() != null ? settings.getCourseIdSuffix() : "";
        int start = settings.getCourseIdStartFrom() != null ? Integer.parseInt(settings.getCourseIdStartFrom()) : 1;
        int last = settings.getCourseIdLastNumber() != null ? Integer.parseInt(settings.getCourseIdLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);
        return (prefix + "-" + String.format("%03d", next) + (suffix.isEmpty() ? "" : "-" + suffix)).trim();
    }

    // ============ NOTIFICATIONS & ACTIVITY (Institute_model.php lines 485-517) ============

    public void logActivity(Long userId, String userType, String action, String description) {
        ActivityLog log = ActivityLog.builder()
            .userId(userId)
            .userType(userType)
            .action(action)
            .description(description)
            .createdAt(LocalDateTime.now())
            .build();
        activityLogRepo.save(log);
    }

    public void createNotification(Long userId, String userType, String title, String message, String type) {
        Notification notification = Notification.builder()
            .userId(userId)
            .userType(userType)
            .title(title)
            .message(message)
            .type(type)
            .isRead(0)
            .createdAt(LocalDateTime.now())
            .build();
        notificationRepo.save(notification);
    }

    public List<Notification> getUserNotifications(Long userId, String userType) {
        syncBatchStatusesAndNotifications();
        return notificationRepo.findUserNotifications(userId, userType);
    }

    @Transactional
    public void markNotificationsRead(Long userId, String userType) {
        List<Notification> notifications = notificationRepo.findUserNotifications(userId, userType);
        for (Notification notification : notifications) {
            if (!Objects.equals(notification.getIsRead(), 1)) {
                notification.setIsRead(1);
            }
        }
        notificationRepo.saveAll(notifications);
    }

    @Transactional
    protected void syncBatchStatusesAndNotifications() {
        LocalDate today = LocalDate.now();
        List<Batch> batches = batchRepo.findAll();
        for (Batch batch : batches) {
            boolean changed = applyAutomaticBatchStatus(batch);
            if (changed) {
                batchRepo.save(batch);
            }
            ensureBatchStartTodayNotifications(batch);
        }
    }

    private boolean applyAutomaticBatchStatus(Batch batch) {
        if (batch == null || batch.getStartDate() == null) {
            return false;
        }

        String currentStatus = batch.getStatus() != null ? batch.getStatus().toLowerCase() : "";
        if ("completed".equals(currentStatus)) {
            return false;
        }

        if (!batch.getStartDate().isAfter(LocalDate.now()) && "upcoming".equals(currentStatus)) {
            batch.setStatus("ongoing");
            return true;
        }

        return false;
    }

    private void ensureBatchStartTodayNotifications(Batch batch) {
        if (batch == null || batch.getStartDate() == null || !batch.getStartDate().equals(LocalDate.now())) {
            return;
        }

        Course course = courseRepo.findById(batch.getCourseId()).orElse(null);
        String courseName = course != null ? course.getName() : "Course";
        String title = "Batch Starting Today";
        String message = "Batch '" + batch.getBatchName() + "' for " + courseName + " starts today.";

        userRepo.findAdminUsers().forEach(user ->
            createNotificationOncePerDay(user.getId(), "user", title, message, "batch")
        );

        staffRepo.findAll().forEach(staff ->
            createNotificationOncePerDay(staff.getId(), "staff", title, message, "batch")
        );
    }

    private void createNotificationOncePerDay(Long userId, String userType, String title, String message, String type) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusNanos(1);
        boolean exists = notificationRepo.existsByUserIdAndUserTypeAndTitleAndMessageAndTypeAndCreatedAtBetween(
            userId, userType, title, message, type, startOfDay, endOfDay
        );
        if (!exists) {
            createNotification(userId, userType, title, message, type);
        }
    }

    // ============ SEARCH (Institute_model.php lines 519-592) ============

    public List<Map<String, Object>> searchAll(String query) {
        List<Map<String, Object>> results = new ArrayList<>();
        String q = query.toLowerCase();

        // Search students
        studentRepo.findAll().stream()
            .filter(s -> (s.getName() != null && s.getName().toLowerCase().contains(q)) ||
                         (s.getRegNumber() != null && s.getRegNumber().toLowerCase().contains(q)) ||
                         (s.getMobile() != null && s.getMobile().contains(q)))
            .forEach(s -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", s.getId());
                map.put("name", s.getName());
                map.put("code", s.getRegNumber());
                map.put("type", "student");
                map.put("path", "/students");
                results.add(map);
            });

        // Search staff
        staffRepo.findAll().stream()
            .filter(s -> (s.getName() != null && s.getName().toLowerCase().contains(q)) ||
                         (s.getStaffId() != null && s.getStaffId().toLowerCase().contains(q)) ||
                         (s.getMobile() != null && s.getMobile().contains(q)))
            .forEach(s -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", s.getId());
                map.put("name", s.getName());
                map.put("code", s.getStaffId());
                map.put("type", "staff");
                map.put("path", "/staff");
                results.add(map);
            });

        // Search courses
        courseRepo.findAll().stream()
            .filter(c -> (c.getName() != null && c.getName().toLowerCase().contains(q)) ||
                         (c.getCourseId() != null && c.getCourseId().toLowerCase().contains(q)))
            .forEach(c -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", c.getId());
                map.put("name", c.getName());
                map.put("code", c.getCourseId());
                map.put("type", "course");
                map.put("path", "/courses");
                results.add(map);
            });

        return results;
    }

    // ============ MARK COMPLETED (Institute_model.php lines 722-748) ============

    @Transactional
    public boolean markStudentsCompleted(Map<String, Object> filters) {
        if (filters.containsKey("student_id")) {
            studentRepo.findById(Long.valueOf(filters.get("student_id").toString())).ifPresent(s -> {
                s.setStatus("completed");
                studentRepo.save(s);
            });
            return true;
        } else if (filters.containsKey("batch_id")) {
            Long batchId = Long.valueOf(filters.get("batch_id").toString());
            List<Student> students = studentRepo.findByBatchId(batchId);
            students.forEach(s -> { s.setStatus("completed"); studentRepo.save(s); });
            // Also mark batch as completed
            batchRepo.findById(batchId).ifPresent(b -> { b.setStatus("completed"); batchRepo.save(b); });
            return true;
        }
        return false;
    }

    // ============ SCHEDULE (Institute_model.php lines 1030-1154) ============

    @Transactional
    public Long scheduleClass(Map<String, Object> data) {
        return scheduleClass(data, null);
    }

    @Transactional
    public Long scheduleClass(Map<String, Object> data, Long actorStaffId) {
        Long id = data.containsKey("id") && data.get("id") != null ? Long.valueOf(data.get("id").toString()) : null;

        ScheduledClass sc;
        if (id != null) {
            sc = scheduledClassRepo.findById(id).orElse(new ScheduledClass());
        } else {
            sc = new ScheduledClass();
            sc.setCreatedAt(LocalDateTime.now());
        }

        Long resolvedStaffId = parseLong(data.get("staff_id"), actorStaffId);
        Long batchId = parseLong(data.get("batch_id"), null);
        Long studentId = parseLong(data.get("student_id"), null);

        if (resolvedStaffId == null) {
            throw new IllegalArgumentException("Unable to resolve the staff member for this schedule.");
        }
        if (batchId == null && studentId == null) {
            throw new IllegalArgumentException("Please select a batch or student before saving the schedule.");
        }

        sc.setStaffId(resolvedStaffId);
        sc.setBatchId(batchId);
        sc.setStudentId(studentId);
        if (data.containsKey("topic")) sc.setTopic((String) data.get("topic"));
        if (data.containsKey("class_date") && data.get("class_date") != null) sc.setClassDate(LocalDate.parse(data.get("class_date").toString()));
        if (data.containsKey("start_time")) sc.setStartTime((String) data.get("start_time"));
        if (data.containsKey("end_time")) sc.setEndTime((String) data.get("end_time"));
        String status = data.containsKey("status") ? Objects.toString(data.get("status"), "").trim() : "";
        sc.setStatus(status.isEmpty() ? "scheduled" : status);
        sc.setStaffOnLeaveId(parseLong(data.get("staff_on_leave_id"), null));

        ScheduledClass saved = scheduledClassRepo.save(sc);

        if (id == null) {
            logActivity(sc.getStaffId(), sc.getStaffId() >= 1000000 ? "admin" : "staff",
                "Class Scheduled", "Class scheduled for topic '" + sc.getTopic() + "' on " + sc.getClassDate());
        }

        return saved.getId();
    }

    private Long parseLong(Object value, Long defaultValue) {
        if (value == null) {
            return defaultValue;
        }
        String normalized = value.toString().trim();
        if (normalized.isEmpty() || "null".equalsIgnoreCase(normalized)) {
            return defaultValue;
        }
        return Long.valueOf(normalized);
    }

    public boolean deleteSchedule(Long id) {
        scheduledClassRepo.deleteById(id);
        return true;
    }

    @Transactional
    public List<Map<String, Object>> getStaffSchedule(Long requestingStaffId, Long targetStaffId, LocalDate date) {
        if (date == null) date = LocalDate.now();

        // Heal legacy data missing tenant_id (caused by missing @EntityListeners on ScheduledClass)
        String currentTenant = com.institute.tenant.TenantContext.getTenantId();
        if (currentTenant != null && !"DEFAULT".equals(currentTenant) && !"SYSTEM".equals(currentTenant)) {
            scheduledClassRepo.fixLegacyTenants(currentTenant);
        }

        List<ScheduledClass> schedule;
        if (requestingStaffId != null && requestingStaffId >= 1000000 && targetStaffId == null) {
            schedule = scheduledClassRepo.findByClassDateOrderByStartTimeAsc(date);
        } else {
            Long effectiveStaffId = targetStaffId != null ? targetStaffId : requestingStaffId;
            schedule = effectiveStaffId == null
                ? Collections.emptyList()
                : scheduledClassRepo.findByStaffIdAndClassDateOrderByStartTimeAsc(effectiveStaffId, date);
        }
        return schedule.stream().map(this::mapScheduledClass).collect(Collectors.toList());
    }

    // ============ ONE-TO-ONE ALLOCATION (Institute_model.php lines 138-146) ============

    public boolean updateOneToOneAllocation(Long studentId, Map<String, Object> data) {
        Student student = studentRepo.findById(studentId).orElse(null);
        if (student == null) return false;
        if (data.containsKey("instructor")) student.setInstructor(data.get("instructor") != null ? data.get("instructor").toString() : null);
        if (data.containsKey("timing")) student.setTiming((String) data.get("timing"));
        if (data.containsKey("startDate") && data.get("startDate") != null && !data.get("startDate").toString().isEmpty()) {
            student.setStartDate(LocalDate.parse(data.get("startDate").toString()));
        }
        if (data.containsKey("status")) student.setStatus((String) data.get("status"));
        if (data.containsKey("subjectAllocations")) student.setSubjectAllocations((String) data.get("subjectAllocations"));
        studentRepo.save(student);
        return true;
    }

    public List<Map<String, Object>> getStudentsForStaff(Long staffId) {
        List<Map<String, Object>> staffBatches = getBatchesForStaff(staffId);
        Set<Long> staffBatchIds = staffBatches.stream()
            .map(b -> (Long) b.get("id"))
            .collect(Collectors.toSet());

        return getAllStudents().stream()
            .filter(student -> {
                if (matchesStaff(student.get("instructor"), staffId)) {
                    return true;
                }
                Object batchIdsObj = student.get("batch_ids");
                if (batchIdsObj instanceof List) {
                    List<?> batchIds = (List<?>) batchIdsObj;
                    for (Object bid : batchIds) {
                        if (staffBatchIds.contains(Long.valueOf(bid.toString()))) {
                            return true;
                        }
                    }
                }
                return belongsToStaffBatch(student.get("batch_id"), staffId);
            })
            .map(student -> {
                Map<String, Object> newMap = new LinkedHashMap<>(student);
                Object batchIdsObj = student.get("batch_ids");
                if (batchIdsObj instanceof List) {
                    List<?> batchIds = (List<?>) batchIdsObj;
                    for (Object bid : batchIds) {
                        Long bId = Long.valueOf(bid.toString());
                        if (staffBatchIds.contains(bId)) {
                            newMap.put("batch_id", bId);
                            staffBatches.stream()
                                .filter(b -> bId.equals(b.get("id")))
                                .findFirst()
                                .ifPresent(b -> newMap.put("batch_name", b.get("batch_name")));
                            break;
                        }
                    }
                }
                return newMap;
            })
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getBatchesForStaff(Long staffId) {
        return getAllBatches().stream()
            .filter(batch -> matchesStaff(batch.get("instructor"), staffId))
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getCoursesForStaff(Long staffId) {
        Set<Long> courseIds = getBatchesForStaff(staffId).stream()
            .map(batch -> batch.get("course_id"))
            .filter(Objects::nonNull)
            .map(value -> Long.valueOf(value.toString()))
            .collect(Collectors.toCollection(LinkedHashSet::new));

        List<Map<String, Object>> result = new ArrayList<>();
        for (Long courseId : courseIds) {
            courseRepo.findById(courseId).ifPresent(course -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("id", course.getId());
                map.put("course_id", course.getCourseId());
                map.put("name", course.getName());
                map.put("description", course.getDescription());
                map.put("duration", course.getDuration());
                map.put("fees", course.getFees());
                map.put("status", course.getStatus());
                map.put("syllabus_path", course.getSyllabusPath());
                map.put("image_url", course.getImagePath());
                result.add(map);
            });
        }
        return result;
    }

    public Map<String, Object> getStaffResources(Long staffId) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("batches", getBatchesForStaff(staffId));
        data.put("students", getStudentsForStaff(staffId));
        return data;
    }

    @Transactional
    public int clonePreviousSchedule(Long staffId, LocalDate targetDate) {
        if (staffId == null || targetDate == null) {
            return 0;
        }

        LocalDate previousDate = targetDate.minusDays(1);
        List<ScheduledClass> previousClasses = scheduledClassRepo.findByStaffIdAndClassDateOrderByStartTimeAsc(staffId, previousDate);
        Set<String> existingKeys = scheduledClassRepo.findByStaffIdAndClassDateOrderByStartTimeAsc(staffId, targetDate)
            .stream()
            .map(this::scheduleKey)
            .collect(Collectors.toSet());

        int copied = 0;
        for (ScheduledClass previousClass : previousClasses) {
            if (existingKeys.contains(scheduleKey(previousClass))) {
                continue;
            }
            scheduledClassRepo.save(ScheduledClass.builder()
                .staffId(previousClass.getStaffId())
                .batchId(previousClass.getBatchId())
                .studentId(previousClass.getStudentId())
                .topic(previousClass.getTopic())
                .classDate(targetDate)
                .startTime(previousClass.getStartTime())
                .endTime(previousClass.getEndTime())
                .status(previousClass.getStatus())
                .staffOnLeaveId(previousClass.getStaffOnLeaveId())
                .createdAt(LocalDateTime.now())
                .build());
            copied++;
        }
        return copied;
    }

    private Map<String, Object> mapScheduledClass(ScheduledClass scheduledClass) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", scheduledClass.getId());
        map.put("staff_id", scheduledClass.getStaffId());
        map.put("batch_id", scheduledClass.getBatchId());
        map.put("student_id", scheduledClass.getStudentId());
        map.put("topic", scheduledClass.getTopic());
        map.put("class_date", scheduledClass.getClassDate());
        map.put("start_time", scheduledClass.getStartTime());
        map.put("end_time", scheduledClass.getEndTime());
        map.put("status", scheduledClass.getStatus());
        map.put("staff_on_leave_id", scheduledClass.getStaffOnLeaveId());

        if (scheduledClass.getBatchId() != null) {
            batchRepo.findById(scheduledClass.getBatchId()).ifPresent(batch -> {
                map.put("batch_name", batch.getBatchName());
                map.put("course_id", batch.getCourseId());
                courseRepo.findById(batch.getCourseId()).ifPresent(course -> map.put("course_name", course.getName()));
            });
        }

        if (scheduledClass.getStudentId() != null) {
            studentRepo.findById(scheduledClass.getStudentId()).ifPresent(student -> {
                map.put("student_name", student.getName());
                map.put("course_id", student.getCourseId());
                if (student.getCourseId() != null) {
                    courseRepo.findById(student.getCourseId()).ifPresent(course -> map.put("course_name", course.getName()));
                }
            });
        }

        map.put("instructor_name", resolveInstructorName(scheduledClass.getStaffId()));
        return map;
    }

    private String resolveInstructorName(Long staffId) {
        if (staffId == null) {
            return "";
        }
        if (staffId >= 1000000) {
            return userRepo.findById(staffId - 1000000).map(User::getFullName).orElse(String.valueOf(staffId));
        }
        return staffRepo.findById(staffId).map(Staff::getName).orElse(String.valueOf(staffId));
    }

    private boolean belongsToStaffBatch(Object batchIdValue, Long staffId) {
        if (batchIdValue == null || staffId == null) {
            return false;
        }
        try {
            Long batchId = Long.valueOf(batchIdValue.toString());
            return batchRepo.findById(batchId)
                .map(batch -> matchesStaff(batch.getInstructor(), staffId))
                .orElse(false);
        } catch (NumberFormatException e) {
            return false;
        }
    }

    private boolean matchesStaff(Object candidateValue, Long staffId) {
        return candidateValue != null && staffId != null && candidateValue.toString().equals(String.valueOf(staffId));
    }

    private String scheduleKey(ScheduledClass scheduledClass) {
        return String.join("|",
            String.valueOf(scheduledClass.getBatchId()),
            String.valueOf(scheduledClass.getStudentId()),
            String.valueOf(scheduledClass.getStartTime()),
            String.valueOf(scheduledClass.getEndTime()));
    }

    public static int parseDurationUnits(String duration, String feePeriod) {
        if (duration == null || feePeriod == null) return 1;
        String durClean = duration.toLowerCase().replaceAll("[^a-z0-9]", " ").trim();
        String periodClean = feePeriod.toLowerCase().trim();
        if (periodClean.contains("course") || periodClean.contains("one-time") || periodClean.contains("one time")) return 1;
        
        java.util.regex.Pattern p = java.util.regex.Pattern.compile("\\d+");
        java.util.regex.Matcher m = p.matcher(durClean);
        int number = 1;
        if (m.find()) {
            try {
                number = Integer.parseInt(m.group());
            } catch (Exception e) {}
        }
        
        if (periodClean.contains("day") || periodClean.contains("daily")) {
            if (durClean.contains("month")) return number * 30;
            if (durClean.contains("year")) return number * 365;
            if (durClean.contains("week")) return number * 7;
            return number;
        }
        if (periodClean.contains("week") || periodClean.contains("weekly")) {
            if (durClean.contains("month")) return number * 4;
            if (durClean.contains("year")) return number * 52;
            if (durClean.contains("day")) return Math.max(1, number / 7);
            return number;
        }
        if (periodClean.contains("month") || periodClean.contains("monthly")) {
            if (durClean.contains("year")) return number * 12;
            if (durClean.contains("week")) return Math.max(1, number / 4);
            if (durClean.contains("day")) return Math.max(1, number / 30);
            return number;
        }
        if (periodClean.contains("year") || periodClean.contains("yearly")) {
            if (durClean.contains("month")) return Math.max(1, number / 12);
            return number;
        }
        
        return 1;
    }

    public static BigDecimal calculateFeeOverdue(Student student, Course course, Fee fee) {
        if (student == null || course == null || fee == null) {
            return BigDecimal.ZERO;
        }
        if (fee.getBalanceAmount() == null || fee.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        LocalDate joinDate = student.getJoiningDate() != null ? student.getJoiningDate() : 
                           (student.getStartDate() != null ? student.getStartDate() : 
                            (student.getCreatedAt() != null ? student.getCreatedAt().toLocalDate() : LocalDate.now()));
        LocalDate currentDate = LocalDate.now();

        long elapsed = 0;
        if (currentDate.isAfter(joinDate) || currentDate.isEqual(joinDate)) {
            String period = course.getFeePeriod() != null ? course.getFeePeriod().toLowerCase().trim() : "course";
            if (period.equals("day") || period.equals("daily")) {
                elapsed = java.time.temporal.ChronoUnit.DAYS.between(joinDate, currentDate) + 1;
            } else if (period.equals("week") || period.equals("weekly")) {
                elapsed = java.time.temporal.ChronoUnit.WEEKS.between(joinDate, currentDate) + 1;
            } else if (period.equals("month") || period.equals("monthly")) {
                elapsed = java.time.temporal.ChronoUnit.MONTHS.between(joinDate, currentDate) + 1;
            } else if (period.equals("year") || period.equals("yearly")) {
                elapsed = java.time.temporal.ChronoUnit.YEARS.between(joinDate, currentDate) + 1;
            } else { // "one-time" or "course"
                elapsed = 1;
            }
        }

        int units = parseDurationUnits(course.getDuration(), course.getFeePeriod());
        long elapsedPeriods = Math.min((long) units, elapsed);

        BigDecimal rate = BigDecimal.ZERO;
        if (units > 0 && fee.getTotalAmount() != null) {
            rate = fee.getTotalAmount().divide(new BigDecimal(units), 2, java.math.RoundingMode.HALF_UP);
        } else {
            rate = fee.getTotalAmount() != null ? fee.getTotalAmount() : BigDecimal.ZERO;
        }

        BigDecimal totalExpectedLastPeriods = rate.multiply(new BigDecimal(Math.max(0, elapsedPeriods - 1)));

        BigDecimal paid = fee.getPaidAmount() != null ? fee.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal overdue = BigDecimal.ZERO;
        if (elapsedPeriods > 1) {
            overdue = totalExpectedLastPeriods.subtract(paid);
            if (overdue.compareTo(BigDecimal.ZERO) < 0) {
                overdue = BigDecimal.ZERO;
            }
        }
        return overdue.min(fee.getBalanceAmount());
    }

    public static BigDecimal calculateThisPeriodPayable(Student student, Course course, Fee fee) {
        if (student == null || course == null || fee == null) {
            return BigDecimal.ZERO;
        }
        if (fee.getBalanceAmount() == null || fee.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return BigDecimal.ZERO;
        }

        LocalDate joinDate = student.getJoiningDate() != null ? student.getJoiningDate() : 
                           (student.getStartDate() != null ? student.getStartDate() : 
                            (student.getCreatedAt() != null ? student.getCreatedAt().toLocalDate() : LocalDate.now()));
        LocalDate currentDate = LocalDate.now();

        long elapsed = 0;
        if (currentDate.isAfter(joinDate) || currentDate.isEqual(joinDate)) {
            String period = course.getFeePeriod() != null ? course.getFeePeriod().toLowerCase().trim() : "course";
            if (period.equals("day") || period.equals("daily")) {
                elapsed = java.time.temporal.ChronoUnit.DAYS.between(joinDate, currentDate) + 1;
            } else if (period.equals("week") || period.equals("weekly")) {
                elapsed = java.time.temporal.ChronoUnit.WEEKS.between(joinDate, currentDate) + 1;
            } else if (period.equals("month") || period.equals("monthly")) {
                elapsed = java.time.temporal.ChronoUnit.MONTHS.between(joinDate, currentDate) + 1;
            } else if (period.equals("year") || period.equals("yearly")) {
                elapsed = java.time.temporal.ChronoUnit.YEARS.between(joinDate, currentDate) + 1;
            } else { // "one-time" or "course"
                elapsed = 1;
            }
        }

        int units = parseDurationUnits(course.getDuration(), course.getFeePeriod());
        long elapsedPeriods = Math.min((long) units, elapsed);

        BigDecimal rate = BigDecimal.ZERO;
        if (units > 0 && fee.getTotalAmount() != null) {
            rate = fee.getTotalAmount().divide(new BigDecimal(units), 2, java.math.RoundingMode.HALF_UP);
        } else {
            rate = fee.getTotalAmount() != null ? fee.getTotalAmount() : BigDecimal.ZERO;
        }

        BigDecimal totalExpectedLastPeriods = rate.multiply(new BigDecimal(Math.max(0, elapsedPeriods - 1)));

        BigDecimal paid = fee.getPaidAmount() != null ? fee.getPaidAmount() : BigDecimal.ZERO;
        BigDecimal overdue = BigDecimal.ZERO;
        if (elapsedPeriods > 1) {
            overdue = totalExpectedLastPeriods.subtract(paid);
            if (overdue.compareTo(BigDecimal.ZERO) < 0) {
                overdue = BigDecimal.ZERO;
            }
        }
        overdue = overdue.min(fee.getBalanceAmount());

        BigDecimal currentPeriodDue = rate;
        BigDecimal remainingPaidForCurrent = paid.subtract(totalExpectedLastPeriods);
        if (remainingPaidForCurrent.compareTo(BigDecimal.ZERO) > 0) {
            currentPeriodDue = rate.subtract(remainingPaidForCurrent);
            if (currentPeriodDue.compareTo(BigDecimal.ZERO) < 0) {
                currentPeriodDue = BigDecimal.ZERO;
            }
        }
        currentPeriodDue = currentPeriodDue.min(fee.getBalanceAmount());

        BigDecimal thisPeriodPayable = overdue.add(currentPeriodDue);
        return thisPeriodPayable.min(fee.getBalanceAmount());
    }
}
