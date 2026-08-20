package com.institute.dto.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MonthlyTrendDTO {
    private String month;
    private BigDecimal revenue;
    private BigDecimal expenses;
    private BigDecimal profit;
    private Long enrollmentCount;
}
