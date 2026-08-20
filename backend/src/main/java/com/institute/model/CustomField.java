package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity @Table(name = "custom_fields")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class CustomField {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(nullable = false, length = 50) private String location;
    @Column(name = "field_label", nullable = false, length = 255) private String fieldLabel;
    @Column(name = "field_type", length = 20) private String fieldType = "text";
    @Column(name = "is_required") private Integer isRequired = 0;
    @Column(columnDefinition = "TEXT") private String options;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Column(name = "updated_at") private LocalDateTime updatedAt;
    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
