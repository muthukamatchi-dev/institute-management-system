package com.institute.repository;

import com.institute.model.ExternalExamSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalExamSubmissionRepository extends JpaRepository<ExternalExamSubmission, Long> {
    List<ExternalExamSubmission> findByExamId(Long examId);
    List<ExternalExamSubmission> findByParticipantId(Long participantId);
    Optional<ExternalExamSubmission> findTopByExamIdAndParticipantIdOrderByAttemptNumberDesc(Long examId, Long participantId);
}
