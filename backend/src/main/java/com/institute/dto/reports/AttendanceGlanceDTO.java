package com.institute.dto.reports;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceGlanceDTO {
    private Long student_id;
    private String student_name;
    private String reg_number;
    private String batch_name;
    private String course_name;
    private String gender;
    private String student_status;
    private Long total_sessions;
    private Long present_count;
    private Long absent_count;
    private Long late_count;
    private Long leave_count;
    private Double percentage;
}
