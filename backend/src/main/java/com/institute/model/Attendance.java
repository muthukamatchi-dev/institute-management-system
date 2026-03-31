package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.time.LocalDate;

@Entity
@Table(name = "attendance")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "branchFilter", condition = "branch_id = :branchId")
public class Attendance {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "batch_id")
    private Long batchId;

    @Column(name = "attendance_date", nullable = false)
    private LocalDate attendanceDate;

    @Column(nullable = false, length = 10)
    private String status;

    @Column(columnDefinition = "TEXT")
    private String remarks;

    @Column(name = "staff_id")
    private Long staffId;

    @Column(name = "scheduled_class_id")
    private Long scheduledClassId;

    @Column(name = "branch_id")
    private Long branchId;
}
