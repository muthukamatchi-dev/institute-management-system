package com.institute.repository;

import com.institute.model.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Long> {
    List<Student> findAllByOrderByRegNumberAsc();
    Optional<Student> findByToken(String token);
    Optional<Student> findByRegNumber(String regNumber);
    Optional<Student> findByRegNumberAndPassword(String regNumber, String password);
    List<Student> findByBatchIdAndStatus(Long batchId, String status);
    List<Student> findByBatchId(Long batchId);
    List<Student> findByCourseId(Long courseId);
    long countByStatus(String status);

    @Query("SELECT s FROM Student s WHERE s.instructor = :instructorId OR s.batchId IN " +
           "(SELECT b.id FROM Batch b WHERE b.instructor = :instructorId)")
    List<Student> findByInstructor(@Param("instructorId") String instructorId);

    @Query(value = "SELECT DATE_FORMAT(joining_date, '%b') as month, COUNT(*) as count " +
                   "FROM students WHERE joining_date >= :startDate " +
                   "GROUP BY DATE_FORMAT(joining_date, '%Y-%m') " +
                   "ORDER BY joining_date ASC", nativeQuery = true)
    List<Object[]> getMonthlyEnrollmentTrends(@Param("startDate") LocalDate startDate);
}
