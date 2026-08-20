package com.institute.dto.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FeesDiaryDTO {
    private String receiptNo;
    private String studentName;
    private String courseName;
    private LocalDate date;
    private BigDecimal amount;
    private String method;
}
