package com.institute.repository;

import com.institute.model.Receipt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReceiptRepository extends JpaRepository<Receipt, Long> {
    List<Receipt> findByStudentIdOrderByPaymentDateDesc(Long studentId);
    Optional<Receipt> findByReceiptNo(String receiptNo);
    List<Receipt> findAllByOrderByPaymentDateDesc();
    List<Receipt> findByPaymentDate(LocalDate date);
    void deleteByStudentId(Long studentId);

    @Query("SELECT SUM(r.amountPaid) FROM Receipt r JOIN Student s ON r.studentId = s.id WHERE s.courseId = :courseId")
    BigDecimal sumAmountByCourse(@Param("courseId") Long courseId);

    @Query("SELECT SUM(r.amountPaid) FROM Receipt r JOIN Student s ON r.studentId = s.id WHERE s.courseId = :courseId AND r.paymentDate BETWEEN :start AND :end")
    BigDecimal sumAmountByCourseAndDateBetween(@Param("courseId") Long courseId, @Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT COALESCE(SUM(r.amountPaid), 0) FROM Receipt r WHERE r.paymentDate BETWEEN :start AND :end")
    BigDecimal sumAmountPaidBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT DATE_FORMAT(payment_date, '%Y-%m') as month, SUM(amount_paid) as total " +
                   "FROM receipts WHERE payment_date BETWEEN :start AND :end " +
                   "AND (tenant_id = :tenantId OR 'SYSTEM' = :tenantId) " +
                   "GROUP BY DATE_FORMAT(payment_date, '%Y-%m')", nativeQuery = true)
    List<Object[]> getMonthlyRevenue(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("tenantId") String tenantId);

    @Query(value = "SELECT s.course_id, SUM(r.amount_paid) as total " +
                   "FROM receipts r JOIN students s ON r.student_id = s.id " +
                   "WHERE r.payment_date BETWEEN :start AND :end " +
                   "AND (r.tenant_id = :tenantId OR 'SYSTEM' = :tenantId) " +
                   "GROUP BY s.course_id", nativeQuery = true)
    List<Object[]> getCourseWiseRevenue(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("tenantId") String tenantId);
}
