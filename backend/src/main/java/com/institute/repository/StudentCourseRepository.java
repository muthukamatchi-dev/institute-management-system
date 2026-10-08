package com.institute.repository;

import com.institute.model.StudentCourse;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentCourseRepository extends JpaRepository<StudentCourse, Long> {

    List<StudentCourse> findByStudentId(Long studentId);

    Optional<StudentCourse> findByStudentIdAndCourseId(Long studentId, Long courseId);

    List<StudentCourse> findByCourseId(Long courseId);

    List<StudentCourse> findByBatchId(Long batchId);

    void deleteByStudentId(Long studentId);

    void deleteByStudentIdAndCourseId(Long studentId, Long courseId);
}
