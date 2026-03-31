package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity @Table(name = "study_material_assignments")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class StudyMaterialAssignment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "material_id", nullable = false) private Long materialId;
    @Column(name = "target_type", length = 20) private String targetType = "batch";
    @Column(name = "target_id", nullable = false) private Long targetId;
    @Column(name = "assigned_at") private LocalDateTime assignedAt;
}
