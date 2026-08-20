package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;

@Entity @Table(name = "template_questions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class TemplateQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "template_id", nullable = false) private Long templateId;
    @Column(name = "question_type", length = 10) private String questionType = "mcq";
    @Column(name = "question_text", columnDefinition = "TEXT", nullable = false) private String questionText;
    @Column private Integer marks = 1;
    @Column(name = "order_index") private Integer orderIndex = 0;
    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
