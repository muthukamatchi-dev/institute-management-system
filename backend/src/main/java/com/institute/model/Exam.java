package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "exams")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
public class Exam {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "course_id")
    private Long courseId;

    @Builder.Default
    @Column(name = "total_marks")
    private Integer totalMarks = 0;

    @Builder.Default
    @Column(name = "duration_minutes")
    private Integer durationMinutes = 0;

    @Builder.Default
    @Column(name = "pass_percentage")
    private Integer passPercentage = 40;

    @Builder.Default
    @Column(name = "exam_type", length = 20)
    private String examType = "standard";

    @Builder.Default
    @Column(length = 20)
    private String status = "draft";

    @Column(name = "exam_date")
    private LocalDate examDate;

    @Column(name = "created_by")
    private Long createdBy;

    @Builder.Default
    @Column(name = "is_deleted")
    private Integer isDeleted = 0;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "branch_id")
    private Long branchId;
}
