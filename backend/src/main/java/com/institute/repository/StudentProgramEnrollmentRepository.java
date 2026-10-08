package com.institute.repository;

import com.institute.model.StudentProgramEnrollment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentProgramEnrollmentRepository extends JpaRepository<StudentProgramEnrollment, Long> {
    List<StudentProgramEnrollment> findByStudentId(Long studentId);
    List<StudentProgramEnrollment> findByProgramId(Long programId);
    Optional<StudentProgramEnrollment> findByStudentIdAndProgramId(Long studentId, Long programId);
}
