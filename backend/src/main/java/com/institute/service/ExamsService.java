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

    @PersistenceContext
    private EntityManager entityManager;

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
                        UserRepository userRepo, StaffRepository staffRepo) {
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
    }

    // ============ INTERNAL EXAMS (Exams_model.php lines 7-200) ============

    public List<Map<String, Object>> getInternalExams(Long examId, Map<String, String> filters, Map<String, Object> details) {
        String role = details.getOrDefault("role", "").toString().toLowerCase();
        String type = details.getOrDefault("type", "").toString().toLowerCase();
        Long currentUserId = Long.valueOf(details.get("id").toString());
        
        List<Exam> exams;
        if (examId != null) {
            exams = examRepo.findById(examId).map(List::of).orElse(List.of());
        } else {
            // Staff only see their own created exams. Admins see all.
            if ("staff".equals(type) || "staff".equals(role)) {
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

        List<Map<String, Object>> result = new ArrayList<>();
        for (Exam e : exams) {
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
                      map.put("has_submitted", sub.isPresent());
                      map.put("has_attempted", sub.isPresent());
                      map.put("submission_status", sub.map(ExamSubmission::getStatus).orElse(null));
                      map.put("can_take", !"evaluated".equalsIgnoreCase(
                          sub.map(ExamSubmission::getStatus).orElse("")));

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

        // Determine attempt number
        Optional<ExamSubmission> lastSub = examSubmissionRepo
            .findTopByExamIdAndStudentIdOrderByAttemptNumberDesc(examId, studentId);
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
                } else if (ans.containsKey("answer_text")) {
                    answer.setAnswerText((String) ans.get("answer_text"));
                    autoEvaluated = 0; // Descriptive - needs manual eval
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
                  aMap.put("remarks", "");
                  
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
                // Restrict marks to original allocated marks
                BigDecimal maxMarks = examQuestionRepo.findById(answer.getQuestionId())
                    .map(q -> new BigDecimal(q.getMarks().toString()))
                    .orElse(BigDecimal.valueOf(999999)); // Default fallback
                
                if (marks.compareTo(maxMarks) > 0) {
                    marks = maxMarks;
                }
                
                answer.setMarksObtained(marks);
                answer.setIsCorrect(marks.compareTo(BigDecimal.ZERO) > 0 ? 1 : 0);
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

    // ============ EXTERNAL EXAMS (Exams_model.php lines 452-800) ============

    public List<Map<String, Object>> getExternalExams(Long examId, Map<String, String> filters) {
        List<ExternalExam> exams = examId != null ?
            externalExamRepo.findById(examId).map(List::of).orElse(List.of()) :
            externalExamRepo.findAll();

        System.out.println("Processing getExternalExams. filters: " + filters);
        if (filters != null && examId == null) {
            exams = applyExamDateFilters(exams, filters);
            exams = applySearchFilters(exams, filters);
        }
        System.out.println("Computed external exams list size: " + (exams != null ? exams.size() : 0));

        List<Map<String, Object>> result = new ArrayList<>();
        for (ExternalExam e : exams) {
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
            List<Map<String, Object>> qList = new ArrayList<>();
            for (ExternalQuestion q : questions) {
                Map<String, Object> qMap = new LinkedHashMap<>();
                qMap.put("id", q.getId());
                qMap.put("question_type", q.getQuestionType());
                qMap.put("question_text", q.getQuestionText());
                qMap.put("marks", q.getMarks());
                
                List<ExternalOption> options = externalOptionRepo.findByQuestionId(q.getId());
                List<Map<String, Object>> oList = new ArrayList<>();
                for (ExternalOption o : options) {
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
            map.put("participant_count", externalParticipantRepo.findByExamId(e.getId()).size());
            map.put("submission_count", externalSubmissionRepo.findByExamId(e.getId()).size());

            result.add(map);
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
        Optional<ExternalParticipant> pOpt = externalParticipantRepo.findByExamIdAndEmailAndPassword(examId, email, password);
        if (pOpt.isPresent()) {
            ExternalParticipant p = pOpt.get();
            Map<String, Object> result = new LinkedHashMap<>();
            result.put("id", p.getId());
            result.put("name", p.getName());
            result.put("email", p.getEmail());
            result.put("exam_id", p.getExamId());
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

            List<TemplateQuestion> questions = templateQuestionRepo.findByTemplateId(t.getId());
            List<Map<String, Object>> qList = new ArrayList<>();
            for (TemplateQuestion q : questions) {
                Map<String, Object> qMap = new LinkedHashMap<>();
                qMap.put("id", q.getId());
                qMap.put("question_type", q.getQuestionType());
                qMap.put("question_text", q.getQuestionText());
                qMap.put("marks", q.getMarks());
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
                question.setQuestionText((String) qData.get("question_text"));
                question.setMarks(qData.containsKey("marks") ? Integer.valueOf(qData.get("marks").toString()) : 1);
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

            // Scheduled Date Filters
            if (fExamDate != null && (itemDate == null || !itemDate.equals(fExamDate))) return false;
            if (fDateFrom != null && (itemDate == null || itemDate.isBefore(fDateFrom))) return false;
            if (fDateTo != null && (itemDate == null || itemDate.isAfter(fDateTo))) return false;

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
            
            externalParticipantRepo.findById(s.getParticipantId()).ifPresent(p -> {
                m.put("name", p.getName());
                m.put("email", p.getEmail());
            });
            externalExamRepo.findById(s.getExamId()).ifPresent(e -> m.put("title", e.getTitle()));
            
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

        externalParticipantRepo.findById(sub.getParticipantId()).ifPresent(p -> {
            res.put("name", p.getName());
            res.put("email", p.getEmail());
        });

        externalExamRepo.findById(sub.getExamId()).ifPresent(e -> {
            res.put("title", e.getTitle());
            res.put("total_marks", e.getTotalMarks());
            res.put("pass_percentage", e.getPassPercentage());
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
            });
            answerList.add(aMap);
        }
        res.put("answers", answerList);
        return res;
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
        Long examId = Long.valueOf(data.get("exam_id").toString());
        Long participantId = Long.valueOf(data.get("participant_id").toString());
        List<Map<String, Object>> answers = (List<Map<String, Object>>) data.get("answers");

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
                } else if (ans.containsKey("answer_text")) {
                    answer.setAnswerText((String) ans.get("answer_text"));
                    autoEvaluated = 0;
                }

                externalSubmissionAnswerRepo.save(answer);
            }
        }

        savedSub.setScore(totalScore);
        savedSub.setIsEvaluated(autoEvaluated);
        externalSubmissionRepo.save(savedSub);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("submission_id", savedSub.getId());
        result.put("score", totalScore);
        return result;
    }

    public String getInstituteName() {
        return settingRepo.findById(1L).map(InstituteSetting::getInstituteName).orElse("Institute");
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
}
