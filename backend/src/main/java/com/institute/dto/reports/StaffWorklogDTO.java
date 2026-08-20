package com.institute.dto.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StaffWorklogDTO {
    private String name;
    private Long classes_taken;
    private Long exams_created;
    private Long system_activities;
}
