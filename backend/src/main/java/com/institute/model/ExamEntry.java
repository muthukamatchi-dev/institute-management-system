package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_entries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class ExamEntry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String title;

    @Column(name = "exam_date")
    private LocalDateTime examDate;

    @Column(name = "total_marks")
    private Integer totalMarks;

    @Column(name = "course_id")
    private Long courseId;

    @Column(length = 150)
    private String subject;

    @Column(name = "question_count")
    private Integer questionCount;

    @Column(name = "question_marks", columnDefinition = "TEXT")
    private String questionMarks; // JSON array of marks per question, e.g. [5, 10, ...]

    @Column(columnDefinition = "TEXT")
    private String batches; // JSON array of batch IDs

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
