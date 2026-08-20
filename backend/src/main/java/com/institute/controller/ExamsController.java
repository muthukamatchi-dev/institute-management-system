package com.institute.controller;

import com.institute.dto.ApiResponse;
import com.institute.service.ExamsService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.*;

/**
 * Exams Controller
 * Migrated from: controllers/api/Exams.php (426 lines)
 * All exam endpoints preserved - internal, external, question bank
 */
@RestController
@RequestMapping("/api/exams")
public class ExamsController {

    private final ExamsService examsService;

    public ExamsController(ExamsService examsService) {
        this.examsService = examsService;
    }

    @GetMapping("/internal")
    public ResponseEntity<ApiResponse> getInternalExams(@RequestParam Map<String, String> filters, Authentication auth) {
        Long examId = (filters.containsKey("id") && filters.get("id") != null && !filters.get("id").isBlank()) ? Long.valueOf(filters.get("id")) : null;
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(examsService.getInternalExams(examId, filters, details)));
    }

    @GetMapping("/external")
    public ResponseEntity<ApiResponse> getExternalExams(@RequestParam Map<String, String> filters, Authentication auth) {
        Long examId = (filters.containsKey("id") && filters.get("id") != null && !filters.get("id").isBlank()) ? Long.valueOf(filters.get("id")) : null;
        Map<String, Object> details = auth != null ? (Map<String, Object>) auth.getPrincipal() : null;
        return ResponseEntity.ok(ApiResponse.success(examsService.getExternalExams(examId, filters, details)));
    }

    @PostMapping("/save_internal")
    public ResponseEntity<ApiResponse> saveInternalExam(@RequestBody Map<String, Object> body, Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        body.put("created_by", userId);
        Long id = examsService.saveInternalExam(body);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Exam saved"));
    }

    @PostMapping("/save_external")
    public ResponseEntity<ApiResponse> saveExternalExam(@RequestBody Map<String, Object> body, Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        body.put("created_by", userId);
        Long id = examsService.saveExternalExam(body);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Exam saved"));
    }

    @PostMapping("/delete")
    public ResponseEntity<ApiResponse> deleteExam(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        String type = body.containsKey("type") ? body.get("type").toString() : "internal";
        boolean deleted = false;
        if ("internal".equals(type)) {
            deleted = examsService.deleteInternalExam(id);
        } else if ("external".equals(type)) {
            deleted = examsService.deleteExternalExam(id);
        }
        if (deleted) {
            return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Exam not found or could not be deleted"));
    }

    @PostMapping("/assign")
    public ResponseEntity<ApiResponse> assignExam(@RequestBody Map<String, Object> body) {
        Long examId = Long.valueOf(body.get("exam_id").toString());
        List<?> studentIds = (List<?>) body.get("student_ids");
        List<Long> ids = studentIds.stream().map(s -> Long.valueOf(s.toString())).collect(java.util.stream.Collectors.toList());
        examsService.assignExam(examId, ids);
        return ResponseEntity.ok(ApiResponse.success(null, "Assigned"));
    }

    @PostMapping("/reassign")
    public ResponseEntity<ApiResponse> reassignExam(@RequestBody Map<String, Object> body) {
        Long examId = Long.valueOf(body.get("exam_id").toString());
        Long studentId = Long.valueOf(body.get("student_id").toString());
        examsService.reassignExam(examId, studentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Reassigned"));
    }

    @PostMapping("/unassign")
    public ResponseEntity<ApiResponse> unassignExam(@RequestBody Map<String, Object> body) {
        Long examId = Long.valueOf(body.get("exam_id").toString());
        Long studentId = Long.valueOf(body.get("student_id").toString());
        examsService.unassignExam(examId, studentId);
        return ResponseEntity.ok(ApiResponse.success(null, "Unassigned"));
    }

    @GetMapping("/assigned")
    public ResponseEntity<ApiResponse> getAssignedExams(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        return ResponseEntity.ok(ApiResponse.success(examsService.getAssignedExams(userId)));
    }

    @GetMapping("/results")
    public ResponseEntity<ApiResponse> getResults(Authentication auth) {
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        Long userId = Long.valueOf(details.get("id").toString());
        return ResponseEntity.ok(ApiResponse.success(examsService.getStudentResults(userId)));
    }

    @GetMapping("/submissions")
    public ResponseEntity<ApiResponse> getSubmissions(@RequestParam(required = false) String exam_id, Authentication auth) {
        Long examId = (exam_id != null && !exam_id.isBlank()) ? Long.valueOf(exam_id) : null;
        Map<String, Object> details = (Map<String, Object>) auth.getPrincipal();
        return ResponseEntity.ok(ApiResponse.success(examsService.getSubmissions(examId, details)));
    }

    @GetMapping("/submission_details")
    public ResponseEntity<ApiResponse> getSubmissionDetails(@RequestParam String id, Authentication auth) {
        Map<String, Object> userDetails = (Map<String, Object>) auth.getPrincipal();
        Map<String, Object> details = examsService.getSubmissionDetails(Long.valueOf(id), userDetails);
        if (details != null) {
            return ResponseEntity.ok(ApiResponse.success(details));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Submission not found"));
    }

    @GetMapping("/pending_assignments")
    public ResponseEntity<ApiResponse> getPendingAssignments(@RequestParam String exam_id) {
        return ResponseEntity.ok(ApiResponse.success(examsService.getPendingAssignments(Long.valueOf(exam_id))));
    }

    @PostMapping("/evaluate")
    public ResponseEntity<ApiResponse> evaluateSubmission(@RequestBody Map<String, Object> body) {
        Long submissionId = Long.valueOf(body.get("submission_id").toString());
        List<Map<String, Object>> evaluations = (List<Map<String, Object>>) body.get("evaluations");
        if (examsService.evaluateSubmission(submissionId, evaluations)) {
            return ResponseEntity.ok(ApiResponse.success(null, "Evaluated"));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Evaluation failed"));
    }

    @PostMapping("/submit_internal")
    public ResponseEntity<ApiResponse> submitInternal(@RequestBody Map<String, Object> body) {
        Map<String, Object> result = examsService.submitInternalExam(body);
        return ResponseEntity.ok(ApiResponse.success(result, "Submitted"));
    }

    @PostMapping("/submit_external")
    public ResponseEntity<ApiResponse> submitExternal(@RequestBody Map<String, Object> body) {
        try {
            Map<String, Object> result = examsService.submitExternalExam(body);
            return ResponseEntity.ok(ApiResponse.success(result, "Submitted"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/save_performance")
    public ResponseEntity<ApiResponse> savePerformance(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.success(null, "Saved"));
    }

    // Question Bank
    @GetMapping("/question_bank")
    public ResponseEntity<ApiResponse> getQuestionBank(@RequestParam(required = false) String course_id) {
        Long courseId = course_id != null ? Long.valueOf(course_id) : null;
        return ResponseEntity.ok(ApiResponse.success(examsService.getQuestionBank(courseId)));
    }

    @PostMapping("/save_question_bank")
    public ResponseEntity<ApiResponse> saveQuestionBank(@RequestBody Map<String, Object> body) {
        Long id = examsService.saveQuestionBank(body);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Saved"));
    }

    @PostMapping("/delete_question_bank")
    public ResponseEntity<ApiResponse> deleteQuestionBank(@RequestBody Map<String, Object> body) {
        examsService.deleteQuestionBank(Long.valueOf(body.get("id").toString()));
        return ResponseEntity.ok(ApiResponse.success(null, "Deleted"));
    }

    // External Exam
    @PostMapping("/save_participant")
    public ResponseEntity<ApiResponse> saveParticipant(@RequestBody Map<String, Object> body) {
        try {
            Long id = examsService.saveExternalParticipant(body);
            return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Saved"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/external_participants")
    public ResponseEntity<ApiResponse> getExternalParticipants(@RequestParam String exam_id) {
        return ResponseEntity.ok(ApiResponse.success(examsService.getExternalParticipants(Long.valueOf(exam_id))));
    }

    @PostMapping("/bulk_save_participants")
    public ResponseEntity<ApiResponse> bulkSaveParticipants(@RequestBody Map<String, Object> body) {
        try {
            Long examId = Long.valueOf(body.get("exam_id").toString());
            List<Map<String, Object>> participants = (List<Map<String, Object>>) body.get("participants");
            int saved = examsService.bulkSaveExternalParticipants(examId, participants);
            return ResponseEntity.ok(ApiResponse.success(Map.of("saved", saved), "Saved"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @GetMapping("/external_submissions")
    public ResponseEntity<ApiResponse> getExternalSubmissions(@RequestParam(required = false) String exam_id) {
        Long examId = exam_id != null ? Long.valueOf(exam_id) : null;
        return ResponseEntity.ok(ApiResponse.success(examsService.getExternalSubmissions(examId)));
    }

    @GetMapping("/external_submission_details")
    public ResponseEntity<ApiResponse> getExternalSubmissionDetails(@RequestParam String id) {
        Map<String, Object> details = examsService.getExternalSubmissionDetails(Long.valueOf(id));
        if (details != null) {
            return ResponseEntity.ok(ApiResponse.success(details));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Submission not found"));
    }

    @PostMapping("/evaluate_external")
    public ResponseEntity<ApiResponse> evaluateExternal(@RequestBody Map<String, Object> body) {
        try {
            Long submissionId = Long.valueOf(body.get("submission_id").toString());
            List<Map<String, Object>> evaluations = (List<Map<String, Object>>) body.get("evaluations");
            if (examsService.evaluateExternalSubmission(submissionId, evaluations)) {
                return ResponseEntity.ok(ApiResponse.success(null, "Evaluated"));
            }
            return ResponseEntity.badRequest().body(ApiResponse.error("External submission not found"));
        } catch (IllegalArgumentException ex) {
            return ResponseEntity.badRequest().body(ApiResponse.error(ex.getMessage()));
        }
    }

    @PostMapping("/toggle_external_results")
    public ResponseEntity<ApiResponse> toggleExternalResults(@RequestBody Map<String, Object> body) {
        Long examId = Long.valueOf(body.get("exam_id").toString());
        int status = Integer.valueOf(body.get("status").toString());
        examsService.toggleExternalResults(examId, status);
        return ResponseEntity.ok(ApiResponse.success(null, "Results publication status updated"));
    }

    @GetMapping("/institute_name")
    public ResponseEntity<ApiResponse> getInstituteName() {
        return ResponseEntity.ok(ApiResponse.success(Map.of("name", examsService.getInstituteName())));
    }

    @PostMapping("/external_login")
    public ResponseEntity<ApiResponse> externalLogin(@RequestBody Map<String, Object> body) {
        Long examId = Long.valueOf(body.get("exam_id").toString());
        String email = (String) body.get("email");
        String password = (String) body.get("password");
        Map<String, Object> result = examsService.externalLogin(examId, email, password);
        if (result != null) {
            return ResponseEntity.ok(ApiResponse.success(result, "Login successful"));
        }
        return ResponseEntity.status(401).body(ApiResponse.error("Invalid credentials"));
    }

    @PostMapping("/fix-exams")
    public ResponseEntity<ApiResponse> fixExams() {
        examsService.fixExistingExams();
        return ResponseEntity.ok(ApiResponse.success(null, "Exams fixed"));
    }

    // Offline Exam Entries
    @GetMapping("/entries")
    public ResponseEntity<ApiResponse> getExamEntries(@RequestParam(required = false) String course_id) {
        Long courseId = (course_id != null && !course_id.isBlank()) ? Long.valueOf(course_id) : null;
        return ResponseEntity.ok(ApiResponse.success(examsService.getExamEntries(courseId)));
    }

    @GetMapping("/entry_details")
    public ResponseEntity<ApiResponse> getExamEntryDetails(@RequestParam String id) {
        Map<String, Object> details = examsService.getExamEntryDetails(Long.valueOf(id));
        if (details != null) {
            return ResponseEntity.ok(ApiResponse.success(details));
        }
        return ResponseEntity.badRequest().body(ApiResponse.error("Exam entry not found"));
    }

    @PostMapping("/save_entry")
    public ResponseEntity<ApiResponse> saveExamEntry(@RequestBody Map<String, Object> body) {
        Long id = examsService.saveExamEntry(body);
        return ResponseEntity.ok(ApiResponse.success(Map.of("id", id), "Exam entry saved"));
    }

    @PostMapping("/delete_entry")
    public ResponseEntity<ApiResponse> deleteExamEntry(@RequestBody Map<String, Object> body) {
        Long id = Long.valueOf(body.get("id").toString());
        examsService.deleteExamEntry(id);
        return ResponseEntity.ok(ApiResponse.success(null, "Exam entry deleted"));
    }
}
