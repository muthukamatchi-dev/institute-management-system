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

    @org.springframework.data.jpa.repository.Query("SELECT p FROM ExternalParticipant p WHERE p.examId = :examId AND (LOWER(TRIM(p.email)) = LOWER(TRIM(:identifier)) OR LOWER(TRIM(p.name)) = LOWER(TRIM(:identifier))) AND TRIM(p.password) = TRIM(:password)")
    Optional<ExternalParticipant> findByExamIdAndIdentifierAndPassword(@org.springframework.data.repository.query.Param("examId") Long examId, @org.springframework.data.repository.query.Param("identifier") String identifier, @org.springframework.data.repository.query.Param("password") String password);

    void deleteByExamId(Long examId);
}
