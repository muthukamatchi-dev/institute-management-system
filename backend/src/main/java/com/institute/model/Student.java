package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "students")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class Student {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(nullable = false, length = 15)
    private String mobile;

    @Column(length = 150)
    private String email;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Builder.Default
    @Column(length = 20)
    private String status = "active";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "reg_number", length = 100)
    private String regNumber;

    @Column(name = "father_name", length = 100)
    private String fatherName;

    @Column(name = "parent_mobile", length = 20)
    private String parentMobile;

    @Column
    private LocalDate dob;

    @Column(length = 100)
    private String qualification;

    @Column(name = "referred_by", length = 100)
    private String referredBy;

    @Column(name = "referral_profession", length = 100)
    private String referralProfession;

    @Column(length = 100)
    private String instructor;

    @Column(length = 100)
    private String timing;

    @Column(name = "start_date")
    private LocalDate startDate;

    @Column(length = 255)
    private String password;

    @Column(length = 255)
    private String token;

    @Column(name = "last_login")
    private LocalDateTime lastLogin;

    @Column(length = 100)
    private String district;

    @Column(length = 20)
    private String gender;

    @Column(name = "selected_subjects", columnDefinition = "TEXT")
    private String selectedSubjects;

    @Column(name = "subject_allocations", columnDefinition = "TEXT")
    private String subjectAllocations;

    @Column(name = "photo", columnDefinition = "LONGTEXT")
    private String photo;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
