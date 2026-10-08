package com.institute.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.Filter;
import org.hibernate.annotations.Filters;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "programs")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
@EntityListeners(BranchEntityListener.class)
@Filters({
    @Filter(name = "branchFilter", condition = "(branch_id = :branchId OR branch_id IS NULL)"),
    @Filter(name = "tenantFilter", condition = "tenant_id = :tenantId")
})
public class Program {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "program_code", length = 100)
    private String programCode;

    @Column(nullable = false, length = 150)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(length = 100)
    private String category;

    @Column(name = "total_duration", length = 50)
    private String totalDuration;

    @Builder.Default
    @Column(name = "total_fee", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalFee = BigDecimal.ZERO;

    @Builder.Default
    @Column(name = "fee_mode", length = 20)
    private String feeMode = "lump_sum"; // 'lump_sum' or 'per_module'

    @Builder.Default
    @Column(length = 20)
    private String status = "active";

    @Column(name = "image_path", length = 255)
    private String imagePath;

    @Column(name = "branch_id")
    private Long branchId;

    @Builder.Default
    @Column(name = "tenant_id", length = 100)
    private String tenantId = "default";

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
