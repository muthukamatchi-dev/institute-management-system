package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity @Table(name = "external_exam_submissions")
@Data @NoArgsConstructor @AllArgsConstructor @Builder
public class ExternalExamSubmission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    @Column(name = "exam_id", nullable = false) private Long examId;
    @Column(name = "participant_id", nullable = false) private Long participantId;
    @Column(precision = 10, scale = 2) private BigDecimal score = BigDecimal.ZERO;
    @Column(name = "submitted_at") private LocalDateTime submittedAt;
    @Column(name = "is_evaluated") private Integer isEvaluated = 0;
    @Column(length = 20) private String status = "submitted";
    @Column(name = "attempt_number") private Integer attemptNumber = 1;
}
