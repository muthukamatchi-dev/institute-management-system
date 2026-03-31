package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "fees")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
public class Fee {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "total_amount", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalAmount;

    @Builder.Default
    @Column(name = "paid_amount", precision = 10, scale = 2)
    private BigDecimal paidAmount = BigDecimal.ZERO;

    @Column(name = "balance_amount", precision = 10, scale = 2)
    private BigDecimal balanceAmount;

    @Column(name = "last_payment_date")
    private LocalDate lastPaymentDate;

    @Builder.Default
    @Column(length = 20)
    private String status = "pending";

    @Column(name = "reminder_date")
    private LocalDate reminderDate;

    @Builder.Default
    @Column(name = "is_reminder_enabled")
    private Integer isReminderEnabled = 0;

    @Column(name = "branch_id")
    private Long branchId;
}
