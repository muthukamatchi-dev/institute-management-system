package com.institute.repository;

import com.institute.model.ExternalSubmissionAnswer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExternalSubmissionAnswerRepository extends JpaRepository<ExternalSubmissionAnswer, Long> {
    List<ExternalSubmissionAnswer> findBySubmissionId(Long submissionId);
    void deleteBySubmissionId(Long submissionId);
}
