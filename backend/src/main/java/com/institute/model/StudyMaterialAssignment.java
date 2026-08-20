package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity @Table(name = "study_material_assignments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class StudyMaterialAssignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "material_id", nullable = false) private Long materialId;
    @Column(name = "target_type", length = 20) private String targetType = "batch";
    @Column(name = "target_id", nullable = false) private Long targetId;
    @Column(name = "assigned_at") private LocalDateTime assignedAt;
    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
