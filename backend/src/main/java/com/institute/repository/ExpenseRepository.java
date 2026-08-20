package com.institute.repository;

import com.institute.model.Expense;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    List<Expense> findAllByOrderByExpenseDateDesc();
    List<Expense> findByExpenseDate(LocalDate date);

    @Query("SELECT COALESCE(SUM(e.amount), 0) FROM Expense e WHERE e.expenseDate BETWEEN :start AND :end")
    BigDecimal sumAmountBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query("SELECT e.category as category, SUM(e.amount) as total_amount " +
           "FROM Expense e GROUP BY e.category")
    List<Object[]> getExpenseStatsByCategory();

    @Query("SELECT e.category as category, SUM(e.amount) as total_amount " +
           "FROM Expense e WHERE e.expenseDate BETWEEN :start AND :end GROUP BY e.category")
    List<Object[]> getExpenseStatsByCategoryBetween(@Param("start") LocalDate start, @Param("end") LocalDate end);

    @Query(value = "SELECT DATE_FORMAT(expense_date, '%Y-%m') as month, SUM(amount) as total " +
                   "FROM expenses WHERE expense_date BETWEEN :start AND :end " +
                   "AND (tenant_id = :tenantId OR 'SYSTEM' = :tenantId) " +
                   "GROUP BY DATE_FORMAT(expense_date, '%Y-%m')", nativeQuery = true)
    List<Object[]> getMonthlyExpenses(@Param("start") LocalDate start, @Param("end") LocalDate end, @Param("tenantId") String tenantId);
}
