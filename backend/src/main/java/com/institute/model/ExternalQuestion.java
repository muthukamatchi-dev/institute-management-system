package com.institute.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "external_questions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ExternalQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "exam_id", nullable = false) private Long examId;
    @Column(name = "question_type", length = 10) private String questionType = "mcq";
    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false) private String questionText;
    @Column private Integer marks = 1;
    @Column(name = "order_index") private Integer orderIndex = 0;
}
