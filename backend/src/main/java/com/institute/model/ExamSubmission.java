package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_submissions")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
public class ExamSubmission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "exam_id", nullable = false)
    private Long examId;

    @Column(name = "student_id")
    private Long studentId;

    @Column(name = "participant_id")
    private Long participantId;

    @Column(name = "start_time")
    private LocalDateTime startTime;

    @Column(name = "end_time")
    private LocalDateTime endTime;

    @Column(name = "total_score", precision = 10, scale = 2)
    private BigDecimal totalScore = BigDecimal.ZERO;

    @Column(name = "is_evaluated")
    private Integer isEvaluated = 0;

    @Column(name = "attempt_number")
    private Integer attemptNumber = 1;

    @Column(length = 20)
    private String status = "ongoing";

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";
}
