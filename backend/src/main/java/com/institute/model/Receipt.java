package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDate;

@Entity
@Table(name = "receipts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
public class Receipt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "receipt_no", nullable = false, length = 50)
    private String receiptNo;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "fee_id", nullable = false)
    private Long feeId;

    @Column(name = "amount_paid", nullable = false, precision = 10, scale = 2)
    private BigDecimal amountPaid;

    @Builder.Default
    @Column(name = "payment_method", length = 50)
    private String paymentMethod = "Cash";

    @Column(name = "payment_date", nullable = false)
    private LocalDate paymentDate;

    @Column(name = "branch_id")
    private Long branchId;
}
