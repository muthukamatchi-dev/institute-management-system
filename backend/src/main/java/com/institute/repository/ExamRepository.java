package com.institute.repository;

import com.institute.model.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Long> {
    List<Exam> findByIsDeleted(Integer isDeleted);
    List<Exam> findByCreatedBy(Long createdBy);
    long countByCreatedBy(Long createdBy);
}
