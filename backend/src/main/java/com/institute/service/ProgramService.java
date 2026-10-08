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

@Service
public class ProgramService {

    private final ProgramRepository programRepo;
    private final ProgramModuleRepository moduleRepo;
    private final StudentProgramEnrollmentRepository enrollmentRepo;
    private final StudentModuleProgressRepository progressRepo;
    private final CourseRepository courseRepo;
    private final StudentRepository studentRepo;
    private final StudentCourseRepository studentCourseRepo;

    public ProgramService(
            ProgramRepository programRepo,
            ProgramModuleRepository moduleRepo,
            StudentProgramEnrollmentRepository enrollmentRepo,
            StudentModuleProgressRepository progressRepo,
            CourseRepository courseRepo,
            StudentRepository studentRepo,
            StudentCourseRepository studentCourseRepo) {
        this.programRepo = programRepo;
        this.moduleRepo = moduleRepo;
        this.enrollmentRepo = enrollmentRepo;
        this.progressRepo = progressRepo;
        this.courseRepo = courseRepo;
        this.studentRepo = studentRepo;
        this.studentCourseRepo = studentCourseRepo;
    }

    public List<Map<String, Object>> getAllPrograms() {
        List<Program> programs = programRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();

        for (Program p : programs) {
            Map<String, Object> map = new HashMap<>();
            map.put("id", p.getId());
            map.put("programCode", p.getProgramCode());
            map.put("name", p.getName());
            map.put("description", p.getDescription());
            map.put("category", p.getCategory());
            map.put("totalDuration", p.getTotalDuration());
            map.put("totalFee", p.getTotalFee());
            map.put("feeMode", p.getFeeMode());
            map.put("status", p.getStatus());
            map.put("imagePath", p.getImagePath());
            map.put("createdAt", p.getCreatedAt());

            List<ProgramModule> modules = moduleRepo.findByProgramIdOrderByModuleOrderAsc(p.getId());
            map.put("moduleCount", modules.size());
            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getProgramDetails(Long id) {
        Program program = programRepo.findById(id)
                .orElseThrow(() -> new RuntimeException("Program not found with id: " + id));

        Map<String, Object> map = new HashMap<>();
        map.put("id", program.getId());
        map.put("programCode", program.getProgramCode());
        map.put("name", program.getName());
        map.put("description", program.getDescription());
        map.put("category", program.getCategory());
        map.put("totalDuration", program.getTotalDuration());
        map.put("totalFee", program.getTotalFee());
        map.put("feeMode", program.getFeeMode());
        map.put("status", program.getStatus());
        map.put("imagePath", program.getImagePath());
        map.put("createdAt", program.getCreatedAt());

        List<ProgramModule> modules = moduleRepo.findByProgramIdOrderByModuleOrderAsc(program.getId());
        List<Map<String, Object>> moduleList = new ArrayList<>();

        for (ProgramModule pm : modules) {
            Map<String, Object> m = new HashMap<>();
            m.put("id", pm.getId());
            m.put("programId", pm.getProgramId());
            m.put("courseId", pm.getCourseId());
            m.put("moduleOrder", pm.getModuleOrder());
            m.put("moduleName", pm.getModuleName());
            m.put("isMandatory", pm.getIsMandatory());
            m.put("prerequisiteType", pm.getPrerequisiteType());
            m.put("prerequisiteCourseId", pm.getPrerequisiteCourseId());
            m.put("prerequisiteModuleId", pm.getPrerequisiteModuleId());
            m.put("minAttendancePct", pm.getMinAttendancePct());
            m.put("minExamScorePct", pm.getMinExamScorePct());

            Optional<Course> cOpt = courseRepo.findById(pm.getCourseId());
            if (cOpt.isPresent()) {
                Course c = cOpt.get();
                m.put("courseName", c.getName());
                m.put("courseDuration", c.getDuration());
                m.put("courseFees", c.getFees());
                m.put("courseType", c.getCourseType());
            }

            if (pm.getPrerequisiteCourseId() != null) {
                courseRepo.findById(pm.getPrerequisiteCourseId())
                        .ifPresent(pc -> m.put("prerequisiteCourseName", pc.getName()));
            }

            moduleList.add(m);
        }

        map.put("modules", moduleList);
        return map;
    }

    @Transactional
    public Program saveProgram(Map<String, Object> data) {
        Long id = data.containsKey("id") && data.get("id") != null ? Long.valueOf(data.get("id").toString()) : null;
        Program program;

        if (id != null) {
            program = programRepo.findById(id).orElse(new Program());
            program.setId(id);
            program.setUpdatedAt(LocalDateTime.now());
        } else {
            program = new Program();
            program.setCreatedAt(LocalDateTime.now());
            program.setUpdatedAt(LocalDateTime.now());
        }

        if (data.containsKey("name")) program.setName((String) data.get("name"));
        if (data.containsKey("programCode")) program.setProgramCode((String) data.get("programCode"));
        if (data.containsKey("description")) program.setDescription((String) data.get("description"));
        if (data.containsKey("category")) program.setCategory((String) data.get("category"));
        if (data.containsKey("totalDuration")) program.setTotalDuration((String) data.get("totalDuration"));
        if (data.containsKey("totalFee")) {
            program.setTotalFee(new BigDecimal(data.get("totalFee").toString()));
        }
        if (data.containsKey("feeMode")) program.setFeeMode((String) data.get("feeMode"));
        if (data.containsKey("status")) program.setStatus((String) data.get("status"));
        if (data.containsKey("imagePath")) program.setImagePath((String) data.get("imagePath"));

        return programRepo.save(program);
    }

    @Transactional
    public boolean deleteProgram(Long id) {
        List<StudentProgramEnrollment> enrollments = enrollmentRepo.findByProgramId(id);
        if (!enrollments.isEmpty()) {
            throw new RuntimeException("Cannot delete program: active students are enrolled in this program.");
        }
        moduleRepo.deleteByProgramId(id);
        programRepo.deleteById(id);
        return true;
    }

    @Transactional
    public ProgramModule saveModule(Long programId, Map<String, Object> data) {
        Long id = data.containsKey("id") && data.get("id") != null ? Long.valueOf(data.get("id").toString()) : null;
        Long courseId = Long.valueOf(data.get("courseId").toString());

        List<ProgramModule> existingModules = moduleRepo.findByProgramIdOrderByModuleOrderAsc(programId);

        ProgramModule pm;
        if (id != null) {
            pm = moduleRepo.findById(id).orElse(new ProgramModule());
        } else {
            pm = new ProgramModule();
            pm.setProgramId(programId);
            pm.setCreatedAt(LocalDateTime.now());
            pm.setModuleOrder(existingModules.size() + 1);
        }

        pm.setCourseId(courseId);

        if (data.containsKey("moduleOrder")) {
            pm.setModuleOrder(Integer.parseInt(data.get("moduleOrder").toString()));
        }
        if (data.containsKey("moduleName")) {
            pm.setModuleName((String) data.get("moduleName"));
        } else if (pm.getModuleName() == null) {
            courseRepo.findById(courseId).ifPresent(c -> pm.setModuleName(c.getName()));
        }

        if (data.containsKey("isMandatory")) {
            Object val = data.get("isMandatory");
            pm.setIsMandatory(Boolean.parseBoolean(val.toString()) || "1".equals(val.toString()));
        }
        if (data.containsKey("prerequisiteType")) {
            pm.setPrerequisiteType((String) data.get("prerequisiteType"));
        }
        if (data.containsKey("prerequisiteCourseId") && data.get("prerequisiteCourseId") != null) {
            pm.setPrerequisiteCourseId(Long.valueOf(data.get("prerequisiteCourseId").toString()));
        } else {
            pm.setPrerequisiteCourseId(null);
        }

        if (data.containsKey("minAttendancePct") && data.get("minAttendancePct") != null) {
            pm.setMinAttendancePct(Integer.parseInt(data.get("minAttendancePct").toString()));
        }
        if (data.containsKey("minExamScorePct") && data.get("minExamScorePct") != null) {
            pm.setMinExamScorePct(Integer.parseInt(data.get("minExamScorePct").toString()));
        }

        return moduleRepo.save(pm);
    }

    @Transactional
    public void deleteModule(Long moduleId) {
        ProgramModule pm = moduleRepo.findById(moduleId)
                .orElseThrow(() -> new RuntimeException("Module not found"));
        Long programId = pm.getProgramId();
        moduleRepo.deleteById(moduleId);

        // Re-order remaining modules
        List<ProgramModule> remaining = moduleRepo.findByProgramIdOrderByModuleOrderAsc(programId);
        int order = 1;
        for (ProgramModule module : remaining) {
            module.setModuleOrder(order++);
            moduleRepo.save(module);
        }
    }

    @Transactional
    public void reorderModules(Long programId, List<Long> moduleOrderIds) {
        for (int i = 0; i < moduleOrderIds.size(); i++) {
            Long modId = moduleOrderIds.get(i);
            Optional<ProgramModule> pmOpt = moduleRepo.findById(modId);
            if (pmOpt.isPresent()) {
                ProgramModule pm = pmOpt.get();
                pm.setModuleOrder(i + 1);
                moduleRepo.save(pm);
            }
        }
    }

    @Transactional
    public StudentProgramEnrollment enrollStudentInProgram(Long studentId, Long programId) {
        Program program = programRepo.findById(programId)
                .orElseThrow(() -> new RuntimeException("Program not found: " + programId));
        Student student = studentRepo.findById(studentId)
                .orElseThrow(() -> new RuntimeException("Student not found: " + studentId));

        // Check if already enrolled
        Optional<StudentProgramEnrollment> existing = enrollmentRepo.findByStudentIdAndProgramId(studentId, programId);
        if (existing.isPresent()) {
            return existing.get();
        }

        StudentProgramEnrollment spe = StudentProgramEnrollment.builder()
                .studentId(studentId)
                .programId(programId)
                .enrollmentDate(LocalDate.now())
                .status("IN_PROGRESS")
                .currentModuleOrder(1)
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        StudentProgramEnrollment savedSpe = enrollmentRepo.save(spe);

        List<ProgramModule> modules = moduleRepo.findByProgramIdOrderByModuleOrderAsc(programId);

        for (ProgramModule pm : modules) {
            boolean isFirstModule = pm.getModuleOrder() == 1 || "NONE".equalsIgnoreCase(pm.getPrerequisiteType());
            String initialStatus = isFirstModule ? "AVAILABLE" : "LOCKED";

            StudentModuleProgress smp = StudentModuleProgress.builder()
                    .programEnrollmentId(savedSpe.getId())
                    .programModuleId(pm.getId())
                    .studentId(studentId)
                    .courseId(pm.getCourseId())
                    .status(initialStatus)
                    .unlockedAt(isFirstModule ? LocalDateTime.now() : null)
                    .createdAt(LocalDateTime.now())
                    .updatedAt(LocalDateTime.now())
                    .build();

            StudentModuleProgress savedSmp = progressRepo.save(smp);

            if (isFirstModule) {
                ensureStudentCourseEnrollment(studentId, pm.getCourseId(), savedSmp);
            }
        }

        return savedSpe;
    }

    private void ensureStudentCourseEnrollment(Long studentId, Long courseId, StudentModuleProgress smp) {
        List<StudentCourse> scList = studentCourseRepo.findByStudentId(studentId);
        boolean alreadyEnrolled = scList.stream().anyMatch(sc -> sc.getCourseId().equals(courseId));

        if (!alreadyEnrolled) {
            StudentCourse sc = StudentCourse.builder()
                    .studentId(studentId)
                    .courseId(courseId)
                    .joiningDate(LocalDate.now())
                    .status("active")
                    .createdAt(LocalDateTime.now())
                    .build();
            StudentCourse savedSc = studentCourseRepo.save(sc);
            if (smp != null) {
                smp.setStudentCourseId(savedSc.getId());
                smp.setStatus("IN_PROGRESS");
                smp.setStartedAt(LocalDateTime.now());
                progressRepo.save(smp);
            }
        }
    }

    @Transactional
    public void completeModule(Long progressId) {
        StudentModuleProgress smp = progressRepo.findById(progressId)
                .orElseThrow(() -> new RuntimeException("Module progress record not found: " + progressId));

        smp.setStatus("COMPLETED");
        smp.setCompletedAt(LocalDateTime.now());
        smp.setUpdatedAt(LocalDateTime.now());
        progressRepo.save(smp);

        evaluateAndUnlockNextModules(smp.getStudentId(), smp.getProgramEnrollmentId());
    }

    @Transactional
    public void evaluateAndUnlockNextModules(Long studentId, Long programEnrollmentId) {
        StudentProgramEnrollment enrollment = enrollmentRepo.findById(programEnrollmentId)
                .orElseThrow(() -> new RuntimeException("Program enrollment not found"));

        List<ProgramModule> modules = moduleRepo.findByProgramIdOrderByModuleOrderAsc(enrollment.getProgramId());
        List<StudentModuleProgress> progressList = progressRepo.findByProgramEnrollmentIdOrderByProgramModuleIdAsc(programEnrollmentId);

        Map<Long, StudentModuleProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(StudentModuleProgress::getProgramModuleId, p -> p));

        boolean allMandatoryCompleted = true;

        for (int i = 0; i < modules.size(); i++) {
            ProgramModule module = modules.get(i);
            StudentModuleProgress smp = progressMap.get(module.getId());

            if (smp == null) continue;

            if (module.getIsMandatory() && !"COMPLETED".equalsIgnoreCase(smp.getStatus()) && !"SKIPPED".equalsIgnoreCase(smp.getStatus())) {
                allMandatoryCompleted = false;
            }

            if ("LOCKED".equalsIgnoreCase(smp.getStatus())) {
                boolean unlockable = false;

                if ("NONE".equalsIgnoreCase(module.getPrerequisiteType())) {
                    unlockable = true;
                } else if ("PREVIOUS_MODULE".equalsIgnoreCase(module.getPrerequisiteType()) && i > 0) {
                    ProgramModule prevModule = modules.get(i - 1);
                    StudentModuleProgress prevProgress = progressMap.get(prevModule.getId());
                    if (prevProgress != null && ("COMPLETED".equalsIgnoreCase(prevProgress.getStatus()) || "SKIPPED".equalsIgnoreCase(prevProgress.getStatus()))) {
                        unlockable = true;
                    }
                } else if ("SPECIFIC_COURSE".equalsIgnoreCase(module.getPrerequisiteType()) && module.getPrerequisiteCourseId() != null) {
                    List<StudentModuleProgress> prereqList = progressRepo.findByStudentIdAndCourseId(studentId, module.getPrerequisiteCourseId());
                    unlockable = prereqList.stream().anyMatch(p -> "COMPLETED".equalsIgnoreCase(p.getStatus()));
                }

                if (unlockable) {
                    smp.setStatus("AVAILABLE");
                    smp.setUnlockedAt(LocalDateTime.now());
                    smp.setUpdatedAt(LocalDateTime.now());
                    progressRepo.save(smp);
                    ensureStudentCourseEnrollment(studentId, module.getCourseId(), smp);
                }
            }
        }

        if (allMandatoryCompleted) {
            enrollment.setStatus("COMPLETED");
            enrollment.setCompletionDate(LocalDate.now());
            enrollment.setUpdatedAt(LocalDateTime.now());
            enrollmentRepo.save(enrollment);
        }
    }

    public Map<String, Object> getStudentProgramProgress(Long studentId, Long programId) {
        StudentProgramEnrollment enrollment = enrollmentRepo.findByStudentIdAndProgramId(studentId, programId)
                .orElse(null);

        Map<String, Object> result = new HashMap<>();
        if (enrollment == null) {
            result.put("isEnrolled", false);
            return result;
        }

        Program program = programRepo.findById(programId).orElse(null);
        result.put("isEnrolled", true);
        result.put("enrollmentId", enrollment.getId());
        result.put("enrollmentDate", enrollment.getEnrollmentDate());
        result.put("completionDate", enrollment.getCompletionDate());
        result.put("status", enrollment.getStatus());
        result.put("programName", program != null ? program.getName() : "");
        result.put("programDescription", program != null ? program.getDescription() : "");
        result.put("totalFee", program != null ? program.getTotalFee() : BigDecimal.ZERO);

        List<ProgramModule> modules = moduleRepo.findByProgramIdOrderByModuleOrderAsc(programId);
        List<StudentModuleProgress> progressList = progressRepo.findByProgramEnrollmentIdOrderByProgramModuleIdAsc(enrollment.getId());

        Map<Long, StudentModuleProgress> progressMap = progressList.stream()
                .collect(Collectors.toMap(StudentModuleProgress::getProgramModuleId, p -> p));

        List<Map<String, Object>> moduleProgressList = new ArrayList<>();
        int completedCount = 0;

        for (ProgramModule pm : modules) {
            Map<String, Object> item = new HashMap<>();
            item.put("moduleId", pm.getId());
            item.put("courseId", pm.getCourseId());
            item.put("moduleOrder", pm.getModuleOrder());
            item.put("moduleName", pm.getModuleName());
            item.put("isMandatory", pm.getIsMandatory());
            item.put("prerequisiteType", pm.getPrerequisiteType());

            courseRepo.findById(pm.getCourseId()).ifPresent(c -> {
                item.put("courseName", c.getName());
                item.put("courseDuration", c.getDuration());
                item.put("courseFees", c.getFees());
            });

            StudentModuleProgress progress = progressMap.get(pm.getId());
            if (progress != null) {
                item.put("progressId", progress.getId());
                item.put("status", progress.getStatus());
                item.put("unlockedAt", progress.getUnlockedAt());
                item.put("startedAt", progress.getStartedAt());
                item.put("completedAt", progress.getCompletedAt());
                item.put("batchId", progress.getBatchId());

                if ("COMPLETED".equalsIgnoreCase(progress.getStatus())) {
                    completedCount++;
                }
            } else {
                item.put("status", "LOCKED");
            }
            moduleProgressList.add(item);
        }

        result.put("modules", moduleProgressList);
        result.put("totalModules", modules.size());
        result.put("completedModules", completedCount);
        result.put("progressPercentage", modules.isEmpty() ? 0 : (completedCount * 100) / modules.size());

        return result;
    }
}
