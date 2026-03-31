package com.institute.repository;

import com.institute.model.ExamAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAssignmentRepository extends JpaRepository<ExamAssignment, Long> {
    List<ExamAssignment> findByStudentId(Long studentId);
    List<ExamAssignment> findByExamId(Long examId);
    void deleteByExamId(Long examId);
    void deleteByStudentId(Long studentId);
    Optional<ExamAssignment> findByExamIdAndStudentId(Long examId, Long studentId);
}
