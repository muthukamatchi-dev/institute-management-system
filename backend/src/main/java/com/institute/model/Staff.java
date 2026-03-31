package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "staff")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
public class Staff {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(length = 100)
    private String email;

    @Column(nullable = false, length = 20)
    private String mobile;

    @Column(length = 255)
    private String qualification;

    @Column(length = 50)
    private String experience;

    @Column(length = 100)
    private String designation;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Builder.Default
    @Column(length = 20)
    private String status = "active";

    @Column(precision = 10, scale = 2)
    private BigDecimal salary;

    @Column(name = "staff_id", length = 100)
    private String staffId;

    @Column(length = 255)
    private String token;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "branch_id")
    private Long branchId;
}
