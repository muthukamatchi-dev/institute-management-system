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
    void deleteByStudentId(Long studentId);

    @Query("SELECT COALESCE(SUM(r.amountPaid), 0) FROM Receipt r WHERE r.paymentDate BETWEEN :start AND :end")
    BigDecimal sumAmountPaidBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);
}
