package com.institute.repository;

import com.institute.model.ExamEntryStudentResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamEntryStudentResultRepository extends JpaRepository<ExamEntryStudentResult, Long> {
    List<ExamEntryStudentResult> findByExamEntryId(Long examEntryId);
    void deleteByExamEntryId(Long examEntryId);
}
