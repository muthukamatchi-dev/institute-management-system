package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "enquiries")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class Enquiry {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(length = 30)
    private String mobile;

    @Column(length = 150)
    private String email;

    @Column(length = 255)
    private String address;

    @Column(name = "course_id")
    private Long courseId;

    @Column(name = "course_name", length = 150)
    private String courseName;

    @Column(name = "enquiry_type", length = 50)
    @Builder.Default
    private String enquiryType = "walk-in"; // walk-in, phone, online, referral

    @Column(length = 50)
    @Builder.Default
    private String status = "new"; // new, in-progress, follow-up, converted, closed

    @Column(name = "follow_up_date")
    private LocalDate followUpDate;

    @Column(name = "assigned_staff_id")
    private Long assignedStaffId;

    @Column(name = "assigned_staff_name", length = 150)
    private String assignedStaffName;

    @Column(name = "reference_source", length = 100)
    private String referenceSource; // social-media, newspaper, friend, banner, walk-in, other

    @Column(columnDefinition = "TEXT")
    private String notes;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
