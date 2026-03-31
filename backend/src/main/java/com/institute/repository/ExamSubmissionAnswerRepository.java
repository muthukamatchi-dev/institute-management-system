package com.institute.repository;

import com.institute.model.ExamSubmissionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamSubmissionAnswerRepository extends JpaRepository<ExamSubmissionAnswer, Long> {
    List<ExamSubmissionAnswer> findBySubmissionId(Long submissionId);
    void deleteBySubmissionId(Long submissionId);
}
