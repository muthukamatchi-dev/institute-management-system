package com.institute.repository;

import com.institute.model.ScheduledClass;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ScheduledClassRepository extends JpaRepository<ScheduledClass, Long> {
    List<ScheduledClass> findByStaffIdAndClassDateOrderByStartTimeAsc(Long staffId, LocalDate date);
    List<ScheduledClass> findByClassDateOrderByStartTimeAsc(LocalDate date);
    void deleteByBatchId(Long batchId);
    void deleteByStudentId(Long studentId);

    @Modifying
    @Transactional
    @Query(value = "UPDATE scheduled_classes SET tenant_id = :tenantId WHERE tenant_id = 'default' OR tenant_id = 'DEFAULT'", nativeQuery = true)
    void fixLegacyTenants(@Param("tenantId") String tenantId);
}
