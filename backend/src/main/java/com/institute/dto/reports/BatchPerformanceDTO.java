package com.institute.dto.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BatchPerformanceDTO {
    private String course_name;
    private String batch_name;
    private Double avg_score;
    private Long students_participated;
}
