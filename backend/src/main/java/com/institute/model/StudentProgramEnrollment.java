package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_program_enrollments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class StudentProgramEnrollment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "program_id", nullable = false)
    private Long programId;

    @Column(name = "enrollment_date", nullable = false)
    private LocalDate enrollmentDate;

    @Column(name = "completion_date")
    private LocalDate completionDate;

    @Builder.Default
    @Column(length = 20)
    private String status = "IN_PROGRESS"; // ENROLLED, IN_PROGRESS, COMPLETED, SUSPENDED, DISCONTINUED

    @Builder.Default
    @Column(name = "current_module_order")
    private Integer currentModuleOrder = 1;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
