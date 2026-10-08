package com.institute.repository;

import com.institute.model.ExamSubmissionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamSubmissionAnswerRepository extends JpaRepository<ExamSubmissionAnswer, Long> {
    List<ExamSubmissionAnswer> findBySubmissionId(Long submissionId);
    Optional<ExamSubmissionAnswer> findBySubmissionIdAndQuestionId(Long submissionId, Long questionId);
    void deleteBySubmissionId(Long submissionId);
}
