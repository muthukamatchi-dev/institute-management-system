package com.institute.repository;

import com.institute.model.StudentModuleProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentModuleProgressRepository extends JpaRepository<StudentModuleProgress, Long> {
    List<StudentModuleProgress> findByProgramEnrollmentIdOrderByProgramModuleIdAsc(Long programEnrollmentId);
    List<StudentModuleProgress> findByStudentId(Long studentId);
    Optional<StudentModuleProgress> findByProgramEnrollmentIdAndProgramModuleId(Long programEnrollmentId, Long programModuleId);
    List<StudentModuleProgress> findByStudentIdAndCourseId(Long studentId, Long courseId);
}
