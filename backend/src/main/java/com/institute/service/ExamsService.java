package com.institute.service;

import com.institute.model.*;
import com.institute.repository.*;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import jakarta.annotation.PostConstruct;
import com.fasterxml.jackson.databind.ObjectMapper;

/**
 * Exams Service
 * Line-by-line migration of: Exams_model.php (1340 lines)
 * Covers: internal exams, external exams, question bank, submissions, evaluation
 */
@Service
public class ExamsService {

    private final ExamRepository examRepo;
    private final ExamQuestionRepository examQuestionRepo;
    private final ExamOptionRepository examOptionRepo;
    private final ExamAssignmentRepository examAssignmentRepo;
    private final ExamSubmissionRepository examSubmissionRepo;
    private final ExamSubmissionAnswerRepository examSubmissionAnswerRepo;
    private final ExternalExamRepository externalExamRepo;
    private final ExternalQuestionRepository externalQuestionRepo;
    private final ExternalOptionRepository externalOptionRepo;
    private final ExternalParticipantRepository externalParticipantRepo;
    private final ExternalExamSubmissionRepository externalSubmissionRepo;
    private final ExternalSubmissionAnswerRepository externalSubmissionAnswerRepo;
    private final QuestionTemplateRepository templateRepo;
    private final TemplateQuestionRepository templateQuestionRepo;
    private final TemplateOptionRepository templateOptionRepo;
    private final StudentRepository studentRepo;
    private final CourseRepository courseRepo;
    private final InstituteSettingRepository settingRepo;
    private final UserRepository userRepo;
    private final StaffRepository staffRepo;
    private final ExamEntryRepository examEntryRepo;
    private final ExamEntryStudentResultRepository examEntryStudentResultRepo;

