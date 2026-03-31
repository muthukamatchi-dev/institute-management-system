package com.institute.repository;

import com.institute.model.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSubmissionRepository extends JpaRepository<ExamSubmission, Long> {
    List<ExamSubmission> findByExamId(Long examId);
    List<ExamSubmission> findByExamIdIn(List<Long> examIds);
    List<ExamSubmission> findByStudentId(Long studentId);
    List<ExamSubmission> findByStudentIdAndStatus(Long studentId, String status);
    List<ExamSubmission> findAllByOrderByStartTimeDesc();
    Optional<ExamSubmission> findTopByExamIdAndStudentIdOrderByAttemptNumberDesc(Long examId, Long studentId);
    void deleteByStudentId(Long studentId);
}
