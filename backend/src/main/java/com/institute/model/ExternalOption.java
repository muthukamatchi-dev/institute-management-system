package com.institute.model;

import jakarta.persistence.*;
import lombok.*;

@Entity @Table(name = "external_options")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ExternalOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "question_id", nullable = false) private Long questionId;
    @Column(name = "option_text", columnDefinition = "TEXT", nullable = false) private String optionText;
    @Column(name = "is_correct") private Integer isCorrect = 0;
}