    @PersistenceContext
    private EntityManager entityManager;

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostConstruct
    public void ensureQuestionColumnsExist() {
        if (jdbcTemplate == null) return;
        String[] tables = {"template_questions", "exam_questions", "external_questions"};
        for (String table : tables) {
            try {
                jdbcTemplate.execute("ALTER TABLE " + table + " MODIFY COLUMN question_type VARCHAR(50)");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN correct_answer TEXT");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN is_section_title BOOLEAN DEFAULT FALSE");
            } catch (Exception ignored) {}
            try {
                jdbcTemplate.execute("ALTER TABLE " + table + " ADD COLUMN match_pairs_json TEXT");
            } catch (Exception ignored) {}
        }
    }

    public ExamsService(ExamRepository examRepo, ExamQuestionRepository examQuestionRepo,
                        ExamOptionRepository examOptionRepo, ExamAssignmentRepository examAssignmentRepo,
                        ExamSubmissionRepository examSubmissionRepo, ExamSubmissionAnswerRepository examSubmissionAnswerRepo,
                        ExternalExamRepository externalExamRepo, ExternalQuestionRepository externalQuestionRepo,
                        ExternalOptionRepository externalOptionRepo, ExternalParticipantRepository externalParticipantRepo,
                        ExternalExamSubmissionRepository externalSubmissionRepo,
                        ExternalSubmissionAnswerRepository externalSubmissionAnswerRepo,
                        QuestionTemplateRepository templateRepo, TemplateQuestionRepository templateQuestionRepo,
                        TemplateOptionRepository templateOptionRepo, StudentRepository studentRepo,
                        CourseRepository courseRepo, InstituteSettingRepository settingRepo,
                        UserRepository userRepo, StaffRepository staffRepo,
                        ExamEntryRepository examEntryRepo, ExamEntryStudentResultRepository examEntryStudentResultRepo) {
        this.examRepo = examRepo;
        this.examQuestionRepo = examQuestionRepo;
        this.examOptionRepo = examOptionRepo;
        this.examAssignmentRepo = examAssignmentRepo;
        this.examSubmissionRepo = examSubmissionRepo;
        this.examSubmissionAnswerRepo = examSubmissionAnswerRepo;
        this.externalExamRepo = externalExamRepo;
        this.externalQuestionRepo = externalQuestionRepo;
        this.externalOptionRepo = externalOptionRepo;
        this.externalParticipantRepo = externalParticipantRepo;
        this.externalSubmissionRepo = externalSubmissionRepo;
        this.externalSubmissionAnswerRepo = externalSubmissionAnswerRepo;
        this.templateRepo = templateRepo;
        this.templateQuestionRepo = templateQuestionRepo;
        this.templateOptionRepo = templateOptionRepo;
        this.studentRepo = studentRepo;
        this.courseRepo = courseRepo;
        this.settingRepo = settingRepo;
        this.userRepo = userRepo;
        this.staffRepo = staffRepo;
        this.examEntryRepo = examEntryRepo;
        this.examEntryStudentResultRepo = examEntryStudentResultRepo;
    }

    // ============ INTERNAL EXAMS (Exams_model.php lines 7-200) ============

    public Object getInternalExams(Long examId, Map<String, String> filters, Map<String, Object> details) {
        String role = details != null ? details.getOrDefault("role", "").toString().toLowerCase() : "";
        String type = details != null ? details.getOrDefault("type", "").toString().toLowerCase() : "";
        Long currentUserId = (details != null && details.get("id") != null) ? Long.valueOf(details.get("id").toString()) : null;
        boolean isStaffUser = currentUserId != null && ("staff".equals(type) || "staff".equals(role));
        
        List<Exam> exams;
        if (examId != null) {
            exams = examRepo.findById(examId)
                .filter(exam -> !isStaffUser || Objects.equals(exam.getCreatedBy(), currentUserId))
                .map(List::of)
                .orElse(List.of());
        } else {
            // Staff only see their own created exams. Admins see all.
            if (isStaffUser) {
                exams = examRepo.findByCreatedBy(currentUserId).stream()
                    .filter(exam -> exam.getIsDeleted() == null || exam.getIsDeleted() == 0)
                    .collect(Collectors.toList());
            } else {
                exams = examRepo.findAll().stream()
                    .filter(exam -> exam.getIsDeleted() == null || exam.getIsDeleted() == 0)
                    .collect(Collectors.toList());
            }
        }

        System.out.println("Processing getInternalExams. filters: " + filters);
        if (filters != null && examId == null) {
            exams = applyExamDateFilters(exams, filters);
            exams = applySearchFilters(exams, filters);
        }
        System.out.println("Computed exams list size: " + (exams != null ? exams.size() : 0));

        if (exams != null && exams.size() > 1) {
            exams = new ArrayList<>(exams);
            exams.sort((a, b) -> {
                Long idA = a.getId() != null ? a.getId() : 0L;
                Long idB = b.getId() != null ? b.getId() : 0L;
                return Long.compare(idB, idA);
            });
        }

        boolean isPaged = filters != null && filters.containsKey("page") && examId == null;
        int totalElements = exams != null ? exams.size() : 0;
        int page = 0;
        int size = 10;
        if (isPaged) {
            try {
                page = Math.max(0, Integer.parseInt(filters.get("page")));
            } catch (Exception ignored) {}
            try {
                if (filters.containsKey("size")) {
                    size = Math.max(1, Integer.parseInt(filters.get("size")));
                }
            } catch (Exception ignored) {}
        }

        int totalPages = (int) Math.ceil((double) totalElements / size);
        if (totalPages == 0) totalPages = 1;

        List<Exam> examsToProcess;
        if (isPaged) {
            int startIdx = page * size;
            if (startIdx >= totalElements) {
                examsToProcess = Collections.emptyList();
            } else {
                int endIdx = Math.min(startIdx + size, totalElements);
                examsToProcess = exams.subList(startIdx, endIdx);
            }
        } else {
            examsToProcess = exams != null ? exams : Collections.emptyList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (Exam e : examsToProcess) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", e.getId());
            map.put("title", e.getTitle());
            map.put("course_id", e.getCourseId());
            map.put("total_marks", e.getTotalMarks());
            map.put("duration_minutes", e.getDurationMinutes());
            map.put("pass_percentage", e.getPassPercentage());
            map.put("exam_type", e.getExamType());
            map.put("status", e.getStatus());
            map.put("exam_date", e.getExamDate());
            map.put("created_at", e.getCreatedAt());
            
            if (e.getCreatedBy() != null) {
                userRepo.findById(e.getCreatedBy()).ifPresentOrElse(u -> {
                    String name = u.getFullName();
                    if (name == null || name.isBlank()) name = u.getUsername();
                    map.put("instructor_name", name);
                }, () -> {
                    // Check staff table if not found in users
                    staffRepo.findById(e.getCreatedBy()).ifPresent(s -> {
                        map.put("instructor_name", s.getName());
                    });
                });
            } else {
                map.put("instructor_name", "System Admin");
            }

            if (e.getCourseId() != null) {
                courseRepo.findById(e.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
            }

            // Questions with options (Manual mapping to ensure snake_case for frontend)
            List<ExamQuestion> questions = examQuestionRepo.findByExamId(e.getId());
            List<Map<String, Object>> qList = new ArrayList<>();
            for (ExamQuestion q : questions) {
                Map<String, Object> qMap = new LinkedHashMap<>();
                qMap.put("id", q.getId());
                qMap.put("question_type", q.getQuestionType());
                qMap.put("question_text", q.getQuestionText());
                qMap.put("marks", q.getMarks());
                qMap.put("is_section_title", Boolean.TRUE.equals(q.getIsSectionTitle()));
                qMap.put("is_section_break", "section_break".equalsIgnoreCase(q.getQuestionType()));
                qMap.put("correct_answer", q.getCorrectAnswer());
                qMap.put("order_index", q.getOrderIndex());
                
                List<ExamOption> options = examOptionRepo.findByQuestionId(q.getId());
                List<Map<String, Object>> oList = new ArrayList<>();
                for (ExamOption o : options) {
                    Map<String, Object> oMap = new LinkedHashMap<>();
                    oMap.put("id", o.getId());
                    oMap.put("option_text", o.getOptionText());
                    oMap.put("is_correct", o.getIsCorrect());
                    oList.add(oMap);
                }
                qMap.put("options", oList);
                qList.add(qMap);
            }
            map.put("questions", qList);
            map.put("question_count", qList.size());
            map.put("submission_count", examSubmissionRepo.findByExamId(e.getId()).size());
            
            // For assignment panel
            List<Long> assignedStudentIds = examAssignmentRepo.findByExamId(e.getId())
                .stream().map(ExamAssignment::getStudentId).collect(Collectors.toList());
            map.put("assigned_student_ids", assignedStudentIds);

            result.add(map);
        }

        if (isPaged) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", result);
            response.put("totalElements", totalElements);
            response.put("totalPages", totalPages);
            response.put("currentPage", page + 1);
            response.put("size", size);
            return response;
        }

        return result;
    }

    /**
     * Migrated from: Exams_model.php -> save_internal_exam() lines 45-120
     */
    @Transactional
    public Long saveInternalExam(Map<String, Object> data) {
        Long id = data.containsKey("id") && data.get("id") != null ?
            Long.valueOf(data.get("id").toString()) : null;

        Exam exam;
        if (id != null) {
            exam = examRepo.findById(id).orElse(new Exam());
        } else {
            exam = new Exam();
            exam.setCreatedAt(LocalDateTime.now());
            exam.setIsDeleted(0);
        }

        if (data.containsKey("title")) exam.setTitle((String) data.get("title"));
        if (data.containsKey("description")) exam.setDescription((String) data.get("description"));
        Object courseIdValue = data.containsKey("course_id") ? data.get("course_id") : data.get("courseId");
        if (courseIdValue != null && !courseIdValue.toString().isBlank()) {
            exam.setCourseId(Long.valueOf(courseIdValue.toString()));
        }
        if (data.containsKey("total_marks")) exam.setTotalMarks(Integer.valueOf(data.get("total_marks").toString()));
        if (data.containsKey("duration_minutes")) exam.setDurationMinutes(Integer.valueOf(data.get("duration_minutes").toString()));
        if (data.containsKey("pass_percentage")) exam.setPassPercentage(Integer.valueOf(data.get("pass_percentage").toString()));
        if (data.containsKey("exam_type")) exam.setExamType((String) data.get("exam_type"));
        if (data.containsKey("status")) exam.setStatus((String) data.get("status"));
        if (data.containsKey("created_by")) exam.setCreatedBy(Long.valueOf(data.get("created_by").toString()));
        Object examDateValue = data.containsKey("exam_date") ? data.get("exam_date") : data.get("examDate");
        if (examDateValue != null && !examDateValue.toString().isBlank()) {
            exam.setExamDate(java.time.LocalDate.parse(examDateValue.toString()));
        }
        exam.setUpdatedAt(LocalDateTime.now());

        Exam saved = examRepo.save(exam);

        // Save questions (Exams_model.php lines 70-115)
        if (data.containsKey("questions") && data.get("questions") instanceof List) {
            // Delete old questions
            List<ExamQuestion> oldQuestions = examQuestionRepo.findByExamId(saved.getId());
            for (ExamQuestion oq : oldQuestions) {
                examOptionRepo.deleteByQuestionId(oq.getId());
            }
            examQuestionRepo.deleteByExamId(saved.getId());

            List<Map<String, Object>> questions = (List<Map<String, Object>>) data.get("questions");
            int order = 0;
            for (Map<String, Object> qData : questions) {
                ExamQuestion question = new ExamQuestion();
                question.setExamId(saved.getId());
                question.setQuestionType((String) qData.getOrDefault("question_type", "mcq"));
                question.setQuestionText((String) qData.get("question_text"));
                question.setMarks(qData.containsKey("marks") ? Integer.valueOf(qData.get("marks").toString()) : 1);
                question.setOrderIndex(order++);

                if (qData.containsKey("correct_answer") && qData.get("correct_answer") != null) {
                    question.setCorrectAnswer(qData.get("correct_answer").toString());
                } else if (qData.containsKey("correctAnswer") && qData.get("correctAnswer") != null) {
                    question.setCorrectAnswer(qData.get("correctAnswer").toString());
                }
                if (qData.containsKey("is_section_title")) {
                    question.setIsSectionTitle(Boolean.TRUE.equals(qData.get("is_section_title")) || "1".equals(String.valueOf(qData.get("is_section_title"))));
                }
                if (qData.containsKey("is_section_break")) {
                    if (Boolean.TRUE.equals(qData.get("is_section_break")) || "1".equals(String.valueOf(qData.get("is_section_break")))) {
                        question.setIsSectionTitle(true);
                    }
                }
                if (qData.containsKey("match_pairs")) {
                    try {
                        question.setMatchPairsJson(objectMapper.writeValueAsString(qData.get("match_pairs")));
                    } catch (Exception ignored) {}
                }

                ExamQuestion savedQ = examQuestionRepo.save(question);

                if (qData.containsKey("options") && qData.get("options") instanceof List) {
                    List<Map<String, Object>> options = sanitizeOptions((List<Map<String, Object>>) qData.get("options"));
                    for (Map<String, Object> oData : options) {
                        ExamOption option = new ExamOption();
                        option.setQuestionId(savedQ.getId());
                        option.setOptionText((String) oData.get("option_text"));
                        option.setIsCorrect(oData.containsKey("is_correct") ?
                            (Boolean.TRUE.equals(oData.get("is_correct")) || "1".equals(oData.get("is_correct").toString()) ? 1 : 0) : 0);
                        examOptionRepo.save(option);
                    }
                }
            }
        }

        return saved.getId();
    }

    @Transactional
    public boolean deleteInternalExam(Long id) {
        return examRepo.findById(id).map(exam -> {
            exam.setIsDeleted(1);
            examRepo.save(exam);
            return true;
        }).orElse(false);
    }

    @Transactional
    public boolean deleteExternalExam(Long id) {
        return externalExamRepo.findById(id).map(exam -> {
            List<ExternalExamSubmission> submissions = externalSubmissionRepo.findByExamId(id);
            for (ExternalExamSubmission submission : submissions) {
                externalSubmissionAnswerRepo.deleteBySubmissionId(submission.getId());
            }
            externalSubmissionRepo.deleteAll(submissions);

            List<ExternalQuestion> questions = externalQuestionRepo.findByExamId(id);
            for (ExternalQuestion question : questions) {
                externalOptionRepo.deleteByQuestionId(question.getId());
            }
            externalQuestionRepo.deleteByExamId(id);

            externalParticipantRepo.deleteByExamId(id);
            externalExamRepo.deleteById(id);
            return true;
        }).orElse(false);
    }

    // ============ ASSIGNMENTS (Exams_model.php lines 202-280) ============

    @Transactional
    public void assignExam(Long examId, List<Long> studentIds) {
        for (Long studentId : studentIds) {
            if (examAssignmentRepo.findByExamIdAndStudentId(examId, studentId).isEmpty()) {
                ExamAssignment assignment = ExamAssignment.builder()
                    .examId(examId)
                    .studentId(studentId)
                    .assignedAt(LocalDateTime.now())
                    .isReassigned(0)
                    .build();
                examAssignmentRepo.save(assignment);
            }
        }
    }

    @Transactional
    public void reassignExam(Long examId, Long studentId) {
        examAssignmentRepo.findByExamIdAndStudentId(examId, studentId).ifPresent(a -> {
            a.setIsReassigned(1);
            a.setAssignedAt(LocalDateTime.now());
            examAssignmentRepo.save(a);
        });
    }

    @Transactional
    public void unassignExam(Long examId, Long studentId) {
        examAssignmentRepo.deleteByExamIdAndStudentId(examId, studentId);
    }

    private boolean canStudentTakeExam(ExamAssignment assignment, Optional<ExamSubmission> latestSubmission) {
        if (latestSubmission.isEmpty()) {
            return true;
        }

        if (assignment == null || assignment.getAssignedAt() == null) {
            return false;
        }

        LocalDateTime submittedAt = latestSubmission.get().getEndTime();
        if (submittedAt == null) {
            return false;
        }

        return assignment.getAssignedAt().isAfter(submittedAt);
    }

    public List<Map<String, Object>> getAssignedExams(Long studentId) {
        List<ExamAssignment> assignments = examAssignmentRepo.findByStudentId(studentId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (ExamAssignment a : assignments) {
            examRepo.findById(a.getExamId()).ifPresent(exam -> {
                if (exam.getIsDeleted() == 0) {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("assignment_id", a.getId());
                      map.put("exam_id", exam.getId());
                      map.put("id", exam.getId());
                      map.put("title", exam.getTitle());
                      map.put("exam_type", exam.getExamType());
                      map.put("total_marks", exam.getTotalMarks());
                      map.put("duration_minutes", exam.getDurationMinutes());
                      map.put("assigned_at", a.getAssignedAt());
                      map.put("is_reassigned", a.getIsReassigned());

                      // Check if already submitted
                      Optional<ExamSubmission> sub = examSubmissionRepo
                          .findTopByExamIdAndStudentIdOrderByAttemptNumberDesc(exam.getId(), studentId);
                      boolean hasSubmitted = sub.isPresent();
                      boolean canTake = canStudentTakeExam(a, sub);

                      map.put("has_submitted", hasSubmitted);
                      map.put("has_attempted", hasSubmitted);
                      map.put("submission_status", sub.map(ExamSubmission::getStatus).orElse(null));
                      map.put("can_take", canTake);

                      result.add(map);
                  }
              });
        }
        return result;
    }

    public List<Map<String, Object>> getStudentResults(Long studentId) {
        List<ExamSubmission> submissions = examSubmissionRepo.findByStudentId(studentId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (ExamSubmission submission : submissions) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", submission.getId());
            map.put("exam_id", submission.getExamId());
            map.put("student_id", submission.getStudentId());
            map.put("total_score", submission.getTotalScore());
            map.put("status", submission.getStatus());
            map.put("is_evaluated", submission.getIsEvaluated());
            map.put("attempt_number", submission.getAttemptNumber());
            map.put("start_time", submission.getStartTime());
            map.put("end_time", submission.getEndTime());

            examRepo.findById(submission.getExamId()).ifPresent(exam -> {
                map.put("exam_title", exam.getTitle());
                map.put("exam_total_marks", exam.getTotalMarks());
                map.put("pass_percentage", exam.getPassPercentage());
                map.put("exam_type", exam.getExamType());
            });

            result.add(map);
        }

        result.sort((a, b) -> {
            Object endA = a.get("end_time");
            Object endB = b.get("end_time");
            if (endA == null && endB == null) return 0;
            if (endA == null) return 1;
            if (endB == null) return -1;
            return endB.toString().compareTo(endA.toString());
        });

        return result;
    }

    public List<Map<String, Object>> getPendingAssignments(Long examId) {
        List<ExamAssignment> assignments = examAssignmentRepo.findByExamId(examId);
        List<Map<String, Object>> result = new ArrayList<>();

        for (ExamAssignment assignment : assignments) {
            Optional<ExamSubmission> sub = examSubmissionRepo
                .findTopByExamIdAndStudentIdOrderByAttemptNumberDesc(examId, assignment.getStudentId());

            // If no submission exists, or if the latest reassignment happened AFTER the last submission
            boolean isPending = sub.isEmpty();
            if (sub.isPresent() && assignment.getAssignedAt() != null && sub.get().getEndTime() != null) {
                if (assignment.getAssignedAt().isAfter(sub.get().getEndTime())) {
                    isPending = true;
                }
            }

            if (isPending) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("student_id", assignment.getStudentId());
                map.put("assigned_at", assignment.getAssignedAt());

                studentRepo.findById(assignment.getStudentId()).ifPresent(s -> {
                    map.put("student_name", s.getName());
                    map.put("reg_number", s.getRegNumber());
                });

                result.add(map);
            }
        }
        return result;
    }

    // ============ SUBMISSIONS (Exams_model.php lines 283-450) ============

    @Transactional
    public Map<String, Object> submitInternalExam(Map<String, Object> data) {
        Long examId = Long.valueOf(data.get("exam_id").toString());
        Long studentId = Long.valueOf(data.get("student_id").toString());
        List<Map<String, Object>> answers = (List<Map<String, Object>>) data.get("answers");

        ExamAssignment assignment = examAssignmentRepo.findByExamIdAndStudentId(examId, studentId)
            .orElseThrow(() -> new RuntimeException("This assessment is not assigned to the student."));

        // Determine attempt number
        Optional<ExamSubmission> lastSub = examSubmissionRepo
            .findTopByExamIdAndStudentIdOrderByAttemptNumberDesc(examId, studentId);
        if (!canStudentTakeExam(assignment, lastSub)) {
            throw new RuntimeException("This assessment has already been attempted. It can only be reopened by reassignment.");
        }
        int attemptNumber = lastSub.map(s -> s.getAttemptNumber() + 1).orElse(1);

        ExamSubmission submission = ExamSubmission.builder()
            .examId(examId)
            .studentId(studentId)
            .startTime(LocalDateTime.now())
            .endTime(LocalDateTime.now())
            .totalScore(BigDecimal.ZERO)
            .isEvaluated(0)
            .attemptNumber(attemptNumber)
            .status("submitted")
            .build();
        ExamSubmission savedSub = examSubmissionRepo.save(submission);

        BigDecimal totalScore = BigDecimal.ZERO;
        int autoEvaluated = 1;

        if (answers != null) {
            for (Map<String, Object> ans : answers) {
                Long questionId = Long.valueOf(ans.get("question_id").toString());
                ExamQuestion question = examQuestionRepo.findById(questionId).orElse(null);

                ExamSubmissionAnswer answer = new ExamSubmissionAnswer();
                answer.setSubmissionId(savedSub.getId());
                answer.setQuestionId(questionId);

                if (ans.containsKey("selected_option_id") && ans.get("selected_option_id") != null) {
                    Long selectedOptionId = Long.valueOf(ans.get("selected_option_id").toString());
                    answer.setSelectedOptionId(selectedOptionId);

                    // Auto-grade MCQ
                    Optional<ExamOption> correctOpt = examOptionRepo.findByQuestionIdAndIsCorrect(questionId, 1);
                    boolean isCorrect = correctOpt.map(o -> o.getId().equals(selectedOptionId)).orElse(false);
                    answer.setIsCorrect(isCorrect ? 1 : 0);
                    answer.setMarksObtained(isCorrect && question != null ?
                        new BigDecimal(question.getMarks()) : BigDecimal.ZERO);
                    if (isCorrect && question != null) totalScore = totalScore.add(new BigDecimal(question.getMarks()));
                } else if (ans.containsKey("answer_text") || ans.containsKey("either_or_selected")) {
                    String ansText = ans.get("answer_text") != null ? ans.get("answer_text").toString() : "";
                    answer.setAnswerText(ansText);

                    String qType = question != null && question.getQuestionType() != null ? question.getQuestionType().toLowerCase() : "";

                    if ("fillups".equals(qType) || "fill_in_the_blanks".equals(qType) || "fill".equals(qType)) {
                        String expectedAnswer = question != null && question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";
                        if (expectedAnswer.isEmpty() && question != null) {
                            List<TemplateQuestion> tqs = templateQuestionRepo.findAll().stream()
                                .filter(tq -> tq.getQuestionText() != null && tq.getQuestionText().equalsIgnoreCase(question.getQuestionText()) && tq.getCorrectAnswer() != null)
                                .collect(Collectors.toList());
                            if (!tqs.isEmpty()) {
                                expectedAnswer = tqs.get(0).getCorrectAnswer().trim();
                                question.setCorrectAnswer(expectedAnswer);
                                examQuestionRepo.save(question);
                            }
                        }

                        boolean isCorrect = !expectedAnswer.isEmpty() && expectedAnswer.equalsIgnoreCase(ansText.trim());
                        answer.setIsCorrect(isCorrect ? 1 : 0);
                        BigDecimal marks = isCorrect && question != null ? new BigDecimal(question.getMarks()) : BigDecimal.ZERO;
                        answer.setMarksObtained(marks);
                        totalScore = totalScore.add(marks);
                    } else if ("descriptive".equals(qType) || "text".equals(qType) || "either_or".equals(qType)) {
                        autoEvaluated = 0; // Only Descriptive and Either Or Questions are verified by staff
                        answer.setMarksObtained(BigDecimal.ZERO);
                        answer.setIsCorrect(0);
                    } else {
                        if (question != null && question.getCorrectAnswer() != null && !question.getCorrectAnswer().isBlank()) {
                            boolean isCorrect = question.getCorrectAnswer().trim().equalsIgnoreCase(ansText.trim());
                            answer.setIsCorrect(isCorrect ? 1 : 0);
                            BigDecimal marks = isCorrect ? new BigDecimal(question.getMarks()) : BigDecimal.ZERO;
                            answer.setMarksObtained(marks);
                            totalScore = totalScore.add(marks);
                        } else {
                            autoEvaluated = 0;
                        }
                    }
                }

                examSubmissionAnswerRepo.save(answer);
            }
        }

        savedSub.setTotalScore(totalScore);
        savedSub.setIsEvaluated(autoEvaluated);
        if (autoEvaluated == 1) savedSub.setStatus("evaluated");
        examSubmissionRepo.save(savedSub);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("submission_id", savedSub.getId());
        result.put("total_score", totalScore);
        result.put("auto_evaluated", autoEvaluated == 1);
        return result;
    }

    public List<Map<String, Object>> getSubmissions(Long examId, Map<String, Object> details) {
        String role = details.getOrDefault("role", "").toString().toLowerCase();
        String type = details.getOrDefault("type", "").toString().toLowerCase();
        Long currentUserId = Long.valueOf(details.get("id").toString());
        
        List<ExamSubmission> submissions;
        if (examId != null) {
            Exam exam = examRepo.findById(examId).orElse(null);
            if (exam == null) return Collections.emptyList();
            
            // If staff, verify they created this exam
            if (("staff".equals(type) || "staff".equals(role)) && !exam.getCreatedBy().equals(currentUserId)) {
                return Collections.emptyList();
            }
            submissions = examSubmissionRepo.findByExamId(examId);
        } else {
            // Global Evaluation Board
            if ("staff".equals(type) || "staff".equals(role)) {
                List<Long> myExamIds = examRepo.findByCreatedBy(currentUserId)
                    .stream().map(Exam::getId).collect(java.util.stream.Collectors.toList());
                if (myExamIds.isEmpty()) return Collections.emptyList();
                submissions = examSubmissionRepo.findByExamIdIn(myExamIds);
            } else {
                submissions = examSubmissionRepo.findAllByOrderByStartTimeDesc();
            }
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (ExamSubmission s : submissions) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", s.getId());
            map.put("exam_id", s.getExamId());
            map.put("student_id", s.getStudentId());
            map.put("total_score", s.getTotalScore());
            map.put("is_evaluated", s.getIsEvaluated());
            map.put("status", s.getStatus());
            map.put("attempt_number", s.getAttemptNumber());
            map.put("start_time", s.getStartTime());
            map.put("end_time", s.getEndTime());

            if (s.getExamId() != null) {
                examRepo.findById(s.getExamId()).ifPresent(e -> map.put("exam_title", e.getTitle()));
            }

            if (s.getStudentId() != null) {
                studentRepo.findById(s.getStudentId()).ifPresent(st -> {
                    map.put("student_name", st.getName());
                    map.put("reg_number", st.getRegNumber());
                });
            }

            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getSubmissionDetails(Long submissionId, Map<String, Object> userContext) {
        ExamSubmission sub = examSubmissionRepo.findById(submissionId).orElse(null);
        if (sub == null) return null;
        
        String role = userContext.getOrDefault("role", "").toString().toLowerCase();
        String type = userContext.getOrDefault("type", "").toString().toLowerCase();
        Long currentUserId = Long.valueOf(userContext.get("id").toString());
        
        // Security check: If staff, ensure they created the exam
        Exam exam = examRepo.findById(sub.getExamId()).orElse(null);
        if (("staff".equals(type) || "staff".equals(role)) && exam != null && !exam.getCreatedBy().equals(currentUserId)) {
            return null; // No permission
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("id", sub.getId());
        result.put("exam_id", sub.getExamId());
        result.put("total_score", sub.getTotalScore());
        result.put("status", sub.getStatus());
        result.put("is_evaluated", sub.getIsEvaluated());
        result.put("attempt_number", sub.getAttemptNumber());
        result.put("start_time", sub.getStartTime());
        result.put("end_time", sub.getEndTime());
        
        if (sub.getStudentId() != null) {
            studentRepo.findById(sub.getStudentId()).ifPresent(s -> result.put("student_name", s.getName()));
        }

        examRepo.findById(sub.getExamId()).ifPresent(exm -> {
            result.put("exam_title", exm.getTitle());
            result.put("exam_total_marks", exm.getTotalMarks());
            result.put("pass_percentage", exm.getPassPercentage());
        });

        List<ExamSubmissionAnswer> answers = examSubmissionAnswerRepo.findBySubmissionId(submissionId);
        List<Map<String, Object>> answerList = new ArrayList<>();
        for (ExamSubmissionAnswer a : answers) {
            Map<String, Object> aMap = new LinkedHashMap<>();
            aMap.put("id", a.getId());
            aMap.put("question_id", a.getQuestionId());
            aMap.put("selected_option_id", a.getSelectedOptionId());
            aMap.put("answer_text", a.getAnswerText());
            aMap.put("marks_obtained", a.getMarksObtained());
            aMap.put("is_correct", a.getIsCorrect());

              examQuestionRepo.findById(a.getQuestionId()).ifPresent(q -> {
                  aMap.put("question_text", q.getQuestionText());
                  aMap.put("question_type", q.getQuestionType());
                  aMap.put("max_marks", q.getMarks());
                  aMap.put("question_marks", q.getMarks());
                  aMap.put("is_section_title", q.getIsSectionTitle());
                  aMap.put("is_section_break", "section_break".equalsIgnoreCase(q.getQuestionType()));
                  aMap.put("remarks", a.getAnswerText() != null ? a.getAnswerText() : "");

                  String expectedAnswer = q.getCorrectAnswer();
                  if ((expectedAnswer == null || expectedAnswer.isBlank()) && q.getQuestionText() != null) {
                      List<TemplateQuestion> tqs = templateQuestionRepo.findAll().stream()
                          .filter(tq -> tq.getQuestionText() != null && tq.getQuestionText().equalsIgnoreCase(q.getQuestionText()) && tq.getCorrectAnswer() != null)
                          .collect(Collectors.toList());
                      if (!tqs.isEmpty()) {
                          expectedAnswer = tqs.get(0).getCorrectAnswer().trim();
                          q.setCorrectAnswer(expectedAnswer);
                          examQuestionRepo.save(q);
                      }
                  }
                  aMap.put("correct_answer", expectedAnswer);

                  String qType = q.getQuestionType() != null ? q.getQuestionType().toLowerCase() : "";
                  if ("fillups".equals(qType) || "fill_in_the_blanks".equals(qType) || "fill".equals(qType)) {
                      String ansText = a.getAnswerText() != null ? a.getAnswerText().trim() : "";
                      String expText = expectedAnswer != null ? expectedAnswer.trim() : "";
                      boolean isCorrect = !expText.isEmpty() && expText.equalsIgnoreCase(ansText);
                      aMap.put("is_correct", isCorrect ? 1 : 0);
                      BigDecimal marks = isCorrect ? new BigDecimal(q.getMarks() != null ? q.getMarks() : 1) : BigDecimal.ZERO;
                      aMap.put("marks_obtained", marks);
                  }
                  
                  List<ExamOption> options = examOptionRepo.findByQuestionId(q.getId());
                  List<Map<String, Object>> oList = new ArrayList<>();
                  for (ExamOption o : options) {
                      Map<String, Object> oMap = new LinkedHashMap<>();
                      oMap.put("id", o.getId());
                      oMap.put("option_text", o.getOptionText());
                      oMap.put("is_correct", o.getIsCorrect());
                      oList.add(oMap);
                  }
                  aMap.put("options", oList);
              });

            answerList.add(aMap);
        }
        result.put("answers", answerList);
        return result;
    }

    @Transactional
    public boolean evaluateSubmission(Long submissionId, List<Map<String, Object>> evaluations) {
        ExamSubmission sub = examSubmissionRepo.findById(submissionId).orElse(null);
        if (sub == null) return false;

        BigDecimal totalScore = BigDecimal.ZERO;
        for (Map<String, Object> eval : evaluations) {
            Object answerIdObj = eval.get("answer_id");
            Object marksObj = eval.get("marks");
            
            if (answerIdObj == null || marksObj == null) continue;
            
            Long answerId = Long.valueOf(answerIdObj.toString().replace(".0", ""));
            BigDecimal marks = new BigDecimal(marksObj.toString());

            ExamSubmissionAnswer answer = examSubmissionAnswerRepo.findById(answerId).orElse(null);
            if (answer != null) {
                ExamQuestion q = examQuestionRepo.findById(answer.getQuestionId()).orElse(null);
                String qType = q != null && q.getQuestionType() != null ? q.getQuestionType().toLowerCase() : "";

                // If section break, marks are 0 and not counted
                if (q != null && (Boolean.TRUE.equals(q.getIsSectionTitle()) || "section_break".equals(qType) || "section_header".equals(qType) || "section".equals(qType))) {
                    answer.setMarksObtained(BigDecimal.ZERO);
                    answer.setIsCorrect(null);
                    examSubmissionAnswerRepo.save(answer);
                    continue;
                }

                // If MCQ or Fillups, enforce auto-graded marks (staff intervention not allowed)
                if ("mcq".equals(qType)) {
                    Optional<ExamOption> correctOpt = examOptionRepo.findByQuestionIdAndIsCorrect(q.getId(), 1);
                    boolean isCorrect = correctOpt.map(o -> o.getId().equals(answer.getSelectedOptionId())).orElse(false);
                    marks = isCorrect && q.getMarks() != null ? new BigDecimal(q.getMarks()) : BigDecimal.ZERO;
                    answer.setIsCorrect(isCorrect ? 1 : 0);
                } else if ("fillups".equals(qType) || "fill_in_the_blanks".equals(qType) || "fill".equals(qType)) {
                    String expText = q.getCorrectAnswer() != null ? q.getCorrectAnswer().trim() : "";
                    String ansText = answer.getAnswerText() != null ? answer.getAnswerText().trim() : "";
                    boolean isCorrect = !expText.isEmpty() && expText.equalsIgnoreCase(ansText);
                    marks = isCorrect && q.getMarks() != null ? new BigDecimal(q.getMarks()) : BigDecimal.ZERO;
                    answer.setIsCorrect(isCorrect ? 1 : 0);
                } else {
                    // Descriptive / Either_Or / Text: staff intervention mark
                    BigDecimal maxMarks = q != null && q.getMarks() != null
                        ? new BigDecimal(q.getMarks().toString())
                        : BigDecimal.valueOf(999999);
                    
                    if (marks.compareTo(maxMarks) > 0) {
                        marks = maxMarks;
                    }
                    if (marks.compareTo(BigDecimal.ZERO) < 0) {
                        marks = BigDecimal.ZERO;
                    }
                    answer.setIsCorrect(marks.compareTo(BigDecimal.ZERO) > 0 ? 1 : 0);
                }
                
                answer.setMarksObtained(marks);
                examSubmissionAnswerRepo.save(answer);
                totalScore = totalScore.add(marks);
            }
        }

        sub.setTotalScore(totalScore);
        sub.setIsEvaluated(1);
        sub.setStatus("evaluated");
        examSubmissionRepo.save(sub);
        return true;
    }

    @Transactional
    public void savePerformance(Map<String, Object> data) {
        if (data == null || !data.containsKey("exam_id")) {
            throw new IllegalArgumentException("Exam ID is required");
        }
        Long examId = Long.valueOf(data.get("exam_id").toString());
        List<Map<String, Object>> evaluations = (List<Map<String, Object>>) data.get("evaluations");

        Optional<Exam> internalExamOpt = examRepo.findById(examId);
        if (internalExamOpt.isPresent()) {
            Object studentIdVal = data.get("student_id") != null ? data.get("student_id") : data.get("participant_id");
            if (studentIdVal == null) {
                throw new IllegalArgumentException("Student ID is required");
            }
            Long studentId = Long.valueOf(studentIdVal.toString());

            Optional<ExamSubmission> lastSub = examSubmissionRepo
                .findTopByExamIdAndStudentIdOrderByAttemptNumberDesc(examId, studentId);

            int attemptNumber = lastSub.map(s -> s.getAttemptNumber() + 1).orElse(1);
            LocalDateTime now = LocalDateTime.now();

            ExamSubmission submission = lastSub.filter(s -> "submitted".equalsIgnoreCase(s.getStatus()) || "ongoing".equalsIgnoreCase(s.getStatus()))
                .orElse(null);

            if (submission == null) {
                submission = ExamSubmission.builder()
                    .examId(examId)
                    .studentId(studentId)
                    .startTime(now)
                    .endTime(now)
                    .totalScore(BigDecimal.ZERO)
                    .isEvaluated(1)
                    .attemptNumber(attemptNumber)
                    .status("evaluated")
                    .build();
                submission = examSubmissionRepo.save(submission);
            } else {
                submission.setEndTime(now);
                submission.setIsEvaluated(1);
                submission.setStatus("evaluated");
            }

            BigDecimal totalScore = BigDecimal.ZERO;
            if (evaluations != null) {
                for (Map<String, Object> eval : evaluations) {
                    if (!eval.containsKey("question_id")) continue;
                    Long questionId = Long.valueOf(eval.get("question_id").toString());
                    Object mVal = eval.get("marks") != null ? eval.get("marks") : eval.get("marks_obtained");
                    BigDecimal marks = mVal != null ? new BigDecimal(mVal.toString()) : BigDecimal.ZERO;
                    String remarks = eval.get("remarks") != null ? eval.get("remarks").toString() : "";

                    ExamQuestion question = examQuestionRepo.findById(questionId).orElse(null);
                    if (question != null && (Boolean.TRUE.equals(question.getIsSectionTitle()) || 
                        "section_header".equalsIgnoreCase(question.getQuestionType()) || 
                        "section_break".equalsIgnoreCase(question.getQuestionType()))) {
                        continue;
                    }

                    if (question != null && question.getMarks() != null) {
                        BigDecimal maxMarks = new BigDecimal(question.getMarks().toString());
                        if (marks.compareTo(maxMarks) > 0) marks = maxMarks;
                    }
                    if (marks.compareTo(BigDecimal.ZERO) < 0) marks = BigDecimal.ZERO;

                    ExamSubmissionAnswer answer = examSubmissionAnswerRepo.findBySubmissionIdAndQuestionId(submission.getId(), questionId)
                        .orElse(new ExamSubmissionAnswer());
                    answer.setSubmissionId(submission.getId());
                    answer.setQuestionId(questionId);
                    answer.setMarksObtained(marks);
                    answer.setAnswerText(remarks);
                    answer.setIsCorrect(marks.compareTo(BigDecimal.ZERO) > 0 ? 1 : 0);
                    examSubmissionAnswerRepo.save(answer);

                    totalScore = totalScore.add(marks);
                }
            }

            submission.setTotalScore(totalScore);
            submission.setIsEvaluated(1);
            submission.setStatus("evaluated");
            submission.setEndTime(now);
            examSubmissionRepo.save(submission);
            return;
        }

        Optional<ExternalExam> externalExamOpt = externalExamRepo.findById(examId);
        if (externalExamOpt.isPresent()) {
            Object participantIdVal = data.get("participant_id") != null ? data.get("participant_id") : data.get("student_id");
            if (participantIdVal == null) {
                throw new IllegalArgumentException("Participant ID is required");
            }
            Long participantId = Long.valueOf(participantIdVal.toString());

            Optional<ExternalExamSubmission> lastSub = externalSubmissionRepo
                .findTopByExamIdAndParticipantIdOrderByAttemptNumberDesc(examId, participantId);

            int attemptNumber = lastSub.map(s -> s.getAttemptNumber() + 1).orElse(1);
            LocalDateTime now = LocalDateTime.now();

            ExternalExamSubmission submission = lastSub.filter(s -> "submitted".equalsIgnoreCase(s.getStatus()))
                .orElse(null);

            if (submission == null) {
                submission = ExternalExamSubmission.builder()
                    .examId(examId)
                    .participantId(participantId)
                    .submittedAt(now)
                    .score(BigDecimal.ZERO)
                    .isEvaluated(1)
                    .status("evaluated")
                    .attemptNumber(attemptNumber)
                    .build();
                submission = externalSubmissionRepo.save(submission);
            } else {
                submission.setSubmittedAt(now);
                submission.setIsEvaluated(1);
                submission.setStatus("evaluated");
            }

            BigDecimal totalScore = BigDecimal.ZERO;
            if (evaluations != null) {
                for (Map<String, Object> eval : evaluations) {
                    if (!eval.containsKey("question_id")) continue;
                    Long questionId = Long.valueOf(eval.get("question_id").toString());
                    Object mVal = eval.get("marks_obtained") != null ? eval.get("marks_obtained") : eval.get("marks");
                    BigDecimal marks = mVal != null ? new BigDecimal(mVal.toString()) : BigDecimal.ZERO;
                    String remarks = eval.get("remarks") != null ? eval.get("remarks").toString() : "";

                    ExternalQuestion question = externalQuestionRepo.findById(questionId).orElse(null);
                    if (question != null && (Boolean.TRUE.equals(question.getIsSectionTitle()) || 
                        "section_header".equalsIgnoreCase(question.getQuestionType()) || 
                        "section_break".equalsIgnoreCase(question.getQuestionType()))) {
                        continue;
                    }

                    if (question != null && question.getMarks() != null) {
                        BigDecimal maxMarks = new BigDecimal(question.getMarks().toString());
                        if (marks.compareTo(maxMarks) > 0) marks = maxMarks;
                    }
                    if (marks.compareTo(BigDecimal.ZERO) < 0) marks = BigDecimal.ZERO;

                    ExternalSubmissionAnswer answer = externalSubmissionAnswerRepo.findBySubmissionIdAndQuestionId(submission.getId(), questionId)
                        .orElse(new ExternalSubmissionAnswer());
                    answer.setSubmissionId(submission.getId());
                    answer.setQuestionId(questionId);
                    answer.setMarksObtained(marks);
                    answer.setAnswerText(remarks);
                    answer.setIsCorrect(marks.compareTo(BigDecimal.ZERO) > 0 ? 1 : 0);
                    externalSubmissionAnswerRepo.save(answer);

                    totalScore = totalScore.add(marks);
                }
            }

            submission.setScore(totalScore);
            submission.setIsEvaluated(1);
            submission.setStatus("evaluated");
            submission.setSubmittedAt(now);
            externalSubmissionRepo.save(submission);
            return;
        }
    }

    // ============ EXTERNAL EXAMS (Exams_model.php lines 452-800) ============

    public Object getExternalExams(Long examId, Map<String, String> filters, Map<String, Object> details) {
        String role = details != null ? details.getOrDefault("role", "").toString().toLowerCase() : "";
        String type = details != null ? details.getOrDefault("type", "").toString().toLowerCase() : "";
        Long currentUserId = (details != null && details.get("id") != null)
            ? Long.valueOf(details.get("id").toString())
            : null;
        boolean isStaffUser = currentUserId != null && ("staff".equals(type) || "staff".equals(role));

        List<ExternalExam> exams;
        if (examId != null) {
            exams = externalExamRepo.findById(examId)
                .filter(exam -> !isStaffUser || Objects.equals(exam.getCreatedBy(), currentUserId))
                .map(List::of)
                .orElse(List.of());
        } else if (filters != null && filters.containsKey("id") && filters.get("id") != null && !filters.get("id").isBlank()) {
            String slugOrId = filters.get("id").trim();
            exams = externalExamRepo.findBySlug(slugOrId)
                .filter(exam -> !isStaffUser || Objects.equals(exam.getCreatedBy(), currentUserId))
                .map(List::of)
                .orElse(List.of());
        } else if (isStaffUser) {
            exams = externalExamRepo.findAll().stream()
                .filter(exam -> Objects.equals(exam.getCreatedBy(), currentUserId))
                .collect(Collectors.toList());
        } else if (details == null) {
            exams = Collections.emptyList();
        } else {
            exams = externalExamRepo.findAll();
        }

        System.out.println("Processing getExternalExams. filters: " + filters);
        if (filters != null && examId == null) {
            exams = applyExamDateFilters(exams, filters);
            exams = applySearchFilters(exams, filters);
        }
        System.out.println("Computed external exams list size: " + (exams != null ? exams.size() : 0));

        if (exams != null && exams.size() > 1) {
            exams = new ArrayList<>(exams);
            exams.sort((a, b) -> {
                Long idA = a.getId() != null ? a.getId() : 0L;
                Long idB = b.getId() != null ? b.getId() : 0L;
                return Long.compare(idB, idA);
            });
        }

        boolean isPaged = filters != null && filters.containsKey("page") && examId == null;
        int totalElements = exams != null ? exams.size() : 0;
        int page = 0;
        int size = 10;
        if (isPaged) {
            try {
                page = Math.max(0, Integer.parseInt(filters.get("page")));
            } catch (Exception ignored) {}
            try {
                if (filters.containsKey("size")) {
                    size = Math.max(1, Integer.parseInt(filters.get("size")));
                }
            } catch (Exception ignored) {}
        }

        int totalPages = (int) Math.ceil((double) totalElements / size);
        if (totalPages == 0) totalPages = 1;

        List<ExternalExam> examsToProcess;
        if (isPaged) {
            int startIdx = page * size;
            if (startIdx >= totalElements) {
                examsToProcess = Collections.emptyList();
            } else {
                int endIdx = Math.min(startIdx + size, totalElements);
                examsToProcess = exams.subList(startIdx, endIdx);
            }
        } else {
            examsToProcess = exams != null ? exams : Collections.emptyList();
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (ExternalExam e : examsToProcess) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", e.getId());
            map.put("title", e.getTitle());
            map.put("slug", e.getSlug());
            map.put("course_id", e.getCourseId());
            map.put("total_marks", e.getTotalMarks());
            map.put("duration_minutes", e.getDurationMinutes());
            map.put("exam_type", e.getExamType());
            map.put("pass_percentage", e.getPassPercentage());
            map.put("status", e.getStatus());
            map.put("exam_date", e.getExamDate());
            map.put("results_published", e.getResultsPublished());
            
            if (e.getCreatedBy() != null) {
                userRepo.findById(e.getCreatedBy()).ifPresentOrElse(u -> {
                    String name = u.getFullName();
                    if (name == null || name.isBlank()) name = u.getUsername();
                    map.put("instructor_name", name);
                }, () -> {
                    // Check staff table if not found in users
                    staffRepo.findById(e.getCreatedBy()).ifPresent(s -> {
                        map.put("instructor_name", s.getName());
                    });
                });
            } else {
                map.put("instructor_name", "System Admin");
            }

            List<ExternalQuestion> questions = externalQuestionRepo.findByExamId(e.getId());
            map.put("question_count", questions.size());

            int computedTotalMarks = questions.stream()
                .filter(q -> !Boolean.TRUE.equals(q.getIsSectionTitle()) && !"section_break".equalsIgnoreCase(q.getQuestionType()))
                .mapToInt(q -> q.getMarks() != null ? q.getMarks() : 1)
                .sum();
            if (e.getTotalMarks() == null || e.getTotalMarks() == 0) {
                map.put("total_marks", computedTotalMarks);
            }
            if (e.getDurationMinutes() == null || e.getDurationMinutes() == 0) {
                map.put("duration_minutes", 60);
            }

            boolean isPublicPortal = (details == null);
            List<Map<String, Object>> qList = new ArrayList<>();
            for (ExternalQuestion q : questions) {
                Map<String, Object> qMap = new LinkedHashMap<>();
                qMap.put("id", q.getId());
                qMap.put("question_type", q.getQuestionType());
                qMap.put("question_text", q.getQuestionText());
                qMap.put("marks", q.getMarks() != null ? q.getMarks() : 1);
                qMap.put("is_section_title", Boolean.TRUE.equals(q.getIsSectionTitle()));
                qMap.put("is_section_break", "section_break".equalsIgnoreCase(q.getQuestionType()));
                qMap.put("order_index", q.getOrderIndex() != null ? q.getOrderIndex() : 0);

                if (!isPublicPortal) {
                    qMap.put("correct_answer", q.getCorrectAnswer());
                }

                if (q.getMatchPairsJson() != null && !q.getMatchPairsJson().isBlank()) {
                    try {
                        qMap.put("match_pairs", objectMapper.readValue(q.getMatchPairsJson(), Object.class));
                    } catch (Exception ignored) {}
                }
                
                List<ExternalOption> options = externalOptionRepo.findByQuestionId(q.getId());
                List<Map<String, Object>> oList = new ArrayList<>();
                for (ExternalOption o : options) {
                    Map<String, Object> oMap = new LinkedHashMap<>();
                    oMap.put("id", o.getId());
                    oMap.put("option_text", o.getOptionText());
                    if (!isPublicPortal) {
                        oMap.put("is_correct", o.getIsCorrect());
                    }
                    oList.add(oMap);
                }
                qMap.put("options", oList);
                qList.add(qMap);
            }
            qList.sort(Comparator.comparingInt(q -> {
                Object idx = q.get("order_index");
                return idx instanceof Number ? ((Number) idx).intValue() : 0;
            }));
            map.put("questions", qList);
            map.put("participant_count", externalParticipantRepo.findByExamId(e.getId()).size());
            map.put("submission_count", externalSubmissionRepo.findByExamId(e.getId()).size());

            result.add(map);
        }

        if (isPaged) {
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("content", result);
            response.put("totalElements", totalElements);
            response.put("totalPages", totalPages);
            response.put("currentPage", page + 1);
            response.put("size", size);
            return response;
        }

        return result;
    }

    @Transactional
    public Long saveExternalExam(Map<String, Object> data) {
        Long id = data.containsKey("id") && data.get("id") != null ?
            Long.valueOf(data.get("id").toString()) : null;

        ExternalExam exam;
        if (id != null) {
            exam = externalExamRepo.findById(id).orElse(new ExternalExam());
        } else {
            exam = new ExternalExam();
            exam.setCreatedAt(LocalDateTime.now());
            exam.setResultsPublished(0);
        }

        if (data.containsKey("title")) exam.setTitle((String) data.get("title"));
        if (data.containsKey("description")) exam.setDescription((String) data.get("description"));
        if (data.containsKey("slug")) exam.setSlug((String) data.get("slug"));
        Object courseIdValue = data.containsKey("course_id") ? data.get("course_id") : data.get("courseId");
        if (courseIdValue != null && !courseIdValue.toString().isBlank()) {
            exam.setCourseId(Long.valueOf(courseIdValue.toString()));
        }
        if (data.containsKey("total_marks")) exam.setTotalMarks(Integer.valueOf(data.get("total_marks").toString()));
        if (data.containsKey("duration_minutes")) exam.setDurationMinutes(Integer.valueOf(data.get("duration_minutes").toString()));
        if (data.containsKey("pass_percentage")) exam.setPassPercentage(Integer.valueOf(data.get("pass_percentage").toString()));
        if (data.containsKey("exam_type")) exam.setExamType((String) data.get("exam_type"));
        if (data.containsKey("status")) exam.setStatus((String) data.get("status"));
        if (data.containsKey("created_by")) exam.setCreatedBy(Long.valueOf(data.get("created_by").toString()));
        Object examDateValue = data.containsKey("exam_date") ? data.get("exam_date") : data.get("examDate");
        if (examDateValue != null && !examDateValue.toString().isBlank()) {
            exam.setExamDate(java.time.LocalDate.parse(examDateValue.toString()));
        }
        exam.setUpdatedAt(LocalDateTime.now());

        // Auto-generate slug
        if (exam.getSlug() == null || exam.getSlug().isEmpty()) {
            exam.setSlug(exam.getTitle().toLowerCase().replaceAll("[^a-z0-9]+", "-") + "-" + System.currentTimeMillis());
        }

        ExternalExam saved = externalExamRepo.save(exam);

        // Save questions
        if (data.containsKey("questions") && data.get("questions") instanceof List) {
            List<ExternalQuestion> oldQuestions = externalQuestionRepo.findByExamId(saved.getId());
            for (ExternalQuestion oq : oldQuestions) {
                externalOptionRepo.deleteByQuestionId(oq.getId());
            }
            externalQuestionRepo.deleteByExamId(saved.getId());

            List<Map<String, Object>> questions = (List<Map<String, Object>>) data.get("questions");
            int order = 0;
            for (Map<String, Object> qData : questions) {
                ExternalQuestion question = new ExternalQuestion();
                question.setExamId(saved.getId());
                question.setQuestionType((String) qData.getOrDefault("question_type", "mcq"));
                question.setQuestionText((String) qData.get("question_text"));
                question.setMarks(qData.containsKey("marks") ? Integer.valueOf(qData.get("marks").toString()) : 1);
                question.setOrderIndex(order++);

                if (qData.containsKey("correct_answer") && qData.get("correct_answer") != null) {
                    question.setCorrectAnswer(qData.get("correct_answer").toString());
                } else if (qData.containsKey("correctAnswer") && qData.get("correctAnswer") != null) {
                    question.setCorrectAnswer(qData.get("correctAnswer").toString());
                }
                if (qData.containsKey("is_section_title")) {
                    question.setIsSectionTitle(Boolean.TRUE.equals(qData.get("is_section_title")) || "1".equals(String.valueOf(qData.get("is_section_title"))));
                }
                if (qData.containsKey("is_section_break")) {
                    if (Boolean.TRUE.equals(qData.get("is_section_break")) || "1".equals(String.valueOf(qData.get("is_section_break")))) {
                        question.setIsSectionTitle(true);
                    }
                }
                String checkType = question.getQuestionType() != null ? question.getQuestionType().toLowerCase() : "";
                if (Boolean.TRUE.equals(question.getIsSectionTitle()) || "section_header".equals(checkType) || "section_break".equals(checkType) || "section".equals(checkType)) {
                    question.setMarks(0);
                    question.setIsSectionTitle(true);
                }
                if (qData.containsKey("match_pairs")) {
                    try {
                        question.setMatchPairsJson(objectMapper.writeValueAsString(qData.get("match_pairs")));
                    } catch (Exception ignored) {}
                }

                ExternalQuestion savedQ = externalQuestionRepo.save(question);

                if (qData.containsKey("options") && qData.get("options") instanceof List) {
                    for (Map<String, Object> oData : sanitizeOptions((List<Map<String, Object>>) qData.get("options"))) {
                        ExternalOption option = new ExternalOption();
                        option.setQuestionId(savedQ.getId());
                        option.setOptionText((String) oData.get("option_text"));
                        option.setIsCorrect(oData.containsKey("is_correct") ?
                            (Boolean.TRUE.equals(oData.get("is_correct")) || "1".equals(oData.get("is_correct").toString()) ? 1 : 0) : 0);
                        externalOptionRepo.save(option);
                    }
                }
            }
        }

        return saved.getId();
    }

    // ============ EXTERNAL LOGIN (Exams_model.php lines 680-720) ============

    public Map<String, Object> externalLogin(Long examId, String email, String password) {
        if (email == null || password == null) return null;
        String ident = email.trim();
        String pass = password.trim();
        Optional<ExternalParticipant> pOpt = externalParticipantRepo.findByExamIdAndIdentifierAndPassword(examId, ident, pass);
        if (pOpt.isEmpty()) {
            pOpt = externalParticipantRepo.findByExamIdAndEmailAndPassword(examId, ident, pass);
        }
        if (pOpt.isPresent()) {
            ExternalParticipant p = pOpt.get();
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", p.getId());
            result.put("name", p.getName());
            result.put("email", p.getEmail());
            result.put("exam_id", p.getExamId());
            Optional<ExternalExamSubmission> latestSubmission = externalSubmissionRepo
                .findTopByExamIdAndParticipantIdOrderByAttemptNumberDesc(examId, p.getId());
            boolean hasSubmitted = latestSubmission.isPresent();
            result.put("has_submitted", hasSubmitted);
            latestSubmission.ifPresent(sub -> {
                result.put("submission_id", sub.getId());
                result.put("attempt_number", sub.getAttemptNumber());
                result.put("submission_status", sub.getStatus());
                result.put("is_evaluated", sub.getIsEvaluated());
            });
            externalExamRepo.findById(examId).ifPresent(exam -> {
                result.put("results_published", exam.getResultsPublished());
                result.put("exam_title", exam.getTitle());
            });
            return result;
        }
        return null;
    }

    // ============ QUESTION BANK (Exams_model.php lines 900-1000) ============

    public List<Map<String, Object>> getQuestionBank(Long courseId) {
        List<QuestionTemplate> templates = templateRepo.findAll();
        if (courseId != null) {
            templates = templates.stream()
                .filter(template -> Objects.equals(template.getCourseId(), courseId) || template.getCourseId() == null)
                .collect(Collectors.toList());
        }

        List<Map<String, Object>> result = new ArrayList<>();
        for (QuestionTemplate t : templates) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", t.getId());
            map.put("title", t.getTitle());
            map.put("course_id", t.getCourseId());
            map.put("subject", t.getSubject());

            List<TemplateQuestion> questions = templateQuestionRepo.findByTemplateId(t.getId());
            List<Map<String, Object>> qList = new ArrayList<>();
            for (TemplateQuestion q : questions) {
                Map<String, Object> qMap = new LinkedHashMap<>();
                qMap.put("id", q.getId());
                qMap.put("question_type", q.getQuestionType());
                qMap.put("question_text", q.getQuestionText() != null ? q.getQuestionText() : "");
                qMap.put("marks", q.getMarks());
                qMap.put("correct_answer", q.getCorrectAnswer());
                qMap.put("is_section_title", Boolean.TRUE.equals(q.getIsSectionTitle()));
                if (q.getMatchPairsJson() != null && !q.getMatchPairsJson().isBlank()) {
                    try {
                        qMap.put("match_pairs", objectMapper.readValue(q.getMatchPairsJson(), List.class));
                    } catch (Exception e) {
                        qMap.put("match_pairs", Collections.emptyList());
                    }
                }
                qMap.put("options", templateOptionRepo.findByQuestionId(q.getId()));
                qList.add(qMap);
            }
            map.put("questions", qList);
            result.add(map);
        }
        return result;
    }

    @Transactional
    public Long saveQuestionBank(Map<String, Object> data) {
        Long id = data.containsKey("id") && data.get("id") != null ?
            Long.valueOf(data.get("id").toString()) : null;

        QuestionTemplate template;
        if (id != null) {
            template = templateRepo.findById(id).orElse(new QuestionTemplate());
        } else {
            template = new QuestionTemplate();
            template.setCreatedAt(LocalDateTime.now());
        }

        if (data.containsKey("title")) template.setTitle((String) data.get("title"));
        Object courseIdValue = data.containsKey("course_id") ? data.get("course_id") : data.get("courseId");
        if (courseIdValue != null && !courseIdValue.toString().isBlank()) {
            template.setCourseId(Long.valueOf(courseIdValue.toString()));
        }
        if (data.containsKey("subject")) {
            template.setSubject((String) data.get("subject"));
        } else if (data.containsKey("selectedSubject")) {
            template.setSubject((String) data.get("selectedSubject"));
        }
        template.setUpdatedAt(LocalDateTime.now());

        QuestionTemplate saved = templateRepo.save(template);

        if (data.containsKey("questions") && data.get("questions") instanceof List) {
            List<TemplateQuestion> oldQuestions = templateQuestionRepo.findByTemplateId(saved.getId());
            for (TemplateQuestion oq : oldQuestions) {
                templateOptionRepo.deleteByQuestionId(oq.getId());
            }
            templateQuestionRepo.deleteByTemplateId(saved.getId());

            for (Map<String, Object> qData : (List<Map<String, Object>>) data.get("questions")) {
                TemplateQuestion question = new TemplateQuestion();
                question.setTemplateId(saved.getId());
                question.setQuestionType((String) qData.getOrDefault("question_type", "mcq"));
                question.setQuestionText(qData.get("question_text") != null ? qData.get("question_text").toString() : "");
                question.setMarks(qData.containsKey("marks") ? Integer.valueOf(qData.get("marks").toString()) : 1);
                
                if (qData.containsKey("correct_answer") && qData.get("correct_answer") != null) {
                    question.setCorrectAnswer(qData.get("correct_answer").toString());
                }
                if (qData.containsKey("is_section_title")) {
                    question.setIsSectionTitle(Boolean.TRUE.equals(qData.get("is_section_title")) || "true".equalsIgnoreCase(String.valueOf(qData.get("is_section_title"))));
                }
                if (qData.containsKey("match_pairs") && qData.get("match_pairs") instanceof List) {
                    try {
                        question.setMatchPairsJson(objectMapper.writeValueAsString(qData.get("match_pairs")));
                    } catch (Exception e) {
                        question.setMatchPairsJson(null);
                    }
                }

                TemplateQuestion savedQ = templateQuestionRepo.save(question);

                if (qData.containsKey("options") && qData.get("options") instanceof List) {
                    for (Map<String, Object> oData : sanitizeOptions((List<Map<String, Object>>) qData.get("options"))) {
                        TemplateOption option = new TemplateOption();
                        option.setQuestionId(savedQ.getId());
                        option.setOptionText((String) oData.get("option_text"));
                        option.setIsCorrect(oData.containsKey("is_correct") ?
                            (Boolean.TRUE.equals(oData.get("is_correct")) || "1".equals(oData.get("is_correct").toString()) ? 1 : 0) : 0);
                        templateOptionRepo.save(option);
                    }
                }
            }
        }

        return saved.getId();
    }

    private <T> List<T> applySearchFilters(List<T> exams, Map<String, String> filters) {
        String query = valueOrNull(filters.get("q"));
        if (query == null || query.isBlank()) return exams;
        
        final String lowerQuery = query.toLowerCase().trim();
        return exams.stream().filter(exam -> {
            String title = "";
            if (exam instanceof Exam e) title = e.getTitle();
            else if (exam instanceof ExternalExam ee) title = ee.getTitle();
            else if (exam instanceof Map m) title = Objects.toString(m.get("title"), "");
            
            return title != null && title.toLowerCase().contains(lowerQuery);
        }).collect(Collectors.toList());
    }

    private <T> List<T> applyExamDateFilters(List<T> exams, Map<String, String> filters) {
        String examDateFilter = valueOrNull(filters.get("exam_date"));
        String dateFromFilter = valueOrNull(filters.get("date_from"));
        String dateToFilter = valueOrNull(filters.get("date_to"));
        String createdFromFilter = valueOrNull(filters.get("created_from"));
        String createdToFilter = valueOrNull(filters.get("created_to"));

        if (examDateFilter == null && dateFromFilter == null && dateToFilter == null &&
            createdFromFilter == null && createdToFilter == null) {
            return exams;
        }

        java.time.LocalDate examDate = null;
        java.time.LocalDate dateFrom = null;
        java.time.LocalDate dateTo = null;
        java.time.LocalDate createdFrom = null;
        java.time.LocalDate createdTo = null;

        try {
            if (examDateFilter != null) examDate = java.time.LocalDate.parse(examDateFilter);
            if (dateFromFilter != null) dateFrom = java.time.LocalDate.parse(dateFromFilter);
            if (dateToFilter != null) dateTo = java.time.LocalDate.parse(dateToFilter);
            if (createdFromFilter != null) createdFrom = java.time.LocalDate.parse(createdFromFilter);
            if (createdToFilter != null) createdTo = java.time.LocalDate.parse(createdToFilter);
        } catch (Exception e) {
            System.err.println("Filtering error: Malformed date string - " + e.getMessage());
        }

        final java.time.LocalDate fExamDate = examDate;
        final java.time.LocalDate fDateFrom = dateFrom;
        final java.time.LocalDate fDateTo = dateTo;
        final java.time.LocalDate fCreatedFrom = createdFrom;
        final java.time.LocalDate fCreatedTo = createdTo;

        return exams.stream().filter(exam -> {
            java.time.LocalDate itemDate = extractExamDate(exam);
            java.time.LocalDate createdAtDate = extractCreatedAt(exam);

            // Scheduled Date or Created Date Filters
            if (fExamDate != null) {
                boolean matchExamDate = itemDate != null && itemDate.equals(fExamDate);
                boolean matchCreated = createdAtDate != null && createdAtDate.equals(fExamDate);
                if (!matchExamDate && !matchCreated) return false;
            }
            if (fDateFrom != null) {
                boolean matchExamDate = itemDate != null && !itemDate.isBefore(fDateFrom);
                boolean matchCreated = createdAtDate != null && !createdAtDate.isBefore(fDateFrom);
                if (!matchExamDate && !matchCreated) return false;
            }
            if (fDateTo != null) {
                boolean matchExamDate = itemDate != null && !itemDate.isAfter(fDateTo);
                boolean matchCreated = createdAtDate != null && !createdAtDate.isAfter(fDateTo);
                if (!matchExamDate && !matchCreated) return false;
            }

            // Created At Filters - Be lenient if createdAt is null (show anyway unless explicitly filtering)
            if (fCreatedFrom != null) {
                if (createdAtDate == null) return false; // Hide if we have a filter but no date
                if (createdAtDate.isBefore(fCreatedFrom)) return false;
            }
            if (fCreatedTo != null) {
                if (createdAtDate == null) return false;
                if (createdAtDate.isAfter(fCreatedTo)) return false;
            }

            return true;
        }).collect(Collectors.toList());
    }

    private java.time.LocalDate extractExamDate(Object exam) {
        if (exam instanceof Exam internalExam) return internalExam.getExamDate();
        if (exam instanceof ExternalExam externalExam) return externalExam.getExamDate();
        return null;
    }

    private java.time.LocalDate extractCreatedAt(Object exam) {
        if (exam instanceof Exam internalExam) {
            return internalExam.getCreatedAt() != null ? internalExam.getCreatedAt().toLocalDate() : null;
        }
        if (exam instanceof ExternalExam externalExam) {
            return externalExam.getCreatedAt() != null ? externalExam.getCreatedAt().toLocalDate() : null;
        }
        return null;
    }

    private String valueOrNull(String value) {
        return value == null || value.isBlank() ? null : value;
    }

    private List<Map<String, Object>> sanitizeOptions(List<Map<String, Object>> options) {
        if (options == null) {
            return List.of();
        }

        return options.stream()
            .filter(Objects::nonNull)
            .map(option -> {
                Map<String, Object> sanitized = new LinkedHashMap<>(option);
                Object optionText = sanitized.get("option_text");
                sanitized.put("option_text", optionText != null ? optionText.toString().trim() : "");
                return sanitized;
            })
            .filter(option -> !Objects.toString(option.get("option_text"), "").isBlank())
            .collect(Collectors.toList());
    }

    public List<Map<String, Object>> getExternalParticipants(Long examId) {
        List<ExternalParticipant> pts = externalParticipantRepo.findByExamId(examId);
        List<Map<String, Object>> res = new ArrayList<>();
        for (ExternalParticipant p : pts) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", p.getId());
            m.put("exam_id", p.getExamId());
            m.put("name", p.getName());
            m.put("email", p.getEmail());
            m.put("mobile", p.getMobile());
            m.put("password", p.getPassword());
            m.put("created_at", p.getCreatedAt());
            res.add(m);
        }
        return res;
    }

    @Transactional
    public Long saveExternalParticipant(Map<String, Object> data) {
        Long examId = Long.valueOf(data.get("exam_id").toString());
        String name = Objects.toString(data.get("name"), "").trim();
        String email = Objects.toString(data.get("email"), "").trim();
        String password = Objects.toString(data.get("password"), "").trim();
        String mobile = Objects.toString(data.getOrDefault("mobile", ""), "").trim();

        if (name.isBlank() || email.isBlank() || password.isBlank()) {
            throw new IllegalArgumentException("Name, email, and password are required");
        }

        externalExamRepo.findById(examId)
            .orElseThrow(() -> new IllegalArgumentException("External exam not found"));

        if (externalParticipantRepo.findByExamIdAndEmail(examId, email).isPresent()) {
            throw new IllegalArgumentException("Candidate email already exists for this exam");
        }

        ExternalParticipant participant = ExternalParticipant.builder()
            .examId(examId)
            .name(name)
            .email(email)
            .password(password)
            .mobile(mobile.isBlank() ? null : mobile)
            .createdAt(LocalDateTime.now())
            .build();

        return externalParticipantRepo.save(participant).getId();
    }

    @Transactional
    public int bulkSaveExternalParticipants(Long examId, List<Map<String, Object>> participants) {
        externalExamRepo.findById(examId)
            .orElseThrow(() -> new IllegalArgumentException("External exam not found"));

        if (participants == null || participants.isEmpty()) {
            return 0;
        }

        int savedCount = 0;
        for (Map<String, Object> participantData : participants) {
            if (participantData == null) continue;

            String name = Objects.toString(participantData.get("name"), "").trim();
            String email = Objects.toString(participantData.get("email"), "").trim();
            String password = Objects.toString(participantData.get("password"), "").trim();
            String mobile = Objects.toString(participantData.getOrDefault("mobile", ""), "").trim();

            if (name.isBlank() || email.isBlank() || password.isBlank()) {
                continue;
            }

            if (externalParticipantRepo.findByExamIdAndEmail(examId, email).isPresent()) {
                continue;
            }

            ExternalParticipant participant = ExternalParticipant.builder()
                .examId(examId)
                .name(name)
                .email(email)
                .password(password)
                .mobile(mobile.isBlank() ? null : mobile)
                .createdAt(LocalDateTime.now())
                .build();
            externalParticipantRepo.save(participant);
            savedCount++;
        }

        return savedCount;
    }

    public List<Map<String, Object>> getExternalSubmissions(Long examId) {
        List<ExternalExamSubmission> subs = examId != null ?
            externalSubmissionRepo.findByExamId(examId) :
            externalSubmissionRepo.findAll();
        List<Map<String, Object>> res = new ArrayList<>();
        for (ExternalExamSubmission s : subs) {
            Map<String, Object> m = new LinkedHashMap<>();
            m.put("id", s.getId());
            m.put("exam_id", s.getExamId());
            m.put("participant_id", s.getParticipantId());
            m.put("score", s.getScore());
            m.put("is_evaluated", s.getIsEvaluated());
            m.put("status_eval", s.getStatus());
            m.put("submitted_at", s.getSubmittedAt());
            m.put("attempt_number", s.getAttemptNumber());
            
            externalParticipantRepo.findById(s.getParticipantId()).ifPresent(p -> {
                m.put("name", p.getName());
                m.put("email", p.getEmail());
            });
            externalExamRepo.findById(s.getExamId()).ifPresent(e -> {
                m.put("title", e.getTitle());
                m.put("total_marks", e.getTotalMarks());
                m.put("pass_percentage", e.getPassPercentage());
            });
            
            res.add(m);
        }
        return res;
    }

    public Map<String, Object> getExternalSubmissionDetails(Long id) {
        ExternalExamSubmission sub = externalSubmissionRepo.findById(id).orElse(null);
        if (sub == null) return null;

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("id", sub.getId());
        res.put("exam_id", sub.getExamId());
        res.put("score", sub.getScore());
        res.put("is_evaluated", sub.getIsEvaluated());
        res.put("status_eval", sub.getStatus());
        res.put("submitted_at", sub.getSubmittedAt());
        res.put("attempt_number", sub.getAttemptNumber());

        externalParticipantRepo.findById(sub.getParticipantId()).ifPresent(p -> {
            res.put("name", p.getName());
            res.put("email", p.getEmail());
        });

        externalExamRepo.findById(sub.getExamId()).ifPresent(e -> {
            res.put("title", e.getTitle());
            res.put("total_marks", e.getTotalMarks());
            res.put("pass_percentage", e.getPassPercentage());
            res.put("exam_date", e.getExamDate());
        });

        List<ExternalSubmissionAnswer> answers = externalSubmissionAnswerRepo.findBySubmissionId(sub.getId());
        List<Map<String, Object>> answerList = new ArrayList<>();
        for (ExternalSubmissionAnswer a : answers) {
            Map<String, Object> aMap = new LinkedHashMap<>();
            aMap.put("id", a.getId());
            aMap.put("question_id", a.getQuestionId());
            aMap.put("marks_obtained", a.getMarksObtained());
            aMap.put("is_correct", a.getIsCorrect());
            aMap.put("answer_text", a.getAnswerText());
            aMap.put("selected_option_id", a.getSelectedOptionId());

            externalQuestionRepo.findById(a.getQuestionId()).ifPresent(q -> {
                aMap.put("question_text", q.getQuestionText());
                aMap.put("question_type", q.getQuestionType());
                aMap.put("question_marks", q.getMarks());
                aMap.put("is_section_title", q.getIsSectionTitle());

                String expectedAnswer = q.getCorrectAnswer();
                if ((expectedAnswer == null || expectedAnswer.isBlank()) && q.getQuestionText() != null) {
                    List<TemplateQuestion> tqs = templateQuestionRepo.findAll().stream()
                        .filter(tq -> tq.getQuestionText() != null && tq.getQuestionText().equalsIgnoreCase(q.getQuestionText()) && tq.getCorrectAnswer() != null)
                        .collect(Collectors.toList());
                    if (!tqs.isEmpty()) {
                        expectedAnswer = tqs.get(0).getCorrectAnswer().trim();
                        q.setCorrectAnswer(expectedAnswer);
                        externalQuestionRepo.save(q);
                    }
                }
                aMap.put("correct_answer", expectedAnswer);

                String qType = q.getQuestionType() != null ? q.getQuestionType().toLowerCase() : "";
                if ("fillups".equals(qType) || "fill_in_the_blanks".equals(qType) || "fill".equals(qType)) {
                    String ansText = a.getAnswerText() != null ? a.getAnswerText().trim() : "";
                    String expText = expectedAnswer != null ? expectedAnswer.trim() : "";
                    boolean isCorrect = !expText.isEmpty() && expText.equalsIgnoreCase(ansText);
                    aMap.put("is_correct", isCorrect ? 1 : 0);
                    BigDecimal marks = isCorrect ? new BigDecimal(q.getMarks() != null ? q.getMarks() : 1) : BigDecimal.ZERO;
                    aMap.put("marks_obtained", marks);
                }

                List<ExternalOption> options = externalOptionRepo.findByQuestionId(q.getId());
                List<Map<String, Object>> oList = new ArrayList<>();
                for (ExternalOption o : options) {
                    Map<String, Object> oMap = new LinkedHashMap<>();
                    oMap.put("id", o.getId());
                    oMap.put("option_text", o.getOptionText());
                    oMap.put("is_correct", o.getIsCorrect());
                    oList.add(oMap);
                    
                    // If this is the selected option for MCQ, set answer_text if currently empty
                    if ("mcq".equalsIgnoreCase(q.getQuestionType()) && 
                        a.getSelectedOptionId() != null && 
                        a.getSelectedOptionId().equals(o.getId())) {
                        aMap.put("answer_text", o.getOptionText());
                    }
                }
                aMap.put("options", oList);
            });
            answerList.add(aMap);
        }
        res.put("answers", answerList);
        return res;
    }

    @Transactional
    public boolean evaluateExternalSubmission(Long submissionId, List<Map<String, Object>> evaluations) {
        ExternalExamSubmission submission = externalSubmissionRepo.findById(submissionId).orElse(null);
        if (submission == null) return false;

        BigDecimal totalScore = BigDecimal.ZERO;
        List<ExternalSubmissionAnswer> existingAnswers = externalSubmissionAnswerRepo.findBySubmissionId(submissionId);
        Map<Long, ExternalSubmissionAnswer> answerById = existingAnswers.stream()
            .collect(Collectors.toMap(ExternalSubmissionAnswer::getId, a -> a));

        if (evaluations != null) {
            for (Map<String, Object> evaluation : evaluations) {
                Object answerIdValue = evaluation.get("answer_id");
                if (answerIdValue == null) {
                    answerIdValue = evaluation.get("id");
                }
                if (answerIdValue == null) {
                    throw new IllegalArgumentException("Answer ID is required for evaluation");
                }

                Long answerId = Long.valueOf(answerIdValue.toString());
                ExternalSubmissionAnswer answer = answerById.get(answerId);
                if (answer == null) {
                    throw new IllegalArgumentException("Invalid answer reference in evaluation");
                }

                ExternalQuestion question = externalQuestionRepo.findById(answer.getQuestionId()).orElse(null);
                String qType = question != null && question.getQuestionType() != null ? question.getQuestionType().toLowerCase() : "";

                // If section break, marks are 0
                if (question != null && (Boolean.TRUE.equals(question.getIsSectionTitle()) || "section_break".equals(qType) || "section_header".equals(qType) || "section".equals(qType))) {
                    answer.setMarksObtained(BigDecimal.ZERO);
                    answer.setIsCorrect(null);
                    externalSubmissionAnswerRepo.save(answer);
                    continue;
                }

                BigDecimal marks = BigDecimal.ZERO;

                // If MCQ or Fillups, enforce auto-graded marks
                if ("mcq".equals(qType)) {
                    Optional<ExternalOption> correctOpt = externalOptionRepo.findByQuestionIdAndIsCorrect(question.getId(), 1);
                    boolean isCorrect = correctOpt.map(o -> o.getId().equals(answer.getSelectedOptionId())).orElse(false);
                    marks = isCorrect && question.getMarks() != null ? new BigDecimal(question.getMarks()) : BigDecimal.ZERO;
                    answer.setIsCorrect(isCorrect ? 1 : 0);
                } else if ("fillups".equals(qType) || "fill_in_the_blanks".equals(qType) || "fill".equals(qType)) {
                    String expText = question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";
                    String ansText = answer.getAnswerText() != null ? answer.getAnswerText().trim() : "";
                    boolean isCorrect = !expText.isEmpty() && expText.equalsIgnoreCase(ansText);
                    marks = isCorrect && question.getMarks() != null ? new BigDecimal(question.getMarks()) : BigDecimal.ZERO;
                    answer.setIsCorrect(isCorrect ? 1 : 0);
                } else {
                    // Descriptive / Either_Or / Text: staff intervention mark
                    BigDecimal maxMarks = question != null && question.getMarks() != null
                        ? BigDecimal.valueOf(question.getMarks())
                        : BigDecimal.ZERO;

                    Object marksValue = evaluation.get("marks");
                    if (marksValue == null) {
                        marksValue = evaluation.get("marks_obtained");
                    }
                    if (marksValue != null && !marksValue.toString().isBlank()) {
                        marks = new BigDecimal(marksValue.toString());
                    }

                    if (marks.compareTo(BigDecimal.ZERO) < 0) marks = BigDecimal.ZERO;
                    if (marks.compareTo(maxMarks) > 0) marks = maxMarks;

                    Integer isCorrect = null;
                    Object isCorrectValue = evaluation.get("is_correct");
                    if (isCorrectValue != null && !isCorrectValue.toString().isBlank()) {
                        isCorrect = Integer.valueOf(isCorrectValue.toString());
                    }
                    answer.setIsCorrect(isCorrect != null ? isCorrect : (marks.compareTo(BigDecimal.ZERO) > 0 ? 1 : 0));
                }

                answer.setMarksObtained(marks);
                externalSubmissionAnswerRepo.save(answer);
                totalScore = totalScore.add(marks);
            }
        }

        submission.setScore(totalScore);
        submission.setIsEvaluated(1);
        submission.setStatus("evaluated");
        externalSubmissionRepo.save(submission);
        return true;
    }

    @Transactional
    public boolean deleteQuestionBank(Long id) {
        QuestionTemplate template = templateRepo.findById(id).orElse(null);
        if (template == null) return false;

        List<TemplateQuestion> questions = templateQuestionRepo.findByTemplateId(id);
        for (TemplateQuestion q : questions) {
            templateOptionRepo.deleteByQuestionId(q.getId());
        }
        templateQuestionRepo.deleteByTemplateId(id);
        templateRepo.deleteById(id);
        return true;
    }

    @Transactional
    public Map<String, Object> submitExternalExam(Map<String, Object> data) {
        Object examIdValue = data.get("exam_id");
        if (examIdValue == null) {
            throw new IllegalArgumentException("Exam ID is required");
        }

        Object participantIdValue = data.get("participant_id");
        if (participantIdValue == null) {
            participantIdValue = data.get("student_id");
        }
        if (participantIdValue == null) {
            throw new IllegalArgumentException("Participant ID is required for external exam submission");
        }

        Long examId = Long.valueOf(examIdValue.toString());
        Long participantId = Long.valueOf(participantIdValue.toString());
        List<Map<String, Object>> answers = (List<Map<String, Object>>) data.get("answers");

        if (externalSubmissionRepo.findTopByExamIdAndParticipantIdOrderByAttemptNumberDesc(examId, participantId).isPresent()) {
            throw new IllegalArgumentException("You already attempted this assessment. Please wait for results.");
        }

        ExternalExamSubmission submission = ExternalExamSubmission.builder()
            .examId(examId)
            .participantId(participantId)
            .submittedAt(LocalDateTime.now())
            .score(BigDecimal.ZERO)
            .isEvaluated(0)
            .status("submitted")
            .attemptNumber(1)
            .build();
        ExternalExamSubmission savedSub = externalSubmissionRepo.save(submission);

        BigDecimal totalScore = BigDecimal.ZERO;
        int autoEvaluated = 1;

        if (answers != null) {
            for (Map<String, Object> ans : answers) {
                Long questionId = Long.valueOf(ans.get("question_id").toString());
                ExternalQuestion question = externalQuestionRepo.findById(questionId).orElse(null);

                ExternalSubmissionAnswer answer = new ExternalSubmissionAnswer();
                answer.setSubmissionId(savedSub.getId());
                answer.setQuestionId(questionId);

                if (ans.containsKey("selected_option_id") && ans.get("selected_option_id") != null) {
                    Long selectedOptionId = Long.valueOf(ans.get("selected_option_id").toString());
                    answer.setSelectedOptionId(selectedOptionId);

                    // Auto-grade MCQ
                    Optional<ExternalOption> correctOpt = externalOptionRepo.findByQuestionIdAndIsCorrect(questionId, 1);
                    boolean isCorrect = correctOpt.map(o -> o.getId().equals(selectedOptionId)).orElse(false);
                    answer.setIsCorrect(isCorrect ? 1 : 0);
                    answer.setMarksObtained(isCorrect && question != null ?
                        new BigDecimal(question.getMarks()) : BigDecimal.ZERO);
                    if (isCorrect && question != null) totalScore = totalScore.add(new BigDecimal(question.getMarks()));
                } else if (ans.containsKey("answer_text") || ans.containsKey("either_or_selected")) {
                    String ansText = ans.get("answer_text") != null ? ans.get("answer_text").toString() : "";
                    answer.setAnswerText(ansText);

                    String qType = question != null && question.getQuestionType() != null ? question.getQuestionType().toLowerCase() : "";

                    if ("fillups".equals(qType) || "fill_in_the_blanks".equals(qType) || "fill".equals(qType)) {
                        String expectedAnswer = question != null && question.getCorrectAnswer() != null ? question.getCorrectAnswer().trim() : "";
                        if (expectedAnswer.isEmpty() && question != null) {
                            List<TemplateQuestion> tqs = templateQuestionRepo.findAll().stream()
                                .filter(tq -> tq.getQuestionText() != null && tq.getQuestionText().equalsIgnoreCase(question.getQuestionText()) && tq.getCorrectAnswer() != null)
                                .collect(Collectors.toList());
                            if (!tqs.isEmpty()) {
                                expectedAnswer = tqs.get(0).getCorrectAnswer().trim();
                                question.setCorrectAnswer(expectedAnswer);
                                externalQuestionRepo.save(question);
                            }
                        }

                        boolean isCorrect = !expectedAnswer.isEmpty() && expectedAnswer.equalsIgnoreCase(ansText.trim());
                        answer.setIsCorrect(isCorrect ? 1 : 0);
                        BigDecimal marks = isCorrect && question != null ? new BigDecimal(question.getMarks()) : BigDecimal.ZERO;
                        answer.setMarksObtained(marks);
                        totalScore = totalScore.add(marks);
                    } else if ("descriptive".equals(qType) || "text".equals(qType) || "either_or".equals(qType)) {
                        autoEvaluated = 0; // Only Descriptive and Either Or Questions are verified by staff
                        answer.setMarksObtained(BigDecimal.ZERO);
                        answer.setIsCorrect(0);
                    } else {
                        if (question != null && question.getCorrectAnswer() != null && !question.getCorrectAnswer().isBlank()) {
                            boolean isCorrect = question.getCorrectAnswer().trim().equalsIgnoreCase(ansText.trim());
                            answer.setIsCorrect(isCorrect ? 1 : 0);
                            BigDecimal marks = isCorrect ? new BigDecimal(question.getMarks()) : BigDecimal.ZERO;
                            answer.setMarksObtained(marks);
                            totalScore = totalScore.add(marks);
                        } else {
                            autoEvaluated = 0;
                        }
                    }
                }

                externalSubmissionAnswerRepo.save(answer);
            }
        }

        savedSub.setScore(totalScore);
        savedSub.setIsEvaluated(autoEvaluated);
        if (autoEvaluated == 1) savedSub.setStatus("evaluated");
        externalSubmissionRepo.save(savedSub);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("submission_id", savedSub.getId());
        result.put("score", totalScore);
        return result;
    }

    public String getInstituteName() {
        return settingRepo.findAll().stream().findFirst().map(InstituteSetting::getInstituteName).orElse("Institute");
    }

    @Transactional
    public void toggleExternalResults(Long examId, int status) {
        externalExamRepo.findById(examId).ifPresent(exam -> {
            exam.setResultsPublished(status);
            externalExamRepo.save(exam);
        });
    }

    @Transactional
    public void fixExistingExams() {
        // 1. Fix Database Schema (AUTO_INCREMENT)
        String[] tables = {
            "exams", "exam_questions", "exam_options", "exam_assignments", 
            "exam_submissions", "exam_submission_answers",
            "external_exams", "external_exam_questions", "external_exam_options", 
            "external_participants", "external_exam_submissions", "external_submission_answers"
        };
        for (String table : tables) {
            try {
                entityManager.createNativeQuery("ALTER TABLE " + table + " MODIFY id BIGINT AUTO_INCREMENT").executeUpdate();
            } catch (Exception e) {
                // Ignore if not applicable or already set
                System.err.println("Schema fix warning (" + table + "): " + e.getMessage());
            }
        }

        // 2. Fix Data (Attribution & Cleanup)
        List<Exam> exams = examRepo.findAll();
        for (Exam e : exams) {
            boolean changed = false;
            if (e.getCreatedBy() == null) {
                // logic preserved from previous fix
                if (e.getTitle() != null && e.getTitle().toLowerCase().contains("web test")) {
                    e.setCreatedBy(1L);
                    changed = true;
                } else {
                    userRepo.findAll().stream()
                        .filter(u -> u.getRole() != null && "Staff".equalsIgnoreCase(u.getRole().getRoleName()))
                        .findFirst()
                        .ifPresent(u -> {
                            e.setCreatedBy(u.getId());
                        });
                    changed = true;
                }
            }
            if (e.getDescription() != null) {
                e.setDescription(null);
                changed = true;
            }
            if (e.getCreatedAt() == null) {
                e.setCreatedAt(LocalDateTime.now());
                changed = true;
            }
            if (changed) examRepo.save(e);
        }

        List<ExternalExam> externalExams = externalExamRepo.findAll();
        for (ExternalExam ee : externalExams) {
            boolean changed = false;
            if (ee.getCreatedAt() == null) {
                ee.setCreatedAt(LocalDateTime.now());
                changed = true;
            }
            if (changed) externalExamRepo.save(ee);
        }
    }

    // ============ OFFLINE EXAM ENTRIES ============

    public List<Map<String, Object>> getExamEntries(Long courseId) {
        List<ExamEntry> entries;
        if (courseId != null) {
            entries = examEntryRepo.findByCourseId(courseId);
        } else {
            entries = examEntryRepo.findAll();
        }
        List<Map<String, Object>> result = new ArrayList<>();
        for (ExamEntry entry : entries) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", entry.getId());
            map.put("title", entry.getTitle());
            map.put("exam_date", entry.getExamDate());
            map.put("total_marks", entry.getTotalMarks());
            map.put("course_id", entry.getCourseId());
            map.put("subject", entry.getSubject());
            map.put("question_count", entry.getQuestionCount());
            map.put("question_marks", entry.getQuestionMarks());
            map.put("batches", entry.getBatches());
            map.put("created_at", entry.getCreatedAt());

            if (entry.getCourseId() != null) {
                courseRepo.findById(entry.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
            }

            int studentCount = examEntryStudentResultRepo.findByExamEntryId(entry.getId()).size();
            map.put("student_count", studentCount);

            result.add(map);
        }
        return result;
    }

    public Map<String, Object> getExamEntryDetails(Long entryId) {
        return examEntryRepo.findById(entryId).map(entry -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", entry.getId());
            map.put("title", entry.getTitle());
            map.put("exam_date", entry.getExamDate());
            map.put("total_marks", entry.getTotalMarks());
            map.put("course_id", entry.getCourseId());
            map.put("subject", entry.getSubject());
            map.put("question_count", entry.getQuestionCount());
            map.put("question_marks", entry.getQuestionMarks());
            map.put("batches", entry.getBatches());
            map.put("created_at", entry.getCreatedAt());

            if (entry.getCourseId() != null) {
                courseRepo.findById(entry.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
            }

            List<ExamEntryStudentResult> results = examEntryStudentResultRepo.findByExamEntryId(entry.getId());
            List<Map<String, Object>> resultList = new ArrayList<>();
            for (ExamEntryStudentResult res : results) {
                Map<String, Object> rMap = new LinkedHashMap<>();
                rMap.put("id", res.getId());
                rMap.put("student_id", res.getStudentId());
                rMap.put("marks_obtained", res.getMarksObtained());
                rMap.put("total_marks_obtained", res.getTotalMarksObtained());
                rMap.put("remarks", res.getRemarks());

                studentRepo.findById(res.getStudentId()).ifPresent(s -> {
                    rMap.put("student_name", s.getName());
                    rMap.put("reg_number", s.getRegNumber());
                });
                resultList.add(rMap);
            }
            map.put("results", resultList);
            return map;
        }).orElse(null);
    }

    @Transactional
    public Long saveExamEntry(Map<String, Object> data) {
        Long id = data.containsKey("id") && data.get("id") != null ?
            Long.valueOf(data.get("id").toString()) : null;

        ExamEntry entry;
        if (id != null) {
            entry = examEntryRepo.findById(id).orElse(new ExamEntry());
        } else {
            entry = new ExamEntry();
            entry.setCreatedAt(LocalDateTime.now());
        }

        entry.setTitle((String) data.get("title"));
        if (data.containsKey("exam_date") && data.get("exam_date") != null) {
            String dateStr = (String) data.get("exam_date");
            if (dateStr.length() == 16) {
                dateStr = dateStr + ":00"; // Append seconds if needed for ISO format
            }
            entry.setExamDate(LocalDateTime.parse(dateStr));
        }
        entry.setTotalMarks(data.containsKey("total_marks") ? Integer.valueOf(data.get("total_marks").toString()) : 0);
        if (data.containsKey("course_id") && data.get("course_id") != null) {
            entry.setCourseId(Long.valueOf(data.get("course_id").toString()));
        }
        entry.setSubject((String) data.get("subject"));
        entry.setQuestionCount(data.containsKey("question_count") ? Integer.valueOf(data.get("question_count").toString()) : 0);
        entry.setQuestionMarks(String.valueOf(data.get("question_marks")));
        entry.setBatches(String.valueOf(data.get("batches")));
        entry.setUpdatedAt(LocalDateTime.now());

        ExamEntry saved = examEntryRepo.save(savedEntityWithBranch(entry));

        // Save Student Results
        if (data.containsKey("results") && data.get("results") instanceof List) {
            // Delete old results first if updating
            if (id != null) {
                examEntryStudentResultRepo.deleteByExamEntryId(saved.getId());
            }

            List<Map<String, Object>> results = (List<Map<String, Object>>) data.get("results");
            for (Map<String, Object> resData : results) {
                ExamEntryStudentResult res = new ExamEntryStudentResult();
                res.setExamEntryId(saved.getId());
                res.setStudentId(Long.valueOf(resData.get("student_id").toString()));
                res.setMarksObtained(String.valueOf(resData.get("marks_obtained")));
                res.setTotalMarksObtained(new BigDecimal(resData.get("total_marks_obtained").toString()));
                res.setRemarks((String) resData.get("remarks"));
                examEntryStudentResultRepo.save(savedResultWithBranch(res));
            }
        }

        return saved.getId();
    }

    private ExamEntry savedEntityWithBranch(ExamEntry entry) {
        return entry;
    }

    private ExamEntryStudentResult savedResultWithBranch(ExamEntryStudentResult res) {
        return res;
    }

    @Transactional
    public void deleteExamEntry(Long id) {
        examEntryStudentResultRepo.deleteByExamEntryId(id);
        examEntryRepo.deleteById(id);
    }
}
