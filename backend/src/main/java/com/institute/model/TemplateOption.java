package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

@Entity @Table(name = "template_options")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class TemplateOption {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "question_id", nullable = false) private Long questionId;
    @Column(name = "option_text", columnDefinition = "TEXT", nullable = false) private String optionText;
    @Column(name = "is_correct") private Integer isCorrect = 0;
    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
