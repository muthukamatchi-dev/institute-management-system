package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Represents a student's enrollment in a specific course.
 * Allows one student to be enrolled in multiple courses.
 * Each record tracks course, optional batch, joining date, status, and selected subjects.
 */
@Entity
@Table(name = "student_courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class StudentCourse {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "joining_date")
    private LocalDate joiningDate;

    @Builder.Default
    @Column(length = 20)
    private String status = "active";

    @Column(name = "selected_subjects", columnDefinition = "TEXT")
    private String selectedSubjects;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
