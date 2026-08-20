package com.institute.repository;

import com.institute.model.StaffAttendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StaffAttendanceRepository extends JpaRepository<StaffAttendance, Long> {
    Optional<StaffAttendance> findByStaffIdAndAttendanceDate(Long staffId, LocalDate attendanceDate);
    List<StaffAttendance> findByAttendanceDate(LocalDate date);
}
