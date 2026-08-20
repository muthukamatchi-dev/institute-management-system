package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Tenant Master Entity — the core of the SaaS multi-tenant system.
 * This table lives in the MASTER database and is queried BEFORE tenant routing.
 */
@Entity
@Table(name = "tenants")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tenant {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "tenant_name", nullable = false, length = 255)
    private String tenantName;

    @Column(name = "tenant_code", nullable = false, unique = true, length = 50)
    private String tenantCode;

    @Column(name = "subdomain", unique = true, length = 63)
    private String subdomain;

    @Column(length = 255)
    private String domain;

    @Builder.Default
    @Column(name = "database_type", nullable = false, length = 20)
    private String databaseType = "shared"; // "shared" or "dedicated"

    @Column(name = "database_name", length = 100)
    private String databaseName; // only for dedicated mode

    @Column(name = "admin_email", nullable = false, length = 255)
    private String adminEmail;

    @Column(name = "admin_phone", length = 20)
    private String adminPhone;

    @Builder.Default
    @Column(nullable = false, length = 20)
    private String status = "active"; // active, inactive, suspended

    @Column(name = "trial_start_date")
    private LocalDate trialStartDate;

    @Column(name = "trial_end_date")
    private LocalDate trialEndDate;

    @Builder.Default
    @Column(name = "is_trial_active")
    private Boolean isTrialActive = true;

    @Builder.Default
    @Column(name = "max_students")
    private Integer maxStudents = 500;

    @Builder.Default
    @Column(name = "max_staff")
    private Integer maxStaff = 50;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = LocalDateTime.now();
    }

    /**
     * Check if this tenant's trial has expired.
     */
    public boolean isTrialExpired() {
        if (!Boolean.TRUE.equals(isTrialActive)) return false; // trial not active = no expiry
        if (trialEndDate == null) return false;
        return LocalDate.now().isAfter(trialEndDate);
    }

    /**
     * Check if this tenant is usable (active + trial not expired).
     */
    public boolean isUsable() {
        return "active".equalsIgnoreCase(status) && !isTrialExpired();
    }

    /**
     * Returns the effective database identifier for routing.
     * Shared tenants → shared DB; dedicated tenants → their own DB.
     */
    public String getEffectiveDatabaseName() {
        if ("dedicated".equalsIgnoreCase(databaseType) && databaseName != null) {
            return databaseName;
        }
        return "default"; // shared tenants all use the default/shared DB
    }
}
