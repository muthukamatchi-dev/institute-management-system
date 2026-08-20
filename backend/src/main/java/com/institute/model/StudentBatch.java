package com.institute.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "student_batches")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentBatch {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "student_id", nullable = false)
    private Long studentId;

    @Column(name = "batch_id", nullable = false)
    private Long batchId;
}
