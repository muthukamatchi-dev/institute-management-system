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
public class ExpenseReportDTO {
    private String title;
    private String category;
    private LocalDate expense_date;
    private String payment_method;
    private BigDecimal amount;
    private String description;
    private String reference_no;
    private String created_by_name;
}
