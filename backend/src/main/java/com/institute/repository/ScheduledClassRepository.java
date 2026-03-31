package com.institute.repository;

import com.institute.model.ScheduledClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduledClassRepository extends JpaRepository<ScheduledClass, Long> {
    List<ScheduledClass> findByStaffIdAndClassDateOrderByStartTimeAsc(Long staffId, LocalDate date);
    List<ScheduledClass> findByClassDateOrderByStartTimeAsc(LocalDate date);
    void deleteByBatchId(Long batchId);
    void deleteByStudentId(Long studentId);
}
