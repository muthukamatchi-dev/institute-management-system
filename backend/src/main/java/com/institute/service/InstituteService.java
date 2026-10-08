package com.institute.service;

import com.institute.model.*;
import com.institute.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
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
 * Covers: courses, batches, students, staff, settings, search, notifications,
 * auto-ID generation
 */
@Service
public class InstituteService {

    private final CourseRepository courseRepo;
    private final BatchRepository batchRepo;
    private final StudentRepository studentRepo;
    private final StudentBatchRepository studentBatchRepo;
    private final StudentCourseRepository studentCourseRepo;
    private final StaffRepository staffRepo;
    private final FeeRepository feeRepo;
    private final ReceiptRepository receiptRepo;
    private final AttendanceRepository attendanceRepo;
    private final InstituteSettingRepository settingRepo;
    private final ActivityLogRepository activityLogRepo;
    private final NotificationRepository notificationRepo;
    private final ScheduledClassRepository scheduledClassRepo;
    private final UserRepository userRepo;
    private final EnquiryRepository enquiryRepo;

    @Autowired(required = false)
    private TenantRepository tenantRepo;

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    public InstituteService(CourseRepository courseRepo, BatchRepository batchRepo,
            StudentRepository studentRepo, StudentBatchRepository studentBatchRepo,
            StudentCourseRepository studentCourseRepo,
            StaffRepository staffRepo, FeeRepository feeRepo, ReceiptRepository receiptRepo,
            AttendanceRepository attendanceRepo, InstituteSettingRepository settingRepo,
            ActivityLogRepository activityLogRepo, NotificationRepository notificationRepo,
            ScheduledClassRepository scheduledClassRepo, UserRepository userRepo,
            EnquiryRepository enquiryRepo) {
        this.courseRepo = courseRepo;
        this.batchRepo = batchRepo;
        this.studentRepo = studentRepo;
        this.studentBatchRepo = studentBatchRepo;
        this.studentCourseRepo = studentCourseRepo;
        this.staffRepo = staffRepo;
        this.feeRepo = feeRepo;
        this.receiptRepo = receiptRepo;
        this.attendanceRepo = attendanceRepo;
        this.settingRepo = settingRepo;
        this.activityLogRepo = activityLogRepo;
        this.notificationRepo = notificationRepo;
        this.scheduledClassRepo = scheduledClassRepo;
        this.userRepo = userRepo;
        this.enquiryRepo = enquiryRepo;
    }

    // ============ COURSES (Institute_model.php lines 7-33) ============

    public List<Course> getAllCourses() {
        List<Course> courses = courseRepo.findAll();
        LocalDate today = LocalDate.now();
        for (Course c : courses) {
            evaluateCourseStatus(c, today);
        }
        return courses;
    }

    public Course getCourse(Long id) {
        Course c = courseRepo.findById(id).orElse(null);
        if (c != null) {
            evaluateCourseStatus(c, LocalDate.now());
        }
        return c;
    }

    private void evaluateCourseStatus(Course c, LocalDate today) {
        if (c == null) return;
        String ct = c.getCourseType();
        if (ct != null) {
            String t = ct.toLowerCase();
            if (t.equals("seasonal") || t.equals("workshop") || t.equals("camp") || t.equals("bootcamp")) {
                if (c.getValidFrom() != null && c.getValidTo() != null) {
                    if (today.isBefore(c.getValidFrom())) {
                        c.setStatus("upcoming");
                    } else if (today.isAfter(c.getValidTo())) {
                        c.setStatus("inactive");
                    } else {
                        c.setStatus("active");
                    }
                }
            }
        }
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

        if (data.containsKey("name"))
            course.setName((String) data.get("name"));
        if (data.containsKey("description"))
            course.setDescription((String) data.get("description"));
        if (data.containsKey("category"))
            course.setCategory((String) data.get("category"));
        if (data.containsKey("duration"))
            course.setDuration((String) data.get("duration"));
        if (data.containsKey("fees"))
            course.setFees(new BigDecimal(data.get("fees").toString()));
        if (data.containsKey("status"))
            course.setStatus((String) data.get("status"));
        if (data.containsKey("syllabus_path"))
            course.setSyllabusPath((String) data.get("syllabus_path"));
        if (data.containsKey("image_path"))
            course.setImagePath((String) data.get("image_path"));
        if (data.containsKey("course_id"))
            course.setCourseId((String) data.get("course_id"));
        if (data.containsKey("courseType"))
            course.setCourseType((String) data.get("courseType"));
        if (data.containsKey("course_type"))
            course.setCourseType((String) data.get("course_type"));
        if (data.containsKey("feePeriod"))
            course.setFeePeriod((String) data.get("feePeriod"));
        if (data.containsKey("fee_period"))
            course.setFeePeriod((String) data.get("fee_period"));
        if (data.containsKey("scheduleType"))
            course.setScheduleType((String) data.get("scheduleType"));
        if (data.containsKey("schedule_type"))
            course.setScheduleType((String) data.get("schedule_type"));
        if (data.containsKey("customDays")) {
            Object cd = data.get("customDays");
            course.setCustomDays(cd != null ? cd.toString() : null);
        }
        if (data.containsKey("custom_days")) {
            Object cd = data.get("custom_days");
            course.setCustomDays(cd != null ? cd.toString() : null);
        }
        if (data.containsKey("isOnline")) {
            Object val = data.get("isOnline");
            if (val instanceof Boolean) {
                course.setIsOnline((Boolean) val);
            } else if (val != null) {
                course.setIsOnline("true".equalsIgnoreCase(val.toString()) || "1".equals(val.toString()));
            }
        }
        if (data.containsKey("is_online")) {
            Object val = data.get("is_online");
            if (val instanceof Boolean) {
                course.setIsOnline((Boolean) val);
            } else if (val != null) {
                course.setIsOnline("true".equalsIgnoreCase(val.toString()) || "1".equals(val.toString()));
            }
        }
        if (data.containsKey("validFrom") || data.containsKey("valid_from")) {
            Object vf = data.containsKey("validFrom") ? data.get("validFrom") : data.get("valid_from");
            if (vf != null && !vf.toString().trim().isEmpty()) {
                try {
                    course.setValidFrom(LocalDate.parse(vf.toString().trim().substring(0, 10)));
                } catch (Exception e) {
                    course.setValidFrom(null);
                }
            } else {
                course.setValidFrom(null);
            }
        }
        if (data.containsKey("validTo") || data.containsKey("valid_to")) {
            Object vt = data.containsKey("validTo") ? data.get("validTo") : data.get("valid_to");
            if (vt != null && !vt.toString().trim().isEmpty()) {
                try {
                    course.setValidTo(LocalDate.parse(vt.toString().trim().substring(0, 10)));
                } catch (Exception e) {
                    course.setValidTo(null);
                }
            } else {
                course.setValidTo(null);
            }
        }

        evaluateCourseStatus(course, LocalDate.now());
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
            createNotification(null, "all", "New Course", "New course '" + course.getName() + "' is now available.",
                    "course");
        }

