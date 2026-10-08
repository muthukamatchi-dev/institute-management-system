package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.time.LocalDateTime;

@Entity
@Table(name = "program_modules")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class ProgramModule {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "program_id", nullable = false)
    private Long programId;

    @Column(name = "course_id", nullable = false)
    private Long courseId;

    @Column(name = "module_order", nullable = false)
    private Integer moduleOrder;

    @Column(name = "module_name", length = 150)
    private String moduleName;

    @Builder.Default
    @Column(name = "is_mandatory")
    private Boolean isMandatory = true;

    @Builder.Default
    @Column(name = "prerequisite_type", length = 30)
    private String prerequisiteType = "PREVIOUS_MODULE"; // NONE, PREVIOUS_MODULE, SPECIFIC_COURSE

    @Column(name = "prerequisite_course_id")
    private Long prerequisiteCourseId;

    @Column(name = "prerequisite_module_id")
    private Long prerequisiteModuleId;

    @Builder.Default
    @Column(name = "min_attendance_pct")
    private Integer minAttendancePct = 0;

    @Builder.Default
    @Column(name = "min_exam_score_pct")
    private Integer minExamScorePct = 0;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";

    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
