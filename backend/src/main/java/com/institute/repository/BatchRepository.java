package com.institute.repository;

import com.institute.model.Batch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface BatchRepository extends JpaRepository<Batch, Long> {
    List<Batch> findByCourseId(Long courseId);
    List<Batch> findByInstructor(String instructor);
    Optional<Batch> findByBatchNameAndTenantId(String batchName, String tenantId);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
}
