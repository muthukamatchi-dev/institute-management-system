package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity @Table(name = "question_templates")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class QuestionTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 255) private String title;
    @Column(name = "course_id") private Long courseId;
    @Column(name = "subject", length = 150) private String subject;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
