package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "institute_settings")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstituteSetting {
    @Id
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
}
