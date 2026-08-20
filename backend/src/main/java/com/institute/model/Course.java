package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class Course {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "course_id", length = 100)
    private String courseId;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String category;

    @Column(length = 50)
    private String duration;

    @Column(nullable = false, precision = 10, scale = 2)
    private BigDecimal fees;

    @Column(length = 20)
    private String status = "active";

    @Column(name = "syllabus_path", length = 255)
    private String syllabusPath;

    @Column(name = "image_path", length = 255)
    private String imagePath;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "branch_id")
    private Long branchId;

    @Column(name = "course_type", length = 50)
    private String courseType;

    @Column(name = "subjects", columnDefinition = "TEXT")
    private String subjects;

    @Column(name = "fee_period", length = 50)
    private String feePeriod = "course";

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
