package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_module_progress")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class StudentModuleProgress {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "program_enrollment_id", nullable = false)
    private Long programEnrollmentId;

    @Column(name = "program_module_id", nullable = false)
    private Long programModuleId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "student_course_id")
    private Long studentCourseId;

    @Column(name = "batch_id")
    private Long batchId;

    @Builder.Default
    @Column(length = 20)
    private String status = "LOCKED"; // LOCKED, AVAILABLE, IN_PROGRESS, COMPLETED, SKIPPED, FAILED

    @Column(name = "unlocked_at")
    private LocalDateTime unlockedAt;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

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
