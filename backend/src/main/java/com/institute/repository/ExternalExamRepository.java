package com.institute.repository;

import com.institute.model.ExternalExam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface ExternalExamRepository extends JpaRepository<ExternalExam, Long> {
    Optional<ExternalExam> findBySlug(String slug);
}
