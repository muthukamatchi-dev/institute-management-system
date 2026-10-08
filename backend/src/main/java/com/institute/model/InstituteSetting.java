package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDateTime;

@Entity
@Table(name = "institute_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class InstituteSetting {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 255)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String address;

    @Column(length = 20)
    private String phone;

    @Column(length = 100)
    private String email;

    @Column(name = "logo_path", length = 255)
    private String logoPath;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    // Registration settings
    @Column(name = "reg_prefix", length = 100)
    private String regPrefix;

    @Column(name = "reg_suffix", length = 100)
    private String regSuffix;

    @Column(name = "reg_start_from", length = 100)
    private String regStartFrom;

    @Column(name = "reg_mode", length = 100)
    private String regMode;

    @Column(name = "reg_last_number", length = 100)
    private String regLastNumber;

    @Column(name = "institute_name", length = 255)
    private String instituteName;

    @Column(name = "registration_id", length = 100)
    private String registrationId;

    // Staff ID settings
    @Column(name = "staff_id_prefix", length = 100)
    private String staffIdPrefix;

    @Column(name = "staff_id_suffix", length = 100)
    private String staffIdSuffix;

    @Column(name = "staff_id_start_from", length = 100)
    private String staffIdStartFrom;

    @Column(name = "staff_id_mode", length = 100)
    private String staffIdMode;

    @Column(name = "staff_id_last_number", length = 100)
    private String staffIdLastNumber;

    // Course ID settings
    @Column(name = "course_id_prefix", length = 100)
    private String courseIdPrefix;

    @Column(name = "course_id_suffix", length = 100)
    private String courseIdSuffix;

    @Column(name = "course_id_start_from", length = 100)
    private String courseIdStartFrom;

    @Column(name = "course_id_mode", length = 100)
    private String courseIdMode;

    @Column(name = "course_id_last_number", length = 100)
    private String courseIdLastNumber;

    // Appearance
    @Column(name = "appearance_color", length = 20)
    private String appearanceColor;

    @Column(name = "appearance_mode", length = 20)
    private String appearanceMode;

    @Column(name = "admin_as_staff")
    private Integer adminAsStaff;

    @Column(name = "allow_performance_exams")
    private Integer allowPerformanceExams;

    @Column(name = "enable_multiple_branches")
    private Integer enableMultipleBranches;

    @Column(name = "enable_standard_courses")
    private Integer enableStandardCourses;

    @Column(name = "enable_exams")
    private Integer enableExams;

    @Column(name = "enable_expenses")
    private Integer enableExpenses;

    @Column(name = "enable_study_material")
    private Integer enableStudyMaterial;

    @Column(name = "enable_programs")
    private Integer enablePrograms;

    @Column(name = "basic_settings", columnDefinition = "TEXT")
    private String basicSettings;

    @Column(name = "gdrive_backup_url", length = 500)
    private String gdriveBackupUrl;

    @Column(name = "backup_frequency", length = 50)
    private String backupFrequency;

    @Column(name = "last_backup_at")
    private LocalDateTime lastBackupAt;

    // SMTP Configuration
    @Column(name = "smtp_host", length = 255)
    private String smtpHost;

    @Column(name = "smtp_port")
    private Integer smtpPort;

    @Column(name = "smtp_username", length = 255)
    private String smtpUsername;

    @Column(name = "smtp_password", length = 255)
    private String smtpPassword;

    @Column(name = "smtp_from_email", length = 255)
    private String smtpFromEmail;

    @Column(name = "smtp_from_name", length = 255)
    private String smtpFromName;

    @Column(name = "smtp_encryption", length = 20)
    private String smtpEncryption;

    @Column(name = "enable_smtp")
    private Integer enableSmtp;

    @Column(name = "smtp_triggers", length = 500)
    private String smtpTriggers;

    // Getters and Setters for SMTP
    public String getSmtpHost() {
        return smtpHost;
    }

    public void setSmtpHost(String smtpHost) {
        this.smtpHost = smtpHost;
    }

    public Integer getSmtpPort() {
        return smtpPort;
    }

    public void setSmtpPort(Integer smtpPort) {
        this.smtpPort = smtpPort;
    }

    public String getSmtpUsername() {
        return smtpUsername;
    }

    public void setSmtpUsername(String smtpUsername) {
        this.smtpUsername = smtpUsername;
    }

    public String getSmtpPassword() {
        return smtpPassword;
    }

    public void setSmtpPassword(String smtpPassword) {
        this.smtpPassword = smtpPassword;
    }

    public String getSmtpFromEmail() {
        return smtpFromEmail;
    }

    public void setSmtpFromEmail(String smtpFromEmail) {
        this.smtpFromEmail = smtpFromEmail;
    }

    public String getSmtpFromName() {
        return smtpFromName;
    }

    public void setSmtpFromName(String smtpFromName) {
        this.smtpFromName = smtpFromName;
    }

    public String getSmtpEncryption() {
        return smtpEncryption;
    }

    public void setSmtpEncryption(String smtpEncryption) {
        this.smtpEncryption = smtpEncryption;
    }

    public Integer getEnableSmtp() {
        return enableSmtp;
    }

    public void setEnableSmtp(Integer enableSmtp) {
        this.enableSmtp = enableSmtp;
    }

    public String getSmtpTriggers() {
        return smtpTriggers;
    }

    public void setSmtpTriggers(String smtpTriggers) {
        this.smtpTriggers = smtpTriggers;
    }

    public Integer getAllowSchedulePastDates() {
        if (basicSettings != null && !basicSettings.isBlank()) {
            try {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(basicSettings);
                if (node.has("allowPast")) {
                    com.fasterxml.jackson.databind.JsonNode p = node.get("allowPast");
                    if (p.isBoolean()) return p.asBoolean() ? 1 : 0;
                    if (p.isNumber()) return p.asInt() != 0 ? 1 : 0;
                    return ("true".equalsIgnoreCase(p.asText()) || "1".equals(p.asText())) ? 1 : 0;
                }
                if (node.has("allowSchedulePastDates")) {
                    com.fasterxml.jackson.databind.JsonNode p = node.get("allowSchedulePastDates");
                    if (p.isBoolean()) return p.asBoolean() ? 1 : 0;
                    if (p.isNumber()) return p.asInt() != 0 ? 1 : 0;
                    return ("true".equalsIgnoreCase(p.asText()) || "1".equals(p.asText())) ? 1 : 0;
                }
            } catch (Exception ignored) {}
        }
        return 0;
    }

    public Integer getAllowScheduleFutureDates() {
        if (basicSettings != null && !basicSettings.isBlank()) {
            try {
                com.fasterxml.jackson.databind.JsonNode node = new com.fasterxml.jackson.databind.ObjectMapper().readTree(basicSettings);
                if (node.has("allowFuture")) {
                    com.fasterxml.jackson.databind.JsonNode p = node.get("allowFuture");
                    if (p.isBoolean()) return p.asBoolean() ? 1 : 0;
                    if (p.isNumber()) return p.asInt() != 0 ? 1 : 0;
                    return ("true".equalsIgnoreCase(p.asText()) || "1".equals(p.asText())) ? 1 : 0;
                }
                if (node.has("allowScheduleFutureDates")) {
                    com.fasterxml.jackson.databind.JsonNode p = node.get("allowScheduleFutureDates");
                    if (p.isBoolean()) return p.asBoolean() ? 1 : 0;
                    if (p.isNumber()) return p.asInt() != 0 ? 1 : 0;
                    return ("true".equalsIgnoreCase(p.asText()) || "1".equals(p.asText())) ? 1 : 0;
                }
            } catch (Exception ignored) {}
        }
        return 0;
    }

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";

    @PrePersist
    @PreUpdate
    protected void onSave() {
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }
}
