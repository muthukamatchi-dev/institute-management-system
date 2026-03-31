package com.institute.repository;

import com.institute.model.Fee;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface FeeRepository extends JpaRepository<Fee, Long> {
    List<Fee> findByStudentId(Long studentId);
    void deleteByStudentId(Long studentId);

    @Query("SELECT COALESCE(SUM(f.paidAmount), 0) FROM Fee f")
    BigDecimal sumAllPaidAmounts();
}
