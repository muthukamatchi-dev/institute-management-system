package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.math.BigDecimal;

@Entity
@Table(name = "exam_entry_student_results")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class ExamEntryStudentResult {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_entry_id", nullable = false)
    private Long examEntryId;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "marks_obtained", columnDefinition = "TEXT")
    private String marksObtained; // JSON array of marks obtained per question, e.g. [4.5, 9, ...]

    @Column(name = "total_marks_obtained", precision = 10, scale = 2)
    private BigDecimal totalMarksObtained;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
