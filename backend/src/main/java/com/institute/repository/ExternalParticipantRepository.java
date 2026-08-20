package com.institute.repository;

import com.institute.model.ExternalParticipant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExternalParticipantRepository extends JpaRepository<ExternalParticipant, Long> {
    List<ExternalParticipant> findByExamId(Long examId);
    Optional<ExternalParticipant> findByExamIdAndEmail(Long examId, String email);
    Optional<ExternalParticipant> findByExamIdAndEmailAndPassword(Long examId, String email, String password);
    void deleteByExamId(Long examId);
}
