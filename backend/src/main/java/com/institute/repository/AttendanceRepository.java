package com.institute.repository;

import com.institute.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByAttendanceDate(LocalDate date);
    List<Attendance> findByBatchIdAndAttendanceDate(Long batchId, LocalDate date);
    List<Attendance> findByScheduledClassId(Long scheduledClassId);
    List<Attendance> findByStudentIdAndAttendanceDateAndBatchId(Long studentId, LocalDate date, Long batchId);
    List<Attendance> findByStudentIdAndAttendanceDate(Long studentId, LocalDate date);
    List<Attendance> findByStudentIdAndScheduledClassId(Long studentId, Long scheduledClassId);
    List<Attendance> findByStudentIdOrderByAttendanceDateDesc(Long studentId);
    void deleteByStudentId(Long studentId);
    long countByStudentIdAndStatus(Long studentId, String status);
    long countByStaffId(Long staffId);

    @Query(value = "SELECT student_id, COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present " +
                   "FROM attendance WHERE attendance_date BETWEEN :start AND :end " +
                   "AND (tenant_id = :tenantId OR 'SYSTEM' = :tenantId) " +
                   "GROUP BY student_id", nativeQuery = true)
    List<Object[]> getAttendanceStats(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("tenantId") String tenantId);

    @Query(value = "SELECT batch_id, COUNT(*) as total, SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present " +
                   "FROM attendance WHERE attendance_date BETWEEN :start AND :end " +
                   "AND (tenant_id = :tenantId OR 'SYSTEM' = :tenantId) " +
                   "GROUP BY batch_id", nativeQuery = true)
    List<Object[]> getBatchAttendanceStats(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("tenantId") String tenantId);
}
