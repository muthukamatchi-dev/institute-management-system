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
    Optional<Student> findByTokenAndTenantId(String token, String tenantId);
    Optional<Student> findByRegNumber(String regNumber);
    Optional<Student> findByRegNumberAndTenantId(String regNumber, String tenantId);
    Optional<Student> findByRegNumberIgnoreCase(String regNumber);
    Optional<Student> findByRegNumberIgnoreCaseAndTenantIdIgnoreCase(String regNumber, String tenantId);
    Optional<Student> findByRegNumberAndPassword(String regNumber, String password);
    @Query(value = "SELECT s.* FROM students s JOIN student_batches sb ON s.id = sb.student_id WHERE sb.batch_id = :batchId AND s.status = :status", nativeQuery = true)
    List<Student> findByBatchIdAndStatus(@Param("batchId") Long batchId, @Param("status") String status);

    @Query(value = "SELECT s.* FROM students s JOIN student_batches sb ON s.id = sb.student_id WHERE sb.batch_id = :batchId", nativeQuery = true)
    List<Student> findByBatchId(@Param("batchId") Long batchId);

    List<Student> findByCourseId(Long courseId);

    @Query(value = "SELECT COUNT(*) FROM student_batches WHERE batch_id = :batchId", nativeQuery = true)
    long countByBatchId(@Param("batchId") Long batchId);

    long countByCourseId(Long courseId);
    long countByStatus(String status);
    long countByCreatedAtBetween(java.time.LocalDateTime start, java.time.LocalDateTime end);
    List<Student> findByJoiningDate(LocalDate date);

    @Query(value = "SELECT s.* FROM students s WHERE s.instructor = :instructorId OR s.id IN " +
           "(SELECT sb.student_id FROM student_batches sb JOIN batches b ON sb.batch_id = b.id WHERE b.instructor = :instructorId)", nativeQuery = true)
    List<Student> findByInstructor(@Param("instructorId") String instructorId);

    @Query(value = "SELECT DATE_FORMAT(joining_date, '%b') as month, COUNT(*) as count " +
                   "FROM students WHERE joining_date BETWEEN :startDate AND :endDate " +
                   "AND (tenant_id = :tenantId OR 'SYSTEM' = :tenantId) " +
                   "GROUP BY DATE_FORMAT(joining_date, '%Y-%m') " +
                   "ORDER BY joining_date ASC", nativeQuery = true)
    List<Object[]> getMonthlyEnrollmentTrends(@Param("startDate") LocalDate startDate, @Param("endDate") LocalDate endDate, @Param("tenantId") String tenantId);
}
