package com.institute.repository;

import com.institute.model.StudentBatch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentBatchRepository extends JpaRepository<StudentBatch, Long> {
    List<StudentBatch> findByBatchId(Long batchId);
    List<StudentBatch> findByStudentId(Long studentId);
    Optional<StudentBatch> findByStudentIdAndBatchId(Long studentId, Long batchId);
    void deleteByBatchId(Long batchId);
    void deleteByStudentId(Long studentId);
}
