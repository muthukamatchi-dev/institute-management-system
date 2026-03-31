package com.institute.repository;

import com.institute.model.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
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
}
