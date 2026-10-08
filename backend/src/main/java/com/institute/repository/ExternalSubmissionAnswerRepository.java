package com.institute.repository;

import com.institute.model.ExternalSubmissionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalSubmissionAnswerRepository extends JpaRepository<ExternalSubmissionAnswer, Long> {
    List<ExternalSubmissionAnswer> findBySubmissionId(Long submissionId);
    Optional<ExternalSubmissionAnswer> findBySubmissionIdAndQuestionId(Long submissionId, Long questionId);
    void deleteBySubmissionId(Long submissionId);
}
