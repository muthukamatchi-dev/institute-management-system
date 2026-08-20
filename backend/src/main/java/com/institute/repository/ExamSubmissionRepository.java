package com.institute.repository;

import com.institute.model.ExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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

    @Query(value = "SELECT b.id, b.batch_name, AVG(es.score) as avg_score, " +
            "COUNT(es.id) as total_submissions, " +
            "SUM(CASE WHEN es.status = 'passed' THEN 1 ELSE 0 END) as pass_count " +
            "FROM exam_submissions es " +
            "JOIN students s ON es.student_id = s.id " +
            "JOIN batches b ON s.batch_id = b.id " +
            "WHERE (es.tenant_id = :tenantId OR 'SYSTEM' = :tenantId) " +
            "GROUP BY b.id, b.batch_name", nativeQuery = true)
    List<Object[]> getBatchPerformanceStats(@Param("tenantId") String tenantId);
}