        return saved.getId();
    }

    @Transactional
    public boolean deleteCourse(Long id) {
        Course course = courseRepo.findById(id).orElse(null);
        if (course == null)
            return false;

        // Clear students association (Institute_model.php line 270)
        List<Student> students = studentRepo.findByCourseId(id);
        for (Student s : students) {
            s.setCourseId(null);
            studentRepo.save(s);
        }

        // Clear student_courses records for this course (multi-course enrollment
        // cleanup)
        List<StudentCourse> scList = studentCourseRepo.findByCourseId(id);
        for (StudentCourse sc : scList) {
            studentCourseRepo.delete(sc);
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
            Course course = b.getCourseId() != null ? courseRepo.findById(b.getCourseId()).orElse(null) : null;
            map.put("course_name", course != null ? course.getName() : "");
            map.put("schedule_type", course != null && course.getScheduleType() != null ? course.getScheduleType() : "Weekdays");
            map.put("scheduleType", course != null && course.getScheduleType() != null ? course.getScheduleType() : "Weekdays");
            map.put("custom_days", course != null ? course.getCustomDays() : null);
            map.put("customDays", course != null ? course.getCustomDays() : null);

            // Instructor name (resolve from staff or use raw)
            String instructorName = b.getInstructor();
            if (b.getInstructor() != null) {
                try {
                    Long instId = Long.parseLong(b.getInstructor());
                    if (instId >= 1000000) {
                        userRepo.findById(instId - 1000000).ifPresent(u -> {
                        });
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

        if (data.containsKey("batch_name"))
            batch.setBatchName((String) data.get("batch_name"));
        if (data.containsKey("course_id") && data.get("course_id") != null && !data.get("course_id").toString().trim().isEmpty()) {
            try {
                batch.setCourseId(Long.valueOf(data.get("course_id").toString().trim()));
            } catch (Exception e) {
                batch.setCourseId(null);
            }
        } else {
            batch.setCourseId(null);
        }
        if (data.containsKey("instructor"))
            batch.setInstructor(data.get("instructor") != null ? data.get("instructor").toString() : null);
        if (data.containsKey("timing"))
            batch.setTiming((String) data.get("timing"));
        if (data.containsKey("start_date") && data.get("start_date") != null) {
            batch.setStartDate(LocalDate.parse(data.get("start_date").toString()));
        }
        if (data.containsKey("status"))
            batch.setStatus((String) data.get("status"));
        if (data.containsKey("subject"))
            batch.setSubject((String) data.get("subject"));

        applyAutomaticBatchStatus(batch);

        // Pre-save validation for student assignments
        if (data.containsKey("students") && data.get("students") instanceof List) {
            List<?> rawStudentIds = (List<?>) data.get("students");
            List<Long> studentIds = new ArrayList<>();
            for (Object sid : rawStudentIds) {
                if (sid != null) {
                    try {
                        studentIds.add(Long.valueOf(sid.toString()));
                    } catch (NumberFormatException ignored) {
                    }
                }
            }

            Course course = batch.getCourseId() != null ? courseRepo.findById(batch.getCourseId()).orElse(null) : null;
            boolean isStandard = course != null && "standard".equalsIgnoreCase(course.getCourseType());

            // 1. Duplicate Course/Subject Validation
            for (Long studentId : studentIds) {
                List<StudentBatch> studentBatches = studentBatchRepo.findByStudentId(studentId);
                for (StudentBatch sb : studentBatches) {
                    if (sb.getBatchId() != null && (id == null || !sb.getBatchId().equals(id))) {
                        Batch otherBatch = batchRepo.findById(sb.getBatchId()).orElse(null);
                        if (otherBatch != null && otherBatch.getCourseId() != null
                                && otherBatch.getCourseId().equals(batch.getCourseId())) {
                            if (isStandard) {
                                String curSubject = batch.getSubject() != null ? batch.getSubject().trim() : "";
                                String otherSubject = otherBatch.getSubject() != null ? otherBatch.getSubject().trim()
                                        : "";
                                if (curSubject.equalsIgnoreCase(otherSubject)) {
                                    Student studentObj = studentRepo.findById(studentId).orElse(null);
                                    String studentName = studentObj != null ? studentObj.getName()
                                            : "Student ID " + studentId;
                                    String courseName = course != null ? course.getName()
                                            : "Course ID " + batch.getCourseId();
                                    throw new RuntimeException(
                                            studentName + " is already assigned to another batch for "
                                                    + courseName + " - "
                                                    + (curSubject.isEmpty() ? "General" : curSubject) + ".");
                                }
                            } else {
                                Student studentObj = studentRepo.findById(studentId).orElse(null);
                                String studentName = studentObj != null ? studentObj.getName()
                                        : "Student ID " + studentId;
                                String courseName = course != null ? course.getName()
                                        : "Course ID " + batch.getCourseId();
                                throw new RuntimeException(
                                        studentName + " is already assigned to another batch for " + courseName + ".");
                            }
                        }
                    }
                }
            }

            // 2. Timing Overlap Validation
            int[] newBatchRange = parseRangeToMinutes(batch.getTiming());
            if (newBatchRange != null) {
                for (Long studentId : studentIds) {
                    List<StudentBatch> studentBatches = studentBatchRepo.findByStudentId(studentId);
                    for (StudentBatch sb : studentBatches) {
                        if (sb.getBatchId() != null && (id == null || !sb.getBatchId().equals(id))) {
                            Batch otherBatch = batchRepo.findById(sb.getBatchId()).orElse(null);
                            if (otherBatch != null && !"completed".equalsIgnoreCase(otherBatch.getStatus())
                                    && otherBatch.getTiming() != null) {
                                int[] existingRange = parseRangeToMinutes(otherBatch.getTiming());
                                if (checkRangesOverlap(newBatchRange, existingRange)) {
                                    Student studentObj = studentRepo.findById(studentId).orElse(null);
                                    String studentName = studentObj != null ? studentObj.getName()
                                            : "Student ID " + studentId;
                                    throw new RuntimeException(studentName + " is already scheduled in batch '"
                                            + otherBatch.getBatchName() + "' (" + otherBatch.getTiming()
                                            + "). Please resolve the timing conflict.");
                                }
                            }
                        }
                    }
                }
            }
        }

        Batch saved = batchRepo.save(batch);
        ensureBatchStartTodayNotifications(saved);

        if (data.containsKey("students") && data.get("students") instanceof List) {
            List<?> studentIds = (List<?>) data.get("students");
            assignStudentsToBatch(saved.getId(), studentIds);
        }

        logActivity(0L, "admin", id != null ? "Batch Updated" : "New Batch Created",
                "Batch '" + batch.getBatchName() + "' " + (id != null ? "was updated." : "has been created."));

        if (id == null) {
            createNotification(null, "admin", "New Batch", "Batch '" + batch.getBatchName() + "' has been scheduled.",
                    "batch");
            createNotification(null, "staff", "New Batch", "Batch '" + batch.getBatchName() + "' has been scheduled.",
                    "batch");
        }

        return saved.getId();
    }

    private void syncStudentBatchId(Long studentId) {
        if (studentId == null) return;
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
     * Migrated from: Institute_model.php -> assign_students_to_batch() lines
     * 120-136
     */
    @Transactional
    public void assignStudentsToBatch(Long batchId, List<?> studentIds) {
        // Find student IDs currently in this batch in the join table
        List<StudentBatch> currentAssocs = studentBatchRepo.findByBatchId(batchId);
        List<Long> oldStudentIds = currentAssocs.stream().map(StudentBatch::getStudentId).collect(Collectors.toList());

        // Reset existing student_batches of this batch
        studentBatchRepo.deleteByBatchId(batchId);
        studentBatchRepo.flush();

        // Add new associations
        if (studentIds != null && !studentIds.isEmpty()) {
            for (Object sid : studentIds) {
                Long studentId = parseLong(sid, null);
                if (studentId != null) {
                    StudentBatch sb = StudentBatch.builder()
                            .studentId(studentId)
                            .batchId(batchId)
                            .build();
                    studentBatchRepo.save(sb);
                }
            }
        }

        // Sync batchId for all affected students
        Set<Long> affectedStudentIds = new HashSet<>(oldStudentIds);
        if (studentIds != null) {
            for (Object sid : studentIds) {
                Long studentId = parseLong(sid, null);
                if (studentId != null) {
                    affectedStudentIds.add(studentId);
                }
            }
        }
        for (Long studentId : affectedStudentIds) {
            syncStudentBatchId(studentId);
        }
    }

    @Transactional
    public boolean deleteBatch(Long id) {
        if (id == null) return false;
        Batch batch = batchRepo.findById(id).orElse(null);
        if (batch == null)
            return false;

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

    public Map<String, Object> getPagedStudents(int page, int size, Long batchId, String search, String courseId,
            String status) {
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
                    if (!cId.equals(s.getCourseId()))
                        return false;
                } catch (NumberFormatException e) {
                    if (s.getCourseId() == null || !courseId.equals(String.valueOf(s.getCourseId())))
                        return false;
                }
            }
            if (status != null && !status.trim().isEmpty() && !"all".equalsIgnoreCase(status)) {
                if (!status.equalsIgnoreCase(s.getStatus()))
                    return false;
            }
            if (search != null && !search.trim().isEmpty()) {
                String q = search.trim().toLowerCase();
                boolean matchesName = s.getName() != null && s.getName().toLowerCase().contains(q);
                boolean matchesMobile = s.getMobile() != null && s.getMobile().toLowerCase().contains(q);
                boolean matchesReg = s.getRegNumber() != null && s.getRegNumber().toLowerCase().contains(q);
                boolean matchesEmail = s.getEmail() != null && s.getEmail().toLowerCase().contains(q);
                if (!matchesName && !matchesMobile && !matchesReg && !matchesEmail)
                    return false;
            }
            return true;
        }).collect(Collectors.toList());

        int totalElements = filtered.size();
        int totalPages = (int) Math.ceil((double) totalElements / size);
        if (totalPages == 0)
            totalPages = 1;

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
            map.put("gender", s.getGender());
            map.put("qualification", s.getQualification());
            map.put("address", s.getAddress());
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
            if (!fees.isEmpty())
                map.put("fee_status", fees.get(0).getStatus());
            if (!map.containsKey("fee_status"))
                map.put("fee_status", "pending");

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
            map.put("gender", s.getGender());
            map.put("qualification", s.getQualification());
            map.put("address", s.getAddress());
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
                courseRepo.findById(s.getCourseId()).ifPresent(c -> {
                    map.put("course_name", c.getName());
                    map.put("schedule_type", c.getScheduleType() != null ? c.getScheduleType() : "Weekdays");
                    map.put("scheduleType", c.getScheduleType() != null ? c.getScheduleType() : "Weekdays");
                    map.put("custom_days", c.getCustomDays());
                    map.put("customDays", c.getCustomDays());
                });
            }
            // Batch name join
            if (displayedBatchId != null && displayedBatchId != 0L) {
                batchRepo.findById(displayedBatchId).ifPresent(b -> {
                    String currentTenant = com.institute.tenant.TenantContext.getTenantId();
                    if (currentTenant == null || "DEFAULT".equalsIgnoreCase(currentTenant)
                            || currentTenant.equals(b.getTenantId())) {
                        map.put("batch_name", b.getBatchName());
                    }
                });
            }
            // Fee status join
            List<Fee> fees = feeRepo.findByStudentId(s.getId());
            if (!fees.isEmpty())
                map.put("fee_status", fees.get(0).getStatus());
            if (!map.containsKey("fee_status"))
                map.put("fee_status", "pending");

            // Instructor name
            String instructorName = s.getInstructor();
            if (s.getInstructor() != null) {
                try {
                    Long instId = Long.parseLong(s.getInstructor());
                    Optional<Staff> sOpt = staffRepo.findById(instId);
                    instructorName = sOpt.map(Staff::getName).orElse(s.getInstructor());
                } catch (NumberFormatException e) {
                }
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
        if (data.containsKey("reg_number") && data.get("reg_number") != null
                && !data.get("reg_number").toString().isEmpty()) {
            String regNumber = data.get("reg_number").toString();
            Optional<Student> existingWithReg = studentRepo.findByRegNumber(regNumber);
            if (existingWithReg.isPresent()) {
                if (isNew || !existingWithReg.get().getId().equals(id)) {
                    throw new RuntimeException(
                            "Registration Number '" + regNumber + "' already exists for another student.");
                }
            }
        }

        if (id != null) {
            student = studentRepo.findById(id).orElse(new Student());
        } else {
            student = new Student();
            student.setCreatedAt(LocalDateTime.now());
        }

        if (data.containsKey("name"))
            student.setName((String) data.get("name"));
        if (data.containsKey("mobile"))
            student.setMobile((String) data.get("mobile"));
        if (data.containsKey("email"))
            student.setEmail((String) data.get("email"));
        if (data.containsKey("father_name"))
            student.setFatherName((String) data.get("father_name"));
        if (data.containsKey("parent_mobile"))
            student.setParentMobile((String) data.get("parent_mobile"));
        if (data.containsKey("qualification"))
            student.setQualification((String) data.get("qualification"));
        if (data.containsKey("gender"))
            student.setGender((String) data.get("gender"));
        if (data.containsKey("address"))
            student.setAddress((String) data.get("address"));
        if (data.containsKey("referred_by"))
            student.setReferredBy((String) data.get("referred_by"));
        if (data.containsKey("referral_profession"))
            student.setReferralProfession((String) data.get("referral_profession"));
        if (data.containsKey("status"))
            student.setStatus((String) data.get("status"));
        if (data.containsKey("reg_number") && data.get("reg_number") != null) {
            student.setRegNumber(data.get("reg_number").toString());
        }

        Object cObj = data.get("course_id") != null ? data.get("course_id") : data.get("courseId");
        if (cObj != null && !cObj.toString().trim().isEmpty() && !"0".equals(cObj.toString().trim())) {
            try {
                student.setCourseId(Long.valueOf(cObj.toString().trim()));
            } catch (Exception ignored) { }
        }

        Object bObj = data.get("batch_id") != null ? data.get("batch_id") : data.get("batchId");
        if (bObj != null && !bObj.toString().trim().isEmpty() && !"0".equals(bObj.toString().trim())) {
            try {
                student.setBatchId(Long.valueOf(bObj.toString().trim()));
            } catch (Exception ignored) { }
        } else if (data.containsKey("batch_id") || data.containsKey("batchId")) {
            student.setBatchId(null);
        }
        if (data.containsKey("dob") && data.get("dob") != null && !data.get("dob").toString().isEmpty()) {
            student.setDob(LocalDate.parse(data.get("dob").toString()));
        }
        if (data.containsKey("joining_date") && data.get("joining_date") != null
                && !data.get("joining_date").toString().isEmpty()) {
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
                    student.setSelectedSubjects(
                            new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(selSub));
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
                    student.setSelectedSubjects(
                            new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(selSub));
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

                    if ("standard".equalsIgnoreCase(course.getCourseType()) && saved.getSelectedSubjects() != null
                            && !saved.getSelectedSubjects().isEmpty()) {
                        try {
                            java.util.List<String> selectedNames = new com.fasterxml.jackson.databind.ObjectMapper()
                                    .readValue(
                                            saved.getSelectedSubjects(),
                                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {
                                            });

                            java.util.List<java.util.Map<String, Object>> courseSubjects = new com.fasterxml.jackson.databind.ObjectMapper()
                                    .readValue(
                                            course.getSubjects(),
                                            new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {
                                            });

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
                            .courseId(saved.getCourseId())
                            .totalAmount(totalFee)
                            .paidAmount(BigDecimal.ZERO)
                            .balanceAmount(totalFee)
                            .status("pending")
                            .build();
                    feeRepo.save(fee);
                }
            }

            // Sync student_courses join table for initial enrollment (multi-course support)
            if (saved.getCourseId() != null) {
                syncStudentCourseRecord(saved);
            }

            logActivity(0L, "admin", "New Student Added", "Student '" + saved.getName() + "' has been enrolled.");
            String courseName = saved.getCourseId() != null
                    ? courseRepo.findById(saved.getCourseId()).map(Course::getName).orElse("course")
                    : "course";

            // Notify both Admin and Staff
            createNotification(null, "admin", "New Enrollment",
                    "Student '" + saved.getName() + "' enrolled in " + courseName, "enrollment");
            createNotification(null, "staff", "New Enrollment",
                    "Student '" + saved.getName() + "' enrolled in " + courseName, "enrollment");
        } else {
            // On update: also sync the primary course record in student_courses
            if (saved.getCourseId() != null) {
                syncStudentCourseRecord(saved);
            }
            logActivity(0L, "admin", "Student Updated", "Student '" + saved.getName() + "' profile was updated.");
        }

        return saved.getId();
    }

    /**
     * Syncs the student_courses join table for the student's primary course.
     * Creates the record if it doesn't exist; updates batch/date/subjects if it
     * does.
     */
    private void syncStudentCourseRecord(Student student) {
        try {
            Optional<StudentCourse> existing = studentCourseRepo.findByStudentIdAndCourseId(student.getId(),
                    student.getCourseId());
            if (existing.isPresent()) {
                StudentCourse sc = existing.get();
                if (student.getBatchId() != null)
                    sc.setBatchId(student.getBatchId());
                if (student.getJoiningDate() != null)
                    sc.setJoiningDate(student.getJoiningDate());
                if (student.getSelectedSubjects() != null)
                    sc.setSelectedSubjects(student.getSelectedSubjects());
                if (student.getStatus() != null)
                    sc.setStatus(student.getStatus());
                studentCourseRepo.save(sc);
            } else {
                StudentCourse sc = StudentCourse.builder()
                        .studentId(student.getId())
                        .courseId(student.getCourseId())
                        .batchId(student.getBatchId())
                        .joiningDate(student.getJoiningDate())
                        .status(student.getStatus() != null ? student.getStatus() : "active")
                        .selectedSubjects(student.getSelectedSubjects())
                        .createdAt(LocalDateTime.now())
                        .build();
                studentCourseRepo.save(sc);
            }
        } catch (Exception e) {
            // Log but don't fail enrollment if student_courses sync fails
        }
    }

    // ============ MULTI-COURSE ENROLLMENT ============

    /**
     * Returns all course enrollments for a given student with course, batch, and
     * fee info.
     */
    public List<Map<String, Object>> getStudentCourses(Long studentId) {
        List<StudentCourse> enrollments = studentCourseRepo.findByStudentId(studentId);
        if (enrollments.isEmpty()) {
            Student student = studentRepo.findById(studentId).orElse(null);
            if (student != null && student.getCourseId() != null) {
                syncStudentCourseRecord(student);
                enrollments = studentCourseRepo.findByStudentId(studentId);
            }
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (StudentCourse sc : enrollments) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", sc.getId());
            map.put("student_id", sc.getStudentId());
            map.put("course_id", sc.getCourseId());
            map.put("batch_id", sc.getBatchId());
            map.put("joining_date", sc.getJoiningDate());
            map.put("status", sc.getStatus());
            map.put("selected_subjects", sc.getSelectedSubjects());

            // Enrich with course name
            courseRepo.findById(sc.getCourseId()).ifPresent(c -> {
                map.put("course_name", c.getName());
                map.put("course_fees", c.getFees());
                map.put("course_type", c.getCourseType());
                map.put("course_duration", c.getDuration());
                map.put("course_fee_period", c.getFeePeriod());
                map.put("subjects", c.getSubjects());
            });

            // Enrich with batch name
            if (sc.getBatchId() != null) {
                batchRepo.findById(sc.getBatchId()).ifPresent(b -> map.put("batch_name", b.getBatchName()));
            }

            // Enrich with fee info for this specific course enrollment
            List<Fee> fees = feeRepo.findByStudentId(studentId);
            fees.stream()
                    .filter(f -> sc.getCourseId().equals(f.getCourseId()))
                    .findFirst()
                    .ifPresent(f -> {
                        map.put("fee_id", f.getId());
                        map.put("total_amount", f.getTotalAmount());
                        map.put("paid_amount", f.getPaidAmount());
                        map.put("balance_amount", f.getBalanceAmount());
                        map.put("fee_status", f.getStatus());
                    });
            if (!map.containsKey("fee_status"))
                map.put("fee_status", "pending");

            result.add(map);
        }
        return result;
    }

    /**
     * Enrolls an existing student in an additional course.
     * Creates a student_courses record and a new Fee record for that course.
     */
    @Transactional
    public Map<String, Object> enrollAdditionalCourse(Long studentId, Map<String, Object> data) {
        Map<String, Object> result = new LinkedHashMap<>();

        Student student = studentRepo.findById(studentId).orElse(null);
        if (student == null) {
            result.put("error", "Student not found");
            return result;
        }

        Long courseId = data.containsKey("course_id") && data.get("course_id") != null
                ? Long.valueOf(data.get("course_id").toString())
                : null;
        if (courseId == null) {
            result.put("error", "Course ID is required");
            return result;
        }

        Course course = courseRepo.findById(courseId).orElse(null);
        if (course == null) {
            result.put("error", "Course not found");
            return result;
        }

        // Check if already enrolled
        if (studentCourseRepo.findByStudentIdAndCourseId(studentId, courseId).isPresent()) {
            result.put("error", "Student is already enrolled in this course");
            return result;
        }

        Long batchId = data.containsKey("batch_id") && data.get("batch_id") != null
                && !"0".equals(data.get("batch_id").toString())
                        ? Long.valueOf(data.get("batch_id").toString())
                        : null;

        LocalDate joiningDate = data.containsKey("joining_date") && data.get("joining_date") != null
                && !data.get("joining_date").toString().isEmpty()
                        ? LocalDate.parse(data.get("joining_date").toString())
                        : LocalDate.now();

        String status = data.containsKey("status") ? (String) data.get("status") : "active";
        String selectedSubjects = null;
        if (data.containsKey("selected_subjects")) {
            Object ss = data.get("selected_subjects");
            if (ss instanceof String) {
                selectedSubjects = (String) ss;
            } else {
                try {
                    selectedSubjects = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(ss);
                } catch (Exception e) {
                    selectedSubjects = "[]";
                }
            }
        }

        // Validate batch belongs to this course
        if (batchId != null) {
            Batch batch = batchRepo.findById(batchId).orElse(null);
            if (batch == null || !courseId.equals(batch.getCourseId())) {
                result.put("error", "Selected batch does not belong to this course");
                return result;
            }
        }

        // Save student_courses record
        StudentCourse sc = StudentCourse.builder()
                .studentId(studentId)
                .courseId(courseId)
                .batchId(batchId)
                .joiningDate(joiningDate)
                .status(status)
                .selectedSubjects(selectedSubjects)
                .createdAt(LocalDateTime.now())
                .build();
        StudentCourse saved = studentCourseRepo.save(sc);

        // If a batch is assigned, add to student_batches
        if (batchId != null) {
            if (!studentBatchRepo.findByStudentIdAndBatchId(studentId, batchId).isPresent()) {
                studentBatchRepo.save(StudentBatch.builder()
                        .studentId(studentId)
                        .batchId(batchId)
                        .build());
                syncStudentBatchId(studentId);
            }
        }

        // Create a separate fee record for this additional course enrollment
        BigDecimal baseFee = course.getFees() != null ? course.getFees() : BigDecimal.ZERO;
        if ("standard".equalsIgnoreCase(course.getCourseType()) && selectedSubjects != null
                && !selectedSubjects.isEmpty()) {
            try {
                java.util.List<String> selectedNames = new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                        selectedSubjects,
                        new com.fasterxml.jackson.core.type.TypeReference<java.util.List<String>>() {
                        });
                java.util.List<java.util.Map<String, Object>> courseSubjects = new com.fasterxml.jackson.databind.ObjectMapper()
                        .readValue(
                                course.getSubjects(),
                                new com.fasterxml.jackson.core.type.TypeReference<java.util.List<java.util.Map<String, Object>>>() {
                                });
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
                .studentId(studentId)
                .courseId(courseId)
                .totalAmount(totalFee)
                .paidAmount(BigDecimal.ZERO)
                .balanceAmount(totalFee)
                .status("pending")
                .build();
        Fee savedFee = feeRepo.save(fee);

        logActivity(0L, "admin", "Additional Course Enrolled",
                "Student '" + student.getName() + "' enrolled in additional course '" + course.getName() + "'.");
        createNotification(null, "admin", "Additional Enrollment",
                "Student '" + student.getName() + "' enrolled in '" + course.getName() + "'.", "enrollment");

        result.put("id", saved.getId());
        result.put("fee_id", savedFee.getId());
        result.put("course_name", course.getName());
        return result;
    }

    /**
     * Removes a student from a specific course enrollment.
     * Only allowed if no payments have been made for that course's fee record.
     */
    @Transactional
    public Map<String, Object> unenrollFromCourse(Long studentId, Long courseId) {
        Map<String, Object> result = new LinkedHashMap<>();

        StudentCourse sc = studentCourseRepo.findByStudentIdAndCourseId(studentId, courseId).orElse(null);
        if (sc == null) {
            result.put("error", "Enrollment record not found");
            return result;
        }

        // Check if any payment made for this specific course fee
        List<Fee> fees = feeRepo.findByStudentId(studentId);
        boolean hasPaid = fees.stream()
                .filter(f -> courseId.equals(f.getCourseId()))
                .anyMatch(f -> f.getPaidAmount() != null && f.getPaidAmount().compareTo(BigDecimal.ZERO) > 0);
        if (hasPaid) {
            result.put("error", "Cannot unenroll: payments have been made for this course.");
            return result;
        }

        // Remove the student_courses record
        studentCourseRepo.delete(sc);

        // Remove the fee record for this course if no payment
        fees.stream()
                .filter(f -> courseId.equals(f.getCourseId()))
                .forEach(f -> feeRepo.deleteById(f.getId()));

        // If a batch was assigned, remove from student_batches
        if (sc.getBatchId() != null) {
            studentBatchRepo.findByStudentIdAndBatchId(studentId, sc.getBatchId())
                    .ifPresent(studentBatchRepo::delete);
            syncStudentBatchId(studentId);
        }

        // If this was the student's primary course, clear it from students table
        Student student = studentRepo.findById(studentId).orElse(null);
        if (student != null && courseId.equals(student.getCourseId())) {
            // Assign primary course to another enrolled course if any
            List<StudentCourse> remaining = studentCourseRepo.findByStudentId(studentId);
            if (!remaining.isEmpty()) {
                student.setCourseId(remaining.get(0).getCourseId());
            } else {
                student.setCourseId(null);
            }
            studentRepo.save(student);
        }

        result.put("success", true);
        logActivity(0L, "admin", "Course Unenrollment",
                "Student ID " + studentId + " unenrolled from course ID " + courseId);
        return result;
    }

    @Transactional
    public Map<String, Object> updateStudentCourse(Long studentId, Map<String, Object> data) {
        Map<String, Object> result = new LinkedHashMap<>();
        Long courseId = data.get("course_id") != null ? Long.valueOf(data.get("course_id").toString()) : null;
        if (courseId == null) {
            result.put("error", "Course ID is required");
            return result;
        }

        StudentCourse sc = studentCourseRepo.findByStudentIdAndCourseId(studentId, courseId).orElse(null);
        if (sc == null) {
            result.put("error", "Course enrollment not found");
            return result;
        }

        if (data.containsKey("status") && data.get("status") != null) {
            sc.setStatus(data.get("status").toString());
        }

        if (data.containsKey("joining_date") && data.get("joining_date") != null) {
            String dtStr = data.get("joining_date").toString();
            if (!dtStr.isBlank()) {
                try {
                    sc.setJoiningDate(LocalDate.parse(dtStr.substring(0, 10)));
                } catch (Exception e) {
                    // skip parse error
                }
            }
        }

        if (data.containsKey("batch_id")) {
            Object bVal = data.get("batch_id");
            Long newBatchId = (bVal != null && !bVal.toString().isBlank() && !"0".equals(bVal.toString()))
                    ? Long.valueOf(bVal.toString())
                    : null;

            if (sc.getBatchId() != null && !sc.getBatchId().equals(newBatchId)) {
                studentBatchRepo.findByStudentIdAndBatchId(studentId, sc.getBatchId())
                        .ifPresent(studentBatchRepo::delete);
            }

            if (newBatchId != null && !newBatchId.equals(sc.getBatchId())) {
                if (!studentBatchRepo.findByStudentIdAndBatchId(studentId, newBatchId).isPresent()) {
                    studentBatchRepo.save(StudentBatch.builder()
                            .studentId(studentId)
                            .batchId(newBatchId)
                            .build());
                }
            }
            sc.setBatchId(newBatchId);
            syncStudentBatchId(studentId);
        }

        if (data.containsKey("selected_subjects") && data.get("selected_subjects") != null) {
            sc.setSelectedSubjects(data.get("selected_subjects").toString());
        }

        studentCourseRepo.save(sc);
        result.put("message", "Course enrollment updated successfully");
        return result;
    }

    /**
     * Migrated from: Institute_model.php -> delete_student() lines 219-264
     */
    @Transactional
    public String deleteStudent(Long id) {
        Student student = studentRepo.findById(id).orElse(null);
        if (student == null)
            return "error:Student not found";

        // Feature: Don't allow delete if appended to course/batch/fees/attendance
        // if (student.getCourseId() != null) return "error:Cannot delete student
        // assigned to a course.";
        if (student.getBatchId() != null)
            return "error:Cannot delete student assigned to a batch.";

        List<Fee> fees = feeRepo.findByStudentId(id);
        boolean hasPaidFeeHistory = fees.stream()
                .anyMatch(fee -> fee.getPaidAmount() != null && fee.getPaidAmount().compareTo(BigDecimal.ZERO) > 0);
        long receiptCount = receiptRepo.findByStudentIdOrderByPaymentDateDesc(id).size();
        if (hasPaidFeeHistory || receiptCount > 0) {
            return "error:Cannot delete student with payment records.";
        }

        long attendanceCount = attendanceRepo.findByStudentIdOrderByAttendanceDateDesc(id).size();
        if (attendanceCount > 0)
            return "error:Cannot delete student with attendance records.";

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

        if (data.containsKey("name"))
            staff.setName((String) data.get("name"));
        if (data.containsKey("email"))
            staff.setEmail((String) data.get("email"));
        if (data.containsKey("mobile"))
            staff.setMobile((String) data.get("mobile"));
        if (data.containsKey("qualification"))
            staff.setQualification((String) data.get("qualification"));
        if (data.containsKey("experience"))
            staff.setExperience((String) data.get("experience"));
        if (data.containsKey("designation"))
            staff.setDesignation((String) data.get("designation"));
        if (data.containsKey("status"))
            staff.setStatus((String) data.get("status"));
        if (data.containsKey("photo"))
            staff.setPhoto((String) data.get("photo"));
        if (data.containsKey("salary") && data.get("salary") != null) {
            staff.setSalary(new BigDecimal(data.get("salary").toString()));
        }
        if (data.containsKey("joining_date") && data.get("joining_date") != null
                && !data.get("joining_date").toString().isEmpty()) {
            staff.setJoiningDate(LocalDate.parse(data.get("joining_date").toString()));
        }

        Staff saved = staffRepo.save(staff);

        if (isNew) {
            generateAndAssignStaffId(saved.getId());
            logActivity(0L, "admin", "New Staff Added", "Staff member '" + saved.getName() + "' has been added.");
            createNotification(null, "admin", "New Staff", "Staff member '" + saved.getName() + "' joined the team.",
                    "staff");
            createNotification(null, "staff", "New Staff", "Staff member '" + saved.getName() + "' joined the team.",
                    "staff");
        } else {
            logActivity(0L, "admin", "Staff Updated", "Staff member '" + saved.getName() + "' profile was updated.");
        }

        return saved.getId();
    }

    public boolean deleteStaff(Long id) {
        Staff staff = staffRepo.findById(id).orElse(null);
        if (staff == null)
            return false;
        staffRepo.deleteById(id);
        logActivity(0L, "admin", "Staff Deleted", "Staff '" + staff.getName() + "' was deleted.");
        return true;
    }

    // ============ SETTINGS (Institute_model.php lines 327-341) ============

    public void ensureSettingColumnsExist() {
        if (jdbcTemplate == null) return;
        String[] alterStmts = {
            "ALTER TABLE institute_settings ADD COLUMN gdrive_backup_url VARCHAR(500) NULL",
            "ALTER TABLE institute_settings ADD COLUMN backup_frequency VARCHAR(50) NULL",
            "ALTER TABLE institute_settings ADD COLUMN last_backup_at DATETIME NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_host VARCHAR(255) NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_port INT NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_username VARCHAR(255) NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_password VARCHAR(255) NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_from_email VARCHAR(255) NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_from_name VARCHAR(255) NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_encryption VARCHAR(20) NULL",
            "ALTER TABLE institute_settings ADD COLUMN enable_smtp INT NULL",
            "ALTER TABLE institute_settings ADD COLUMN smtp_triggers VARCHAR(500) NULL",
            "ALTER TABLE institute_settings ADD COLUMN enable_exams INT NULL",
            "ALTER TABLE institute_settings ADD COLUMN enable_expenses INT NULL",
            "ALTER TABLE institute_settings ADD COLUMN enable_study_material INT NULL",
            "ALTER TABLE institute_settings ADD COLUMN enable_programs INT NULL",
            "ALTER TABLE institute_settings ADD COLUMN basic_settings TEXT NULL",
            "UPDATE institute_settings SET basic_settings = '{\"allowPast\": true, \"allowFuture\": true}' WHERE basic_settings IS NULL OR basic_settings = ''",
            "ALTER TABLE institute_settings DROP COLUMN allow_schedule_past_dates",
            "ALTER TABLE institute_settings DROP COLUMN allow_schedule_future_dates"
        };
        for (String stmt : alterStmts) {
            try {
                jdbcTemplate.execute(stmt);
            } catch (Exception ignored) {}
        }
    }

    @Transactional
    public InstituteSetting getCurrentTenantSettings() {
        ensureSettingColumnsExist();
        String currentTenant = com.institute.tenant.TenantContext.getTenantId();
        if (currentTenant != null && !"DEFAULT".equals(currentTenant) && !"SYSTEM".equals(currentTenant)) {
            settingRepo.fixLegacyTenants(currentTenant);
        }
        if (currentTenant != null && !currentTenant.isBlank() && !"DEFAULT".equalsIgnoreCase(currentTenant) && !"SYSTEM".equalsIgnoreCase(currentTenant)) {
            java.util.Optional<InstituteSetting> tenantSetting = settingRepo.findByTenantId(currentTenant);
            if (tenantSetting.isPresent()) {
                return tenantSetting.get();
            }
        }
        List<InstituteSetting> list = settingRepo.findAll();
        if (!list.isEmpty()) {
            // Find match by tenant if present in list
            if (currentTenant != null && !currentTenant.isBlank()) {
                for (InstituteSetting item : list) {
                    if (currentTenant.equalsIgnoreCase(item.getTenantId())) {
                        return item;
                    }
                }
            }
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
        if (raw == null)
            return null;
        if (raw instanceof Boolean b)
            return b ? 1 : 0;
        if (raw instanceof Number n)
            return n.intValue();
        String s = raw.toString().trim();
        if (s.isEmpty())
            return null;
        if ("true".equalsIgnoreCase(s) || "on".equalsIgnoreCase(s) || "yes".equalsIgnoreCase(s))
            return 1;
        if ("false".equalsIgnoreCase(s) || "off".equalsIgnoreCase(s) || "no".equalsIgnoreCase(s))
            return 0;
        try {
            return Integer.valueOf(s);
        } catch (NumberFormatException e) {
            // Unknown input; safest default is disabled rather than enabling a feature
            // unexpectedly.
            return 0;
        }
    }

    @Transactional
    public void updateSettings(Map<String, Object> data) {
        ensureSettingColumnsExist();
        InstituteSetting settings = getCurrentTenantSettings();

        if (data.containsKey("name") && data.get("name") != null)
            settings.setName(data.get("name").toString());
        if (data.containsKey("institute_name") && data.get("institute_name") != null) {
            String instName = data.get("institute_name").toString();
            settings.setInstituteName(instName);
            settings.setName(instName); // Ensure the non-null name field is also updated
        }
        if (data.containsKey("email"))
            settings.setEmail(data.get("email") != null ? data.get("email").toString() : null);
        if (data.containsKey("phone"))
            settings.setPhone(data.get("phone") != null ? data.get("phone").toString() : null);
        if (data.containsKey("address"))
            settings.setAddress(data.get("address") != null ? data.get("address").toString() : null);
        if (data.containsKey("logo_path"))
            settings.setLogoPath(data.get("logo_path") != null ? data.get("logo_path").toString() : null);
        if (data.containsKey("registration_id"))
            settings.setRegistrationId(
                    data.get("registration_id") != null ? data.get("registration_id").toString() : null);
        if (data.containsKey("reg_prefix"))
            settings.setRegPrefix(data.get("reg_prefix") != null ? data.get("reg_prefix").toString() : null);
        if (data.containsKey("reg_suffix"))
            settings.setRegSuffix(data.get("reg_suffix") != null ? data.get("reg_suffix").toString() : null);
        if (data.containsKey("reg_start_from"))
            settings.setRegStartFrom(data.get("reg_start_from") != null ? data.get("reg_start_from").toString() : null);
        if (data.containsKey("reg_mode"))
            settings.setRegMode(data.get("reg_mode") != null ? data.get("reg_mode").toString() : null);
        if (data.containsKey("reg_last_number"))
            settings.setRegLastNumber(
                    data.get("reg_last_number") != null ? data.get("reg_last_number").toString() : null);
        if (data.containsKey("staff_id_prefix"))
            settings.setStaffIdPrefix(
                    data.get("staff_id_prefix") != null ? data.get("staff_id_prefix").toString() : null);
        if (data.containsKey("staff_id_suffix"))
            settings.setStaffIdSuffix(
                    data.get("staff_id_suffix") != null ? data.get("staff_id_suffix").toString() : null);
        if (data.containsKey("staff_id_start_from"))
            settings.setStaffIdStartFrom(
                    data.get("staff_id_start_from") != null ? data.get("staff_id_start_from").toString() : null);
        if (data.containsKey("staff_id_mode"))
            settings.setStaffIdMode(data.get("staff_id_mode") != null ? data.get("staff_id_mode").toString() : null);
        if (data.containsKey("staff_id_last_number"))
            settings.setStaffIdLastNumber(
                    data.get("staff_id_last_number") != null ? data.get("staff_id_last_number").toString() : null);
        if (data.containsKey("course_id_prefix"))
            settings.setCourseIdPrefix(
                    data.get("course_id_prefix") != null ? data.get("course_id_prefix").toString() : null);
        if (data.containsKey("course_id_suffix"))
            settings.setCourseIdSuffix(
                    data.get("course_id_suffix") != null ? data.get("course_id_suffix").toString() : null);
        if (data.containsKey("course_id_start_from"))
            settings.setCourseIdStartFrom(
                    data.get("course_id_start_from") != null ? data.get("course_id_start_from").toString() : null);
        if (data.containsKey("course_id_mode"))
            settings.setCourseIdMode(data.get("course_id_mode") != null ? data.get("course_id_mode").toString() : null);
        if (data.containsKey("course_id_last_number"))
            settings.setCourseIdLastNumber(
                    data.get("course_id_last_number") != null ? data.get("course_id_last_number").toString() : null);
        if (data.containsKey("appearance_color"))
            settings.setAppearanceColor(
                    data.get("appearance_color") != null ? data.get("appearance_color").toString() : null);
        if (data.containsKey("appearance_mode"))
            settings.setAppearanceMode(
                    data.get("appearance_mode") != null ? data.get("appearance_mode").toString() : null);

        Object adminAsStaffRaw = null;
        if (data.containsKey("adminAsStaff"))
            adminAsStaffRaw = data.get("adminAsStaff");
        if (adminAsStaffRaw == null && data.containsKey("admin_as_staff"))
            adminAsStaffRaw = data.get("admin_as_staff");
        if (adminAsStaffRaw != null)
            settings.setAdminAsStaff(parseBooleanInt(adminAsStaffRaw));

        Object allowPerfExamsRaw = null;
        if (data.containsKey("allowPerformanceExams"))
            allowPerfExamsRaw = data.get("allowPerformanceExams");
        if (allowPerfExamsRaw == null && data.containsKey("allow_performance_exams"))
            allowPerfExamsRaw = data.get("allow_performance_exams");
        if (allowPerfExamsRaw != null)
            settings.setAllowPerformanceExams(parseBooleanInt(allowPerfExamsRaw));

        // The frontend historically sends snake_case; keep supporting camelCase too.
        Object enableBranchesRaw = null;
        if (data.containsKey("enableMultipleBranches"))
            enableBranchesRaw = data.get("enableMultipleBranches");
        if (enableBranchesRaw == null && data.containsKey("enable_multiple_branches"))
            enableBranchesRaw = data.get("enable_multiple_branches");
        if (enableBranchesRaw != null)
            settings.setEnableMultipleBranches(parseBooleanInt(enableBranchesRaw));

        Object enableStdCoursesRaw = null;
        if (data.containsKey("enableStandardCourses"))
            enableStdCoursesRaw = data.get("enableStandardCourses");
        if (enableStdCoursesRaw == null && data.containsKey("enable_standard_courses"))
            enableStdCoursesRaw = data.get("enable_standard_courses");
        if (enableStdCoursesRaw != null)
            settings.setEnableStandardCourses(parseBooleanInt(enableStdCoursesRaw));

        Object enableExamsRaw = null;
        if (data.containsKey("enableExams"))
            enableExamsRaw = data.get("enableExams");
        if (enableExamsRaw == null && data.containsKey("enable_exams"))
            enableExamsRaw = data.get("enable_exams");
        if (enableExamsRaw != null)
            settings.setEnableExams(parseBooleanInt(enableExamsRaw));

        Object enableExpensesRaw = null;
        if (data.containsKey("enableExpenses"))
            enableExpensesRaw = data.get("enableExpenses");
        if (enableExpensesRaw == null && data.containsKey("enable_expenses"))
            enableExpensesRaw = data.get("enable_expenses");
        if (enableExpensesRaw != null)
            settings.setEnableExpenses(parseBooleanInt(enableExpensesRaw));

        Object enableStudyMatRaw = null;
        if (data.containsKey("enableStudyMaterial"))
            enableStudyMatRaw = data.get("enableStudyMaterial");
        if (enableStudyMatRaw == null && data.containsKey("enable_study_material"))
            enableStudyMatRaw = data.get("enable_study_material");
        if (enableStudyMatRaw != null)
            settings.setEnableStudyMaterial(parseBooleanInt(enableStudyMatRaw));

        Object enableProgramsRaw = null;
        if (data.containsKey("enablePrograms"))
            enableProgramsRaw = data.get("enablePrograms");
        if (enableProgramsRaw == null && data.containsKey("enable_programs"))
            enableProgramsRaw = data.get("enable_programs");
        if (enableProgramsRaw != null)
            settings.setEnablePrograms(parseBooleanInt(enableProgramsRaw));

        if (data.containsKey("basic_settings") || data.containsKey("basicSettings")
                || data.containsKey("allowPast") || data.containsKey("allowFuture")
                || data.containsKey("allow_schedule_past_dates") || data.containsKey("allowSchedulePastDates")
                || data.containsKey("allow_schedule_future_dates") || data.containsKey("allowScheduleFutureDates")) {
            Map<String, Object> basicMap = new LinkedHashMap<>();
            if (settings.getBasicSettings() != null && !settings.getBasicSettings().isBlank()) {
                try {
                    Map<String, Object> existing = new com.fasterxml.jackson.databind.ObjectMapper().readValue(settings.getBasicSettings(), Map.class);
                    if (existing != null) basicMap.putAll(existing);
                } catch (Exception ignored) {}
            }
            if (data.containsKey("basic_settings") && data.get("basic_settings") != null) {
                Object val = data.get("basic_settings");
                if (val instanceof String s && !s.isBlank()) {
                    try {
                        Map<String, Object> parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue(s, Map.class);
                        if (parsed != null) basicMap.putAll(parsed);
                    } catch (Exception ignored) {}
                } else if (val instanceof Map m) {
                    basicMap.putAll(m);
                }
            }
            if (data.containsKey("basicSettings") && data.get("basicSettings") != null) {
                Object val = data.get("basicSettings");
                if (val instanceof String s && !s.isBlank()) {
                    try {
                        Map<String, Object> parsed = new com.fasterxml.jackson.databind.ObjectMapper().readValue(s, Map.class);
                        if (parsed != null) basicMap.putAll(parsed);
                    } catch (Exception ignored) {}
                } else if (val instanceof Map m) {
                    basicMap.putAll(m);
                }
            }
            if (data.containsKey("allowPast")) {
                Integer p = parseBooleanInt(data.get("allowPast"));
                if (p != null) basicMap.put("allowPast", p == 1);
            } else if (data.containsKey("allow_schedule_past_dates")) {
                Integer p = parseBooleanInt(data.get("allow_schedule_past_dates"));
                if (p != null) basicMap.put("allowPast", p == 1);
            } else if (data.containsKey("allowSchedulePastDates")) {
                Integer p = parseBooleanInt(data.get("allowSchedulePastDates"));
                if (p != null) basicMap.put("allowPast", p == 1);
            }
            if (data.containsKey("allowFuture")) {
                Integer f = parseBooleanInt(data.get("allowFuture"));
                if (f != null) basicMap.put("allowFuture", f == 1);
            } else if (data.containsKey("allow_schedule_future_dates")) {
                Integer f = parseBooleanInt(data.get("allow_schedule_future_dates"));
                if (f != null) basicMap.put("allowFuture", f == 1);
            } else if (data.containsKey("allowScheduleFutureDates")) {
                Integer f = parseBooleanInt(data.get("allowScheduleFutureDates"));
                if (f != null) basicMap.put("allowFuture", f == 1);
            }
            try {
                String json = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(basicMap);
                settings.setBasicSettings(json);
            } catch (Exception ignored) {}
        }

        if (data.containsKey("gdrive_backup_url"))
            settings.setGdriveBackupUrl(data.get("gdrive_backup_url") != null ? data.get("gdrive_backup_url").toString() : null);
        if (data.containsKey("gdriveBackupUrl"))
            settings.setGdriveBackupUrl(data.get("gdriveBackupUrl") != null ? data.get("gdriveBackupUrl").toString() : null);
        if (data.containsKey("backup_frequency"))
            settings.setBackupFrequency(data.get("backup_frequency") != null ? data.get("backup_frequency").toString() : null);
        if (data.containsKey("backupFrequency"))
            settings.setBackupFrequency(data.get("backupFrequency") != null ? data.get("backupFrequency").toString() : null);

        // SMTP settings persistence
        if (data.containsKey("smtpHost") || data.containsKey("smtp_host"))
            settings.setSmtpHost(data.containsKey("smtpHost") ? (data.get("smtpHost") != null ? data.get("smtpHost").toString() : null) : (data.get("smtp_host") != null ? data.get("smtp_host").toString() : null));
        if (data.containsKey("smtpPort") || data.containsKey("smtp_port")) {
            Object val = data.containsKey("smtpPort") ? data.get("smtpPort") : data.get("smtp_port");
            if (val != null && !val.toString().isBlank()) {
                try {
                    settings.setSmtpPort(Integer.parseInt(val.toString().trim()));
                } catch (Exception e) {
                    settings.setSmtpPort(587);
                }
            } else {
                settings.setSmtpPort(587);
            }
        }
        if (data.containsKey("smtpUsername") || data.containsKey("smtp_username"))
            settings.setSmtpUsername(data.containsKey("smtpUsername") ? (data.get("smtpUsername") != null ? data.get("smtpUsername").toString() : null) : (data.get("smtp_username") != null ? data.get("smtp_username").toString() : null));
        if (data.containsKey("smtpPassword") || data.containsKey("smtp_password"))
            settings.setSmtpPassword(data.containsKey("smtpPassword") ? (data.get("smtpPassword") != null ? data.get("smtpPassword").toString() : null) : (data.get("smtp_password") != null ? data.get("smtp_password").toString() : null));
        if (data.containsKey("smtpFromEmail") || data.containsKey("smtp_from_email"))
            settings.setSmtpFromEmail(data.containsKey("smtpFromEmail") ? (data.get("smtpFromEmail") != null ? data.get("smtpFromEmail").toString() : null) : (data.get("smtp_from_email") != null ? data.get("smtp_from_email").toString() : null));
        if (data.containsKey("smtpFromName") || data.containsKey("smtp_from_name"))
            settings.setSmtpFromName(data.containsKey("smtpFromName") ? (data.get("smtpFromName") != null ? data.get("smtpFromName").toString() : null) : (data.get("smtp_from_name") != null ? data.get("smtp_from_name").toString() : null));
        if (data.containsKey("smtpEncryption") || data.containsKey("smtp_encryption"))
            settings.setSmtpEncryption(data.containsKey("smtpEncryption") ? (data.get("smtpEncryption") != null ? data.get("smtpEncryption").toString() : null) : (data.get("smtp_encryption") != null ? data.get("smtp_encryption").toString() : null));
        if (data.containsKey("enableSmtp") || data.containsKey("enable_smtp")) {
            Object val = data.containsKey("enableSmtp") ? data.get("enableSmtp") : data.get("enable_smtp");
            settings.setEnableSmtp(parseBooleanInt(val));
        }
        if (data.containsKey("smtpTriggers") || data.containsKey("smtp_triggers"))
            settings.setSmtpTriggers(data.containsKey("smtpTriggers") ? (data.get("smtpTriggers") != null ? data.get("smtpTriggers").toString() : null) : (data.get("smtp_triggers") != null ? data.get("smtp_triggers").toString() : null));

        if (settings.getName() == null) {
            settings.setName(settings.getInstituteName() != null ? settings.getInstituteName() : "Institute");
        }
        settings.setUpdatedAt(LocalDateTime.now());
        settingRepo.save(settings);

        if (jdbcTemplate != null && settings.getId() != null) {
            try {
                jdbcTemplate.update(
                    "UPDATE institute_settings SET basic_settings = ? WHERE id = ?",
                    settings.getBasicSettings(),
                    settings.getId()
                );
            } catch (Exception ignored) {}
        }
    }

    // ============ ABOUT DETAILS & DB BACKUP ============

    @Transactional(readOnly = true)
    public Map<String, Object> getAboutDetails() {
        InstituteSetting settings = getCurrentTenantSettings();
        String currentTenantCode = com.institute.tenant.TenantContext.getTenantId();

        Map<String, Object> result = new LinkedHashMap<>();

        // Institute Specs
        Map<String, Object> instInfo = new LinkedHashMap<>();
        instInfo.put("name", settings.getInstituteName() != null ? settings.getInstituteName() : settings.getName());
        instInfo.put("email", settings.getEmail());
        instInfo.put("phone", settings.getPhone());
        instInfo.put("address", settings.getAddress());
        instInfo.put("registrationId", settings.getRegistrationId());
        instInfo.put("logoPath", settings.getLogoPath());

        // Stats
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalStudents", studentRepo.findAllByOrderByRegNumberAsc().size());
        stats.put("totalStaff", staffRepo.findAll().size());
        stats.put("totalCourses", courseRepo.findAll().size());
        stats.put("totalBatches", batchRepo.findAll().size());

        // Plan Info
        Map<String, Object> planInfo = new LinkedHashMap<>();
        String planName = "Basic Plan";
        String status = "Active";
        Integer maxStudents = 500;
        Integer maxStaff = 50;
        String dbMode = "Shared Multi-Tenant (MySQL)";

        if (tenantRepo != null) {
            Optional<Tenant> tOpt = Optional.empty();
            if (currentTenantCode != null && !currentTenantCode.isBlank()) {
                tOpt = tenantRepo.findByTenantCode(currentTenantCode);
                if (tOpt.isEmpty()) {
                    tOpt = tenantRepo.findByTenantCodeIgnoreCase(currentTenantCode);
                }
            }
            if (tOpt.isEmpty()) {
                List<Tenant> allTenants = tenantRepo.findAll();
                if (!allTenants.isEmpty()) {
                    tOpt = Optional.of(allTenants.get(0));
                }
            }
            if (tOpt.isPresent()) {
                Tenant tenant = tOpt.get();
                if (tenant.getPlan() != null && !tenant.getPlan().isBlank()) {
                    String p = tenant.getPlan().trim();
                    planName = p.substring(0, 1).toUpperCase() + p.substring(1).toLowerCase() + " Plan";
                }
                if (tenant.getStatus() != null) status = tenant.getStatus().substring(0, 1).toUpperCase() + tenant.getStatus().substring(1);
                if (tenant.getMaxStudents() != null) maxStudents = tenant.getMaxStudents();
                if (tenant.getMaxStaff() != null) maxStaff = tenant.getMaxStaff();
                if (tenant.getDatabaseType() != null) dbMode = tenant.getDatabaseType().equalsIgnoreCase("dedicated") ? "Dedicated Database" : "Shared Multi-Tenant Database";
            }
        }

        if (jdbcTemplate != null && ("Basic Plan".equals(planName) || planName == null)) {
            try {
                List<Map<String, Object>> tRows = jdbcTemplate.queryForList("SELECT plan, status, database_type FROM tenants LIMIT 1");
                if (!tRows.isEmpty()) {
                    Map<String, Object> r = tRows.get(0);
                    if (r.get("plan") != null && !r.get("plan").toString().isBlank()) {
                        String p = r.get("plan").toString().trim();
                        planName = p.substring(0, 1).toUpperCase() + p.substring(1).toLowerCase() + " Plan";
                    }
                    if (r.get("status") != null && !r.get("status").toString().isBlank()) {
                        String s = r.get("status").toString().trim();
                        status = s.substring(0, 1).toUpperCase() + s.substring(1).toLowerCase();
                    }
                    if (r.get("database_type") != null) {
                        dbMode = "dedicated".equalsIgnoreCase(r.get("database_type").toString()) ? "Dedicated Database" : "Shared Multi-Tenant Database";
                    }
                }
            } catch (Exception ignored) {}
        }

        planInfo.put("planName", planName);
        planInfo.put("status", status);
        planInfo.put("maxStudents", maxStudents);
        planInfo.put("maxStaff", maxStaff);
        planInfo.put("databaseMode", dbMode);
        planInfo.put("version", "Classivo CMS v2.4.0 PRO");
        planInfo.put("supportEmail", "support@classivo.app");

        // Backup Settings
        Map<String, Object> backupInfo = new LinkedHashMap<>();
        backupInfo.put("gdriveBackupUrl", settings.getGdriveBackupUrl());
        backupInfo.put("backupFrequency", settings.getBackupFrequency() != null ? settings.getBackupFrequency() : "Daily");
        backupInfo.put("lastBackupAt", settings.getLastBackupAt());

        result.put("institute", instInfo);
        result.put("stats", stats);
        result.put("plan", planInfo);
        result.put("backup", backupInfo);

        return result;
    }

    @Transactional
    public String exportDatabaseSqlDump() {
        StringBuilder sql = new StringBuilder();
        sql.append("-- Classivo Institute Management System Database Backup\n");
        sql.append("-- Generated At: ").append(LocalDateTime.now()).append("\n");
        sql.append("-- Tenant Context: ").append(com.institute.tenant.TenantContext.getTenantId()).append("\n\n");
        sql.append("SET FOREIGN_KEY_CHECKS = 0;\n\n");

        if (jdbcTemplate != null) {
            try {
                List<String> tables = jdbcTemplate.queryForList(
                    "SELECT table_name FROM information_schema.tables WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE'",
                    String.class
                );

                for (String table : tables) {
                    sql.append("-- Structure for table `").append(table).append("` --\n");
                    sql.append("DROP TABLE IF EXISTS `").append(table).append("`;\n");

                    List<Map<String, Object>> showCreateTable = jdbcTemplate.queryForList("SHOW CREATE TABLE `" + table + "`");
                    if (!showCreateTable.isEmpty()) {
                        Object createStmtObj = showCreateTable.get(0).get("Create Table");
                        if (createStmtObj == null) createStmtObj = showCreateTable.get(0).get("CREATE TABLE");
                        if (createStmtObj != null) {
                            sql.append(createStmtObj.toString()).append(";\n\n");
                        }
                    }

                    List<Map<String, Object>> rows = jdbcTemplate.queryForList("SELECT * FROM `" + table + "`");
                    if (!rows.isEmpty()) {
                        sql.append("-- Data for table `").append(table).append("` --\n");
                        for (Map<String, Object> row : rows) {
                            sql.append("INSERT INTO `").append(table).append("` (");
                            String cols = row.keySet().stream().map(c -> "`" + c + "`").collect(Collectors.joining(", "));
                            sql.append(cols).append(") VALUES (");
                            String vals = row.values().stream().map(v -> {
                                if (v == null) return "NULL";
                                String s = v.toString().replace("'", "''").replace("\\", "\\\\");
                                return "'" + s + "'";
                            }).collect(Collectors.joining(", "));
                            sql.append(vals).append(");\n");
                        }
                        sql.append("\n");
                    }
                }
            } catch (Exception e) {
                sql.append("-- Backup metadata dump note: ").append(e.getMessage()).append("\n");
            }
        }

        sql.append("SET FOREIGN_KEY_CHECKS = 1;\n");

        // Update last backup timestamp in settings
        try {
            InstituteSetting s = getCurrentTenantSettings();
            s.setLastBackupAt(LocalDateTime.now());
            settingRepo.save(s);
        } catch (Exception ignored) {}

        return sql.toString();
    }

    // ============ AUTO-ID GENERATION (Institute_model.php lines 750-849)
    // ============

    /**
     * Migrated from: Institute_model.php -> generate_and_assign_reg() lines 766-785
     */
    @Transactional
    public void generateAndAssignReg(Long studentId) {
        Student student = studentRepo.findById(studentId).orElse(null);
        if (student == null || (student.getRegNumber() != null && !student.getRegNumber().isEmpty()))
            return;

        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || !"auto".equals(settings.getRegMode()))
            return;

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
        if (submittedRegNumber == null || submittedRegNumber.isBlank())
            return;

        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || settings.getRegMode() == null || !"auto".equalsIgnoreCase(settings.getRegMode()))
            return;

        String expectedNext = getNextRegNumber();
        if (!submittedRegNumber.trim().equals(expectedNext))
            return;

        int start = settings.getRegStartFrom() != null ? Integer.parseInt(settings.getRegStartFrom()) : 1;
        int last = settings.getRegLastNumber() != null ? Integer.parseInt(settings.getRegLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);

        settings.setRegLastNumber(String.valueOf(next));
        settingRepo.save(settings);
    }

    /**
     * Migrated from: Institute_model.php -> generate_and_assign_staff_id() lines
     * 801-817
     */
    @Transactional
    public void generateAndAssignStaffId(Long staffDbId) {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || !"auto".equals(settings.getStaffIdMode()))
            return;

        String prefix = settings.getStaffIdPrefix() != null ? settings.getStaffIdPrefix() : "STF";
        String suffix = settings.getStaffIdSuffix() != null ? settings.getStaffIdSuffix() : "";
        int start = settings.getStaffIdStartFrom() != null ? Integer.parseInt(settings.getStaffIdStartFrom()) : 1;
        int last = settings.getStaffIdLastNumber() != null ? Integer.parseInt(settings.getStaffIdLastNumber())
                : (start - 1);
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
     * Migrated from: Institute_model.php -> generate_and_assign_course_id() lines
     * 833-849
     */
    @Transactional
    public void generateAndAssignCourseId(Long courseDbId) {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null || !"auto".equals(settings.getCourseIdMode()))
            return;

        String prefix = settings.getCourseIdPrefix() != null ? settings.getCourseIdPrefix() : "CRS";
        String suffix = settings.getCourseIdSuffix() != null ? settings.getCourseIdSuffix() : "";
        int start = settings.getCourseIdStartFrom() != null ? Integer.parseInt(settings.getCourseIdStartFrom()) : 1;
        int last = settings.getCourseIdLastNumber() != null ? Integer.parseInt(settings.getCourseIdLastNumber())
                : (start - 1);
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
        if (settings == null)
            return "REG-001";
        String prefix = settings.getRegPrefix() != null ? settings.getRegPrefix() : "STU";
        String suffix = settings.getRegSuffix() != null ? settings.getRegSuffix() : "";
        int start = settings.getRegStartFrom() != null ? Integer.parseInt(settings.getRegStartFrom()) : 1;
        int last = settings.getRegLastNumber() != null ? Integer.parseInt(settings.getRegLastNumber()) : (start - 1);
        int next = Math.max(last + 1, start);
        return (prefix + "-" + String.format("%03d", next) + (suffix.isEmpty() ? "" : "-" + suffix)).trim();
    }

    public String getNextStaffId() {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null)
            return "STF-001";
        String prefix = settings.getStaffIdPrefix() != null ? settings.getStaffIdPrefix() : "STF";
        String suffix = settings.getStaffIdSuffix() != null ? settings.getStaffIdSuffix() : "";
        int start = settings.getStaffIdStartFrom() != null ? Integer.parseInt(settings.getStaffIdStartFrom()) : 1;
        int last = settings.getStaffIdLastNumber() != null ? Integer.parseInt(settings.getStaffIdLastNumber())
                : (start - 1);
        int next = Math.max(last + 1, start);
        return (prefix + "-" + String.format("%03d", next) + (suffix.isEmpty() ? "" : "-" + suffix)).trim();
    }

    public String getNextCourseId() {
        InstituteSetting settings = getCurrentTenantSettings();
        if (settings == null)
            return "CRS-001";
        String prefix = settings.getCourseIdPrefix() != null ? settings.getCourseIdPrefix() : "CRS";
        String suffix = settings.getCourseIdSuffix() != null ? settings.getCourseIdSuffix() : "";
        int start = settings.getCourseIdStartFrom() != null ? Integer.parseInt(settings.getCourseIdStartFrom()) : 1;
        int last = settings.getCourseIdLastNumber() != null ? Integer.parseInt(settings.getCourseIdLastNumber())
                : (start - 1);
        int next = Math.max(last + 1, start);
        return (prefix + "-" + String.format("%03d", next) + (suffix.isEmpty() ? "" : "-" + suffix)).trim();
    }

    // ============ NOTIFICATIONS & ACTIVITY (Institute_model.php lines 485-517)
    // ============

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

        Course course = batch.getCourseId() != null ? courseRepo.findById(batch.getCourseId()).orElse(null) : null;
        String courseName = course != null ? course.getName() : (batch.getSubject() != null ? batch.getSubject() : "Course");
        String title = "Batch Starting Today";
        String message = "Batch '" + batch.getBatchName() + "' for " + courseName + " starts today.";

        userRepo.findAdminUsers()
                .forEach(user -> createNotificationOncePerDay(user.getId(), "user", title, message, "batch"));

        staffRepo.findAll()
                .forEach(staff -> createNotificationOncePerDay(staff.getId(), "staff", title, message, "batch"));
    }

    private void createNotificationOncePerDay(Long userId, String userType, String title, String message, String type) {
        LocalDate today = LocalDate.now();
        LocalDateTime startOfDay = today.atStartOfDay();
        LocalDateTime endOfDay = today.plusDays(1).atStartOfDay().minusNanos(1);
        boolean exists = notificationRepo.existsByUserIdAndUserTypeAndTitleAndMessageAndTypeAndCreatedAtBetween(
                userId, userType, title, message, type, startOfDay, endOfDay);
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
            students.forEach(s -> {
                s.setStatus("completed");
                studentRepo.save(s);
            });
            // Also mark batch as completed
            batchRepo.findById(batchId).ifPresent(b -> {
                b.setStatus("completed");
                batchRepo.save(b);
            });
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

        LocalDate classDate = data.containsKey("class_date") && data.get("class_date") != null
                ? LocalDate.parse(data.get("class_date").toString())
                : LocalDate.now();

        // Enforce past and future scheduling settings boundary
        InstituteSetting currentSettings = getCurrentTenantSettings();
        boolean allowPast = currentSettings != null && currentSettings.getAllowSchedulePastDates() != null && currentSettings.getAllowSchedulePastDates() == 1;
        boolean allowFuture = currentSettings != null && currentSettings.getAllowScheduleFutureDates() != null && currentSettings.getAllowScheduleFutureDates() == 1;
        LocalDate today = LocalDate.now();

        if (classDate.isBefore(today) && !allowPast) {
            throw new IllegalArgumentException("Scheduling classes for past dates is disabled in settings.");
        }
        if (classDate.isAfter(today) && !allowFuture) {
            throw new IllegalArgumentException("Scheduling classes for future dates is disabled in settings.");
        }

        // Enforce course schedule day and date validation
        Long courseIdToValidate = null;
        if (data.containsKey("course_id") && data.get("course_id") != null) {
            courseIdToValidate = parseLong(data.get("course_id"), null);
        }
        if (courseIdToValidate == null && batchId != null) {
            courseIdToValidate = batchRepo.findById(batchId).map(Batch::getCourseId).orElse(null);
        }
        if (courseIdToValidate == null && studentId != null) {
            courseIdToValidate = studentRepo.findById(studentId).map(Student::getCourseId).orElse(null);
        }
        if (courseIdToValidate != null) {
            Course course = courseRepo.findById(courseIdToValidate).orElse(null);
            if (course != null) {
                validateCourseScheduleForDate(course, classDate);
            }
        }

        sc.setStaffId(resolvedStaffId);
        sc.setBatchId(batchId);
        sc.setStudentId(studentId);
        if (data.containsKey("topic"))
            sc.setTopic((String) data.get("topic"));
        sc.setClassDate(classDate);
        if (data.containsKey("start_time"))
            sc.setStartTime((String) data.get("start_time"));
        if (data.containsKey("end_time"))
            sc.setEndTime((String) data.get("end_time"));
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
        if (normalized.isEmpty() || "null".equalsIgnoreCase(normalized) || "undefined".equalsIgnoreCase(normalized)) {
            return defaultValue;
        }
        try {
            return Long.valueOf(normalized);
        } catch (NumberFormatException e) {
            return defaultValue;
        }
    }

    public boolean deleteSchedule(Long id) {
        scheduledClassRepo.deleteById(id);
        return true;
    }

    @Transactional
    public List<Map<String, Object>> getStaffSchedule(Long requestingStaffId, Long targetStaffId, LocalDate date) {
        if (date == null)
            date = LocalDate.now();

        // Heal legacy data missing tenant_id (caused by missing @EntityListeners on
        // ScheduledClass)
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

    // ============ ONE-TO-ONE ALLOCATION (Institute_model.php lines 138-146)
    // ============

    public boolean updateOneToOneAllocation(Long studentId, Map<String, Object> data) {
        Student student = studentRepo.findById(studentId).orElse(null);
        if (student == null)
            return false;

        if (data.containsKey("subjectAllocations") && data.get("subjectAllocations") != null) {
            student.setSubjectAllocations((String) data.get("subjectAllocations"));
        } else {
            if (data.containsKey("instructor"))
                student.setInstructor(data.get("instructor") != null ? data.get("instructor").toString() : null);
            if (data.containsKey("timing"))
                student.setTiming((String) data.get("timing"));
            if (data.containsKey("startDate") && data.get("startDate") != null
                    && !data.get("startDate").toString().isEmpty()) {
                student.setStartDate(LocalDate.parse(data.get("startDate").toString()));
            }
            if (data.containsKey("status"))
                student.setStatus((String) data.get("status"));
        }

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
                    if (matchesSubjectAllocations(student.get("subject_allocations"), staffId)) {
                        return true;
                    }
                    if (matchesSubjectAllocations(student.get("subjectAllocations"), staffId)) {
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

        getStudentsForStaff(staffId).stream()
                .map(student -> student.get("course_id"))
                .filter(Objects::nonNull)
                .map(value -> Long.valueOf(value.toString()))
                .forEach(courseIds::add);

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
                map.put("schedule_type", course.getScheduleType() != null ? course.getScheduleType() : "Weekdays");
                map.put("scheduleType", course.getScheduleType() != null ? course.getScheduleType() : "Weekdays");
                map.put("custom_days", course.getCustomDays());
                map.put("customDays", course.getCustomDays());
                map.put("course_type", course.getCourseType());
                map.put("courseType", course.getCourseType());
                map.put("valid_from", course.getValidFrom());
                map.put("validFrom", course.getValidFrom());
                map.put("valid_to", course.getValidTo());
                map.put("validTo", course.getValidTo());
                result.add(map);
            });
        }
        return result;
    }

    public Map<String, Object> getStaffResources(Long staffId) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("batches", getBatchesForStaff(staffId));
        data.put("students", getStudentsForStaff(staffId));
        data.put("courses", getCoursesForStaff(staffId));
        return data;
    }

    @Transactional
    public int clonePreviousSchedule(Long staffId, LocalDate targetDate) {
        if (staffId == null || targetDate == null) {
            return 0;
        }

        // Enforce past and future scheduling settings boundary
        InstituteSetting currentSettings = getCurrentTenantSettings();
        boolean allowPast = currentSettings != null && currentSettings.getAllowSchedulePastDates() != null && currentSettings.getAllowSchedulePastDates() == 1;
        boolean allowFuture = currentSettings != null && currentSettings.getAllowScheduleFutureDates() != null && currentSettings.getAllowScheduleFutureDates() == 1;
        LocalDate today = LocalDate.now();

        if (targetDate.isBefore(today) && !allowPast) {
            throw new IllegalArgumentException("Scheduling classes for past dates is disabled in settings.");
        }
        if (targetDate.isAfter(today) && !allowFuture) {
            throw new IllegalArgumentException("Scheduling classes for future dates is disabled in settings.");
        }

        LocalDate previousDate = targetDate.minusDays(1);
        List<ScheduledClass> previousClasses = scheduledClassRepo.findByStaffIdAndClassDateOrderByStartTimeAsc(staffId,
                previousDate);
        Set<String> existingKeys = scheduledClassRepo.findByStaffIdAndClassDateOrderByStartTimeAsc(staffId, targetDate)
                .stream()
                .map(this::scheduleKey)
                .collect(Collectors.toSet());

        int copied = 0;
        for (ScheduledClass previousClass : previousClasses) {
            if (existingKeys.contains(scheduleKey(previousClass))) {
                continue;
            }

            // Ensure course of previous class is permitted to run on targetDate
            Long courseId = null;
            if (previousClass.getBatchId() != null) {
                courseId = batchRepo.findById(previousClass.getBatchId()).map(Batch::getCourseId).orElse(null);
            } else if (previousClass.getStudentId() != null) {
                courseId = studentRepo.findById(previousClass.getStudentId()).map(Student::getCourseId).orElse(null);
            }
            if (courseId != null) {
                Course course = courseRepo.findById(courseId).orElse(null);
                if (course != null) {
                    try {
                        validateCourseScheduleForDate(course, targetDate);
                    } catch (IllegalArgumentException e) {
                        // Skip cloning classes that are not scheduled for targetDate's day
                        continue;
                    }
                }
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

    public void validateCourseScheduleForDate(Course course, LocalDate classDate) {
        if (course == null || classDate == null) {
            return;
        }

        if (course.getValidFrom() != null && classDate.isBefore(course.getValidFrom())) {
            throw new IllegalArgumentException(
                    "Cannot schedule class for '" + course.getName() + "': Course is only valid starting from " + course.getValidFrom());
        }
        if (course.getValidTo() != null && classDate.isAfter(course.getValidTo())) {
            throw new IllegalArgumentException(
                    "Cannot schedule class for '" + course.getName() + "': Course validity ended on " + course.getValidTo());
        }

        java.time.DayOfWeek dow = classDate.getDayOfWeek();
        String dayName = dow.name();
        boolean isWeekend = (dow == java.time.DayOfWeek.SATURDAY || dow == java.time.DayOfWeek.SUNDAY);
        boolean isWeekday = !isWeekend;

        String scheduleType = course.getScheduleType();
        if (scheduleType == null || scheduleType.isBlank()) {
            scheduleType = "Weekdays";
        }
        String st = scheduleType.trim().toLowerCase();

        boolean allowed = true;
        if (st.equals("weekends") || (st.contains("weekend") && !st.contains("weekday"))) {
            allowed = isWeekend;
        } else if (st.equals("all days") || st.contains("all") || (st.contains("weekday") && st.contains("weekend"))) {
            allowed = true;
        } else if (st.equals("weekdays + saturday") || (st.contains("weekday") && st.contains("sat"))) {
            allowed = (dow != java.time.DayOfWeek.SUNDAY);
        } else if (st.equals("weekdays") || st.contains("weekday")) {
            allowed = isWeekday;
        } else if (st.equals("custom days") || st.contains("custom")) {
            String customDays = course.getCustomDays();
            if (customDays != null && !customDays.isBlank()) {
                String dayCode = switch (dow) {
                    case MONDAY -> "Mon";
                    case TUESDAY -> "Tue";
                    case WEDNESDAY -> "Wed";
                    case THURSDAY -> "Thu";
                    case FRIDAY -> "Fri";
                    case SATURDAY -> "Sat";
                    case SUNDAY -> "Sun";
                };
                String lower = customDays.toLowerCase();
                allowed = lower.contains(dayCode.toLowerCase()) || lower.contains(dayName.toLowerCase());
            } else {
                allowed = isWeekday;
            }
        } else {
            allowed = isWeekday;
        }

        if (!allowed) {
            String formattedDay = dayName.charAt(0) + dayName.substring(1).toLowerCase();
            throw new IllegalArgumentException(
                    "Cannot schedule class for '" + course.getName() + "': It is configured as a " + course.getScheduleType()
                            + " course and cannot be scheduled on " + formattedDay + " (" + classDate + ").");
        }
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
                    courseRepo.findById(student.getCourseId())
                            .ifPresent(course -> map.put("course_name", course.getName()));
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
        if (candidateValue == null || staffId == null)
            return false;
        String val = candidateValue.toString().trim();
        if (val.isEmpty())
            return false;
        if (val.equals(String.valueOf(staffId)))
            return true;

        Staff staff = staffRepo.findById(staffId).orElse(null);
        if (staff != null && staff.getName() != null && !staff.getName().trim().isEmpty()) {
            if (val.equalsIgnoreCase(staff.getName().trim())) {
                return true;
            }
        }
        return false;
    }

    private boolean matchesSubjectAllocations(Object subjectAllocationsObj, Long staffId) {
        if (subjectAllocationsObj == null || staffId == null)
            return false;
        String jsonStr = subjectAllocationsObj.toString().trim();
        if (jsonStr.isEmpty() || "null".equalsIgnoreCase(jsonStr))
            return false;

        Staff staff = staffRepo.findById(staffId).orElse(null);
        String staffName = staff != null ? staff.getName() : null;
        String idStr = String.valueOf(staffId);

        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<?, ?> allocs = mapper.readValue(jsonStr, Map.class);
            if (allocs != null) {
                for (Object value : allocs.values()) {
                    if (value instanceof Map) {
                        Map<?, ?> item = (Map<?, ?>) value;
                        Object inst = item.get("instructor");
                        if (inst != null && matchesStaff(inst, staffId)) {
                            return true;
                        }
                    }
                }
            }
        } catch (Exception e) {
            if (jsonStr.contains("\"instructor\":\"" + idStr + "\"") ||
                    (staffName != null
                            && jsonStr.toLowerCase().contains("\"instructor\":\"" + staffName.toLowerCase() + "\""))) {
                return true;
            }
        }
        return false;
    }

    private String scheduleKey(ScheduledClass scheduledClass) {
        return String.join("|",
                String.valueOf(scheduledClass.getBatchId()),
                String.valueOf(scheduledClass.getStudentId()),
                String.valueOf(scheduledClass.getStartTime()),
                String.valueOf(scheduledClass.getEndTime()));
    }

    public static int parseDurationUnits(String duration, String feePeriod) {
        if (duration == null || feePeriod == null)
            return 1;
        String durClean = duration.toLowerCase().replaceAll("[^a-z0-9]", " ").trim();
        String periodClean = feePeriod.toLowerCase().trim();
        if (periodClean.contains("course") || periodClean.contains("one-time") || periodClean.contains("one time"))
            return 1;

        java.util.regex.Pattern p = java.util.regex.Pattern.compile("\\d+");
        java.util.regex.Matcher m = p.matcher(durClean);
        int number = 1;
        if (m.find()) {
            try {
                number = Integer.parseInt(m.group());
            } catch (Exception e) {
            }
        }

        if (periodClean.contains("day") || periodClean.contains("daily")) {
            if (durClean.contains("month"))
                return number * 30;
            if (durClean.contains("year"))
                return number * 365;
            if (durClean.contains("week"))
                return number * 7;
            return number;
        }
        if (periodClean.contains("week") || periodClean.contains("weekly")) {
            if (durClean.contains("month"))
                return number * 4;
            if (durClean.contains("year"))
                return number * 52;
            if (durClean.contains("day"))
                return Math.max(1, number / 7);
            return number;
        }
        if (periodClean.contains("month") || periodClean.contains("monthly")) {
            if (durClean.contains("year"))
                return number * 12;
            if (durClean.contains("week"))
                return Math.max(1, number / 4);
            if (durClean.contains("day"))
                return Math.max(1, number / 30);
            return number;
        }
        if (periodClean.contains("year") || periodClean.contains("yearly")) {
            if (durClean.contains("month"))
                return Math.max(1, number / 12);
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

        LocalDate joinDate = student.getJoiningDate() != null ? student.getJoiningDate()
                : (student.getStartDate() != null ? student.getStartDate()
                        : (student.getCreatedAt() != null ? student.getCreatedAt().toLocalDate() : LocalDate.now()));
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

        LocalDate joinDate = student.getJoiningDate() != null ? student.getJoiningDate()
                : (student.getStartDate() != null ? student.getStartDate()
                        : (student.getCreatedAt() != null ? student.getCreatedAt().toLocalDate() : LocalDate.now()));
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

    private Integer parseTimeToMinutes(String timeStr) {
        if (timeStr == null || timeStr.trim().isEmpty())
            return null;
        String trimmed = timeStr.trim();
        if (trimmed.matches("^\\d{1,2}:\\d{2}$")) {
            String[] parts = trimmed.split(":");
            int h = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            if (h >= 0 && h < 24 && m >= 0 && m < 60)
                return h * 60 + m;
        }
        java.util.regex.Pattern p12 = java.util.regex.Pattern.compile("^(\\d{1,2})(?::(\\d{2}))?\\s*(AM|PM)$",
                java.util.regex.Pattern.CASE_INSENSITIVE);
        java.util.regex.Matcher matcher = p12.matcher(trimmed);
        if (matcher.find()) {
            int h = Integer.parseInt(matcher.group(1));
            int m = matcher.group(2) != null ? Integer.parseInt(matcher.group(2)) : 0;
            String ampm = matcher.group(3).toUpperCase();
            if ("AM".equals(ampm) && h == 12)
                h = 0;
            else if ("PM".equals(ampm) && h != 12)
                h += 12;
            if (h >= 0 && h < 24 && m >= 0 && m < 60)
                return h * 60 + m;
        }
        return null;
    }

    private int[] parseRangeToMinutes(String timingStr) {
        if (timingStr == null || timingStr.trim().isEmpty())
            return null;
        String[] parts = timingStr.split("[-–—]|to");
        if (parts.length < 2)
            return null;
        Integer start = parseTimeToMinutes(parts[0]);
        Integer end = parseTimeToMinutes(parts[1]);
        if (start == null || end == null || start >= end)
            return null;
        return new int[] { start, end };
    }

    private boolean checkRangesOverlap(int[] r1, int[] r2) {
        if (r1 == null || r2 == null)
            return false;
        return r1[0] < r2[1] && r2[0] < r1[1];
    }

    // ============ ENQUIRIES ============

    public List<Enquiry> getEnquiries() {
        return enquiryRepo.findAll();
    }

    public Enquiry getEnquiryById(Long id) {
        return enquiryRepo.findById(id).orElse(null);
    }

    @Transactional
    public Enquiry createEnquiry(Map<String, Object> data) {
        String name = data.get("name") != null ? data.get("name").toString().trim() : "";
        if (name.isEmpty()) {
            throw new IllegalArgumentException("Customer/Candidate name is required");
        }

        Long courseId = data.get("courseId") != null && !data.get("courseId").toString().isBlank()
                ? Long.valueOf(data.get("courseId").toString())
                : null;
        String courseName = data.get("courseName") != null ? data.get("courseName").toString() : null;
        if (courseId != null && (courseName == null || courseName.isBlank())) {
            courseName = courseRepo.findById(courseId).map(Course::getName).orElse(null);
        }

        Long staffId = data.get("assignedStaffId") != null && !data.get("assignedStaffId").toString().isBlank()
                ? Long.valueOf(data.get("assignedStaffId").toString())
                : null;
        String staffName = data.get("assignedStaffName") != null ? data.get("assignedStaffName").toString() : null;
        if (staffId != null && (staffName == null || staffName.isBlank())) {
            staffName = staffRepo.findById(staffId).map(Staff::getName).orElse(null);
        }

        LocalDate followUpDate = null;
        if (data.get("followUpDate") != null && !data.get("followUpDate").toString().isBlank()) {
            try {
                followUpDate = LocalDate.parse(data.get("followUpDate").toString().substring(0, 10));
            } catch (Exception ignored) {}
        }

        Enquiry enquiry = Enquiry.builder()
                .name(name)
                .mobile(data.get("mobile") != null ? data.get("mobile").toString() : null)
                .email(data.get("email") != null ? data.get("email").toString() : null)
                .address(data.get("address") != null ? data.get("address").toString() : null)
                .courseId(courseId)
                .courseName(courseName)
                .enquiryType(data.get("enquiryType") != null ? data.get("enquiryType").toString() : "walk-in")
                .status(data.get("status") != null ? data.get("status").toString() : "new")
                .followUpDate(followUpDate)
                .assignedStaffId(staffId)
                .assignedStaffName(staffName)
                .referenceSource(data.get("referenceSource") != null ? data.get("referenceSource").toString() : null)
                .notes(data.get("notes") != null ? data.get("notes").toString() : null)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        Enquiry saved = enquiryRepo.save(enquiry);
        logActivity(0L, "admin", "New Enquiry Logged", "Enquiry logged for '" + saved.getName() + "'.");
        return saved;
    }

    @Transactional
    public Enquiry updateEnquiry(Long id, Map<String, Object> data) {
        Enquiry existing = enquiryRepo.findById(id).orElse(null);
        if (existing == null) {
            throw new IllegalArgumentException("Enquiry not found");
        }

        if (data.containsKey("name") && data.get("name") != null) {
            existing.setName(data.get("name").toString());
        }
        if (data.containsKey("mobile")) {
            existing.setMobile(data.get("mobile") != null ? data.get("mobile").toString() : null);
        }
        if (data.containsKey("email")) {
            existing.setEmail(data.get("email") != null ? data.get("email").toString() : null);
        }
        if (data.containsKey("address")) {
            existing.setAddress(data.get("address") != null ? data.get("address").toString() : null);
        }
        if (data.containsKey("courseId")) {
            Object cIdVal = data.get("courseId");
            Long cId = cIdVal != null && !cIdVal.toString().isBlank() ? Long.valueOf(cIdVal.toString()) : null;
            existing.setCourseId(cId);
            if (cId != null) {
                existing.setCourseName(courseRepo.findById(cId).map(Course::getName).orElse(null));
            }
        }
        if (data.containsKey("courseName") && data.get("courseName") != null) {
            existing.setCourseName(data.get("courseName").toString());
        }
        if (data.containsKey("enquiryType") && data.get("enquiryType") != null) {
            existing.setEnquiryType(data.get("enquiryType").toString());
        }
        if (data.containsKey("status") && data.get("status") != null) {
            existing.setStatus(data.get("status").toString());
        }
        if (data.containsKey("followUpDate")) {
            Object fVal = data.get("followUpDate");
            if (fVal != null && !fVal.toString().isBlank()) {
                try {
                    existing.setFollowUpDate(LocalDate.parse(fVal.toString().substring(0, 10)));
                } catch (Exception ignored) {}
            } else {
                existing.setFollowUpDate(null);
            }
        }
        if (data.containsKey("assignedStaffId")) {
            Object sIdVal = data.get("assignedStaffId");
            Long sId = sIdVal != null && !sIdVal.toString().isBlank() ? Long.valueOf(sIdVal.toString()) : null;
            existing.setAssignedStaffId(sId);
            if (sId != null) {
                existing.setAssignedStaffName(staffRepo.findById(sId).map(Staff::getName).orElse(null));
            }
        }
        if (data.containsKey("referenceSource")) {
            existing.setReferenceSource(data.get("referenceSource") != null ? data.get("referenceSource").toString() : null);
        }
        if (data.containsKey("notes")) {
            existing.setNotes(data.get("notes") != null ? data.get("notes").toString() : null);
        }

        existing.setUpdatedAt(LocalDateTime.now());
        return enquiryRepo.save(existing);
    }

    @Transactional
    public boolean deleteEnquiry(Long id) {
        if (enquiryRepo.existsById(id)) {
            enquiryRepo.deleteById(id);
            return true;
        }
        return false;
    }
}
