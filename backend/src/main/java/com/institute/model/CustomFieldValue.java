package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "custom_field_values")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class CustomFieldValue {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "field_id", nullable = false) private Long fieldId;
    @Column(name = "entity_id", nullable = false) private Long entityId;
    @Column(name = "field_value", columnDefinition = "TEXT") private String fieldValue;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
}
