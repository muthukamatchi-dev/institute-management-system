package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "courses")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
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
}
