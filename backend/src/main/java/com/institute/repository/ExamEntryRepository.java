package com.institute.repository;

import com.institute.model.ExamEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamEntryRepository extends JpaRepository<ExamEntry, Long> {
    List<ExamEntry> findByCourseId(Long courseId);
}
