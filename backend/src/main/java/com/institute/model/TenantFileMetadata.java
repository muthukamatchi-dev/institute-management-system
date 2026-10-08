package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_file_metadata")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class TenantFileMetadata {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Builder.Default
    @Column(name = "tenant_id", nullable = false, length = 100)
    private String tenantId = "default";

    @Column(name = "entity_type", nullable = false, length = 50)
    private String entityType; // STUDENT, STAFF, COURSE, STUDY_MATERIAL, EXAM, LOGO, SYLLABUS, etc.

    @Column(name = "entity_id")
    private Long entityId;

    @Builder.Default
    @Column(nullable = false, length = 50)
    private String provider = "GOOGLE_DRIVE";

    @Column(name = "provider_file_id", length = 255)
    private String providerFileId;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "mime_type", length = 100)
    private String mimeType;

    @Column(name = "file_size")
    private Long fileSize;

    @Column(length = 50)
    private String category;

    @Column(name = "web_view_link", columnDefinition = "TEXT")
    private String webViewLink;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
