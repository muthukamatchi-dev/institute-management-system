package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity @Table(name = "external_participants")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class ExternalParticipant {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "exam_id", nullable = false) private Long examId;
    @Column(nullable = false, length = 255) private String name;
    @Column(nullable = false, length = 255) private String email;
    @Column(nullable = false, length = 255) private String password;
    @Column(length = 20) private String mobile;
    @Column(name = "created_at") private LocalDateTime createdAt;
    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
