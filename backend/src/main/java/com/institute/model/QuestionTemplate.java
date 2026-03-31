package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "question_templates")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class QuestionTemplate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 255) private String title;
    @Column(name = "course_id") private Long courseId;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
}
