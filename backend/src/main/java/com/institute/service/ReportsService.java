package com.institute.service;

import com.institute.dto.reports.*;
import com.institute.model.*;
import com.institute.repository.*;
import com.institute.tenant.TenantContext;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ReportsService {

    private final StudentRepository studentRepo;
    private final BatchRepository batchRepo;
    private final CourseRepository courseRepo;
    private final FeeRepository feeRepo;
    private final ReceiptRepository receiptRepo;
    private final ExpenseRepository expenseRepo;
    private final AttendanceRepository attendanceRepo;
    private final ActivityLogRepository activityLogRepo;
    private final StaffRepository staffRepo;
    private final ExamSubmissionRepository examSubmissionRepo;
    private final ExamRepository examRepo;
    private final ScheduledClassRepository scheduledClassRepo;
    private final StaffAttendanceRepository staffAttendanceRepo;
    private final jakarta.persistence.EntityManager entityManager;

    public ReportsService(StudentRepository studentRepo, BatchRepository batchRepo,
                          CourseRepository courseRepo, FeeRepository feeRepo,
                          ReceiptRepository receiptRepo, ExpenseRepository expenseRepo,
                          AttendanceRepository attendanceRepo, ActivityLogRepository activityLogRepo,
                          StaffRepository staffRepo, ExamSubmissionRepository examSubmissionRepo,
                          ExamRepository examRepo, ScheduledClassRepository scheduledClassRepo,
                          StaffAttendanceRepository staffAttendanceRepo,
                          jakarta.persistence.EntityManager entityManager) {
        this.studentRepo = studentRepo;
        this.batchRepo = batchRepo;
        this.courseRepo = courseRepo;
        this.feeRepo = feeRepo;
        this.receiptRepo = receiptRepo;
        this.expenseRepo = expenseRepo;
        this.attendanceRepo = attendanceRepo;
        this.activityLogRepo = activityLogRepo;
        this.staffRepo = staffRepo;
        this.examSubmissionRepo = examSubmissionRepo;
        this.examRepo = examRepo;
        this.scheduledClassRepo = scheduledClassRepo;
        this.staffAttendanceRepo = staffAttendanceRepo;
        this.entityManager = entityManager;
    }

    private DateRange parseRange(Map<String, String> filters) {
        LocalDate from = null;
        LocalDate to = LocalDate.now();

        if (filters != null) {
            String range = filters.get("range");
            if (range != null && !range.isBlank()) {
                LocalDate today = LocalDate.now();
                switch (range) {
                    case "today" -> {
                        from = today;
                        to = today;
                    }
                    case "yesterday" -> {
                        from = today.minusDays(1);
                        to = from;
                    }
                    case "this_week" -> {
                        from = today.minusDays(today.getDayOfWeek().getValue() - 1L);
                        to = today;
                    }
                    case "last_week" -> {
                        LocalDate thisWeekStart = today.minusDays(today.getDayOfWeek().getValue() - 1L);
                        from = thisWeekStart.minusWeeks(1);
                        to = thisWeekStart.minusDays(1);
                    }
                    case "this_month" -> {
                        from = today.withDayOfMonth(1);
                        to = today;
                    }
                    case "last_month" -> {
                        LocalDate lastMonth = today.minusMonths(1);
                        from = lastMonth.withDayOfMonth(1);
                        to = lastMonth.withDayOfMonth(lastMonth.lengthOfMonth());
                    }
                    case "this_quarter" -> {
                        int currentQuarterStartMonth = ((today.getMonthValue() - 1) / 3) * 3 + 1;
                        from = LocalDate.of(today.getYear(), currentQuarterStartMonth, 1);
                        to = today;
                    }
                    case "last_quarter" -> {
                        LocalDate thisQuarterStart = LocalDate.of(today.getYear(), ((today.getMonthValue() - 1) / 3) * 3 + 1, 1);
                        LocalDate lastQuarterRef = thisQuarterStart.minusMonths(1);
                        int lastQuarterStartMonth = ((lastQuarterRef.getMonthValue() - 1) / 3) * 3 + 1;
                        from = LocalDate.of(lastQuarterRef.getYear(), lastQuarterStartMonth, 1);
                        to = from.plusMonths(3).minusDays(1);
                    }
                    case "this_fiscal_year" -> {
                        int fiscalStartYear = today.getMonthValue() >= 4 ? today.getYear() : today.getYear() - 1;
                        from = LocalDate.of(fiscalStartYear, 4, 1);
                        to = today;
                    }
                    case "last_fiscal_year" -> {
                        int fiscalStartYear = today.getMonthValue() >= 4 ? today.getYear() - 1 : today.getYear() - 2;
                        from = LocalDate.of(fiscalStartYear, 4, 1);
                        to = from.plusYears(1).minusDays(1);
                    }
                    default -> {
                    }
                }
            }

            if (filters.containsKey("date_from")) {
                from = LocalDate.parse(filters.get("date_from"));
            } else if (filters.containsKey("start")) {
                from = LocalDate.parse(filters.get("start"));
            }
            
            if (filters.containsKey("date_to")) {
                to = LocalDate.parse(filters.get("date_to"));
            } else if (filters.containsKey("end")) {
                to = LocalDate.parse(filters.get("end"));
            }
        }
        
        if (from == null) from = LocalDate.now().minusMonths(1);
        return new DateRange(from, to);
    }

    private static class DateRange {
        LocalDate from;
        LocalDate to;
        DateRange(LocalDate f, LocalDate t) { this.from = f; this.to = t; }
    }

    // 1. PROFIT & LOSS
    public ProfitLossReportDTO getProfitLoss(Map<String, String> filters) {
        DateRange range = parseRange(filters);
        String tenantId = TenantContext.getTenantId();

        BigDecimal revenue = receiptRepo.sumAmountPaidBetween(range.from, range.to);
        BigDecimal expenses = expenseRepo.sumAmountBetween(range.from, range.to);
        
        List<Object[]> monthlyRev = receiptRepo.getMonthlyRevenue(range.from, range.to, tenantId);
        List<Object[]> monthlyExp = expenseRepo.getMonthlyExpenses(range.from, range.to, tenantId);

        Map<String, MonthlyTrendDTO> trendMap = new TreeMap<>();
        for (Object[] row : monthlyRev) {
            String month = (String) row[0];
            BigDecimal val = (BigDecimal) row[1];
            trendMap.put(month, MonthlyTrendDTO.builder().month(month).revenue(val).expenses(BigDecimal.ZERO).build());
        }
        for (Object[] row : monthlyExp) {
            String month = (String) row[0];
            BigDecimal val = (BigDecimal) row[1];
            MonthlyTrendDTO dto = trendMap.getOrDefault(month, MonthlyTrendDTO.builder().month(month).revenue(BigDecimal.ZERO).build());
            dto.setExpenses(val);
            trendMap.put(month, dto);
        }

        List<ExpenseBreakdownDTO> breakdown = expenseRepo.getExpenseStatsByCategory().stream()
                .map(row -> ExpenseBreakdownDTO.builder().category((String) row[0]).total((BigDecimal) row[1]).build())
                .collect(Collectors.toList());

        return ProfitLossReportDTO.builder()
                .totalRevenue(revenue)
                .totalExpenses(expenses)
                .netProfit(revenue.subtract(expenses))
                .expenseBreakdown(breakdown)
                .monthlyTrends(new ArrayList<>(trendMap.values()))
                .build();
    }

    // 2. FEES DIARY
    public List<FeesDiaryDTO> getFeesDiary(Map<String, String> filters) {
        DateRange range = parseRange(filters);
        List<Receipt> receipts = receiptRepo.findAllByOrderByPaymentDateDesc();
        
        return receipts.stream()
                .filter(r -> !r.getPaymentDate().isBefore(range.from) && !r.getPaymentDate().isAfter(range.to))
                .map(r -> {
                    Student s = studentRepo.findById(r.getStudentId()).orElse(null);
                    Course c = s != null && s.getCourseId() != null ? courseRepo.findById(s.getCourseId()).orElse(null) : null;
                    
                    return FeesDiaryDTO.builder()
                            .receiptNo(r.getReceiptNo())
                            .studentName(s != null ? s.getName() : "Unknown")
                            .courseName(c != null ? c.getName() : "N/A")
                            .date(r.getPaymentDate())
                            .amount(r.getAmountPaid())
                            .method(r.getPaymentMethod())
                            .build();
                })
                .collect(Collectors.toList());
    }

    // 3. EXPENSES REPORT
    public List<ExpenseReportDTO> getExpensesReport(Map<String, String> filters) {
        DateRange range = parseRange(filters);
        List<Expense> expenses = expenseRepo.findAllByOrderByExpenseDateDesc();
        
        return expenses.stream()
                .filter(e -> !e.getExpenseDate().isBefore(range.from) && !e.getExpenseDate().isAfter(range.to))
                .map(e -> ExpenseReportDTO.builder()
                        .title(e.getTitle())
                        .category(e.getCategory())
                        .amount(e.getAmount())
                        .expense_date(e.getExpenseDate())
                        .payment_method(e.getPaymentMethod())
                        .description(e.getDescription())
                        .reference_no(e.getReferenceNo())
                        .created_by_name("Administrator")
                        .build())
                .collect(Collectors.toList());
    }

    // 4. ATTENDANCE GLANCE
    public Object getAttendanceReport(Map<String, String> filters) {
        DateRange range = parseRange(filters);
        String tenantId = TenantContext.getTenantId();
        
        // 1. Build base query
        StringBuilder queryBuilder = new StringBuilder();
        queryBuilder.append("SELECT s.id, s.name as student_name, s.reg_number, s.gender, s.status as student_status, ")
            .append("b.batch_name, c.name as course_name, ")
            .append("COALESCE(att.total, 0) as total_sessions, ")
            .append("COALESCE(att.present, 0) as present_count, ")
            .append("COALESCE(att.absent, 0) as absent_count, ")
            .append("COALESCE(att.late, 0) as late_count, ")
            .append("COALESCE(att.leave_cnt, 0) as leave_count, ")
            .append("CASE WHEN COALESCE(att.total, 0) > 0 THEN ROUND((COALESCE(att.present, 0) * 100.0) / att.total, 2) ELSE 0.0 END as percentage ")
            .append("FROM students s ")
            .append("LEFT JOIN batches b ON b.id = (CASE WHEN :batchIdForJoin IS NULL THEN s.batch_id ELSE :batchIdForJoin END) ")
            .append("LEFT JOIN courses c ON s.course_id = c.id ")
            .append("LEFT JOIN ( ")
            .append("  SELECT student_id, COUNT(*) as total, ")
            .append("  SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) as present, ")
            .append("  SUM(CASE WHEN status = 'absent' THEN 1 ELSE 0 END) as absent, ")
            .append("  SUM(CASE WHEN status = 'late' THEN 1 ELSE 0 END) as late, ")
            .append("  SUM(CASE WHEN status = 'leave' THEN 1 ELSE 0 END) as leave_cnt ")
            .append("  FROM attendance ")
            .append("  WHERE attendance_date BETWEEN :start AND :end ")
            .append("  AND (tenant_id = :tenantId OR :tenantId = 'SYSTEM') ")
            .append("  GROUP BY student_id ")
            .append(") att ON s.id = att.student_id ")
            .append("WHERE (s.tenant_id = :tenantId OR :tenantId = 'SYSTEM') ");

        // We will store parameter values in a map
        Map<String, Object> params = new HashMap<>();
        params.put("start", range.from);
        params.put("end", range.to);
        params.put("tenantId", tenantId);

        Long batchIdForJoin = null;
        if (filters != null) {
            String batchIdStr = filters.get("batch_id");
            if (batchIdStr != null && !batchIdStr.isBlank() && !"all".equals(batchIdStr)) {
                batchIdForJoin = Long.valueOf(batchIdStr);
            }
        }
        params.put("batchIdForJoin", batchIdForJoin);

        // Add filter conditions
        if (filters != null) {
            String search = filters.get("search");
            if (search != null && !search.isBlank()) {
                queryBuilder.append("AND (s.name LIKE :search OR s.reg_number LIKE :search OR CAST(s.id AS CHAR) LIKE :search) ");
                params.put("search", "%" + search + "%");
            }
            String studentName = filters.get("studentName");
            if (studentName != null && !studentName.isBlank()) {
                queryBuilder.append("AND s.name LIKE :studentName ");
                params.put("studentName", "%" + studentName + "%");
            }
            String regNumber = filters.get("regNumber");
            if (regNumber != null && !regNumber.isBlank()) {
                queryBuilder.append("AND s.reg_number LIKE :regNumber ");
                params.put("regNumber", "%" + regNumber + "%");
            }
            String studentIdStr = filters.get("studentId");
            if (studentIdStr != null && !studentIdStr.isBlank()) {
                queryBuilder.append("AND CAST(s.id AS CHAR) LIKE :studentId ");
                params.put("studentId", "%" + studentIdStr + "%");
            }
            String courseIdStr = filters.get("course_id");
            if (courseIdStr != null && !courseIdStr.isBlank() && !"all".equals(courseIdStr)) {
                queryBuilder.append("AND s.course_id = :courseId ");
                params.put("courseId", Long.valueOf(courseIdStr));
            }
            String batchIdStr = filters.get("batch_id");
            if (batchIdStr != null && !batchIdStr.isBlank() && !"all".equals(batchIdStr)) {
                queryBuilder.append("AND (s.batch_id = :batchId OR s.id IN (SELECT sb.student_id FROM student_batches sb WHERE sb.batch_id = :batchId)) ");
                params.put("batchId", Long.valueOf(batchIdStr));
            }
            String subject = filters.get("subject");
            if (subject != null && !subject.isBlank() && !"all".equals(subject)) {
                queryBuilder.append("AND s.selected_subjects LIKE :subject ");
                params.put("subject", "%" + subject + "%");
            }
            String branchIdStr = filters.get("branch_id");
            if (branchIdStr != null && !branchIdStr.isBlank() && !"all".equals(branchIdStr)) {
                queryBuilder.append("AND s.branch_id = :branchId ");
                params.put("branchId", Long.valueOf(branchIdStr));
            }
            String gender = filters.get("gender");
            if (gender != null && !gender.isBlank() && !"all".equals(gender)) {
                queryBuilder.append("AND s.gender = :gender ");
                params.put("gender", gender);
            }
            String activeStatus = filters.get("activeStatus");
            if (activeStatus != null && !activeStatus.isBlank() && !"all".equals(activeStatus)) {
                queryBuilder.append("AND s.status = :activeStatus ");
                params.put("activeStatus", activeStatus);
            }
            
            String attendanceStatus = filters.get("attendanceStatus");
            if ("Present".equalsIgnoreCase(attendanceStatus)) {
                queryBuilder.append("AND COALESCE(att.present, 0) > 0 ");
            } else if ("Absent".equalsIgnoreCase(attendanceStatus)) {
                queryBuilder.append("AND COALESCE(att.absent, 0) > 0 ");
            }

            String percentFilter = filters.get("percentFilter");
            if (percentFilter != null && !percentFilter.isBlank()) {
                switch (percentFilter) {
                    case "below_50" -> queryBuilder.append("AND (COALESCE(att.total, 0) = 0 OR (COALESCE(att.present, 0) * 100.0) / att.total < 50.0) ");
                    case "below_60" -> queryBuilder.append("AND (COALESCE(att.total, 0) = 0 OR (COALESCE(att.present, 0) * 100.0) / att.total < 60.0) ");
                    case "below_75" -> queryBuilder.append("AND (COALESCE(att.total, 0) = 0 OR (COALESCE(att.present, 0) * 100.0) / att.total < 75.0) ");
                    case "above_75" -> queryBuilder.append("AND COALESCE(att.total, 0) > 0 AND (COALESCE(att.present, 0) * 100.0) / att.total >= 75.0 ");
                    case "above_90" -> queryBuilder.append("AND COALESCE(att.total, 0) > 0 AND (COALESCE(att.present, 0) * 100.0) / att.total >= 90.0 ");
                    case "perfect" -> queryBuilder.append("AND COALESCE(att.total, 0) > 0 AND COALESCE(att.present, 0) = att.total ");
                    case "custom" -> {
                        String minP = filters.get("minPercent");
                        String maxP = filters.get("maxPercent");
                        if (minP != null && !minP.isBlank()) {
                            queryBuilder.append("AND (COALESCE(att.present, 0) * 100.0) / COALESCE(att.total, 1) >= :minP ");
                            params.put("minP", Double.valueOf(minP));
                        }
                        if (maxP != null && !maxP.isBlank()) {
                            queryBuilder.append("AND (COALESCE(att.present, 0) * 100.0) / COALESCE(att.total, 1) <= :maxP ");
                            params.put("maxP", Double.valueOf(maxP));
                        }
                    }
                }
            }

            String specialFilter = filters.get("specialFilter");
            if (specialFilter != null && !specialFilter.isBlank()) {
                switch (specialFilter) {
                    case "below_threshold" -> {
                        String thresh = filters.getOrDefault("threshold", "75");
                        queryBuilder.append("AND (COALESCE(att.total, 0) = 0 OR (COALESCE(att.present, 0) * 100.0) / att.total < :thresh) ");
                        params.put("thresh", Double.valueOf(thresh));
                    }
                    case "consecutive_absent" -> {
                        int consecDays = Integer.parseInt(filters.getOrDefault("consecDays", "3"));
                        queryBuilder.append("AND s.id IN ( ")
                            .append("  SELECT DISTINCT student_id FROM ( ")
                            .append("    SELECT student_id, status, COUNT(*) as consec_count FROM ( ")
                            .append("      SELECT student_id, status, ")
                            .append("      ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY attendance_date) - ")
                            .append("      ROW_NUMBER() OVER (PARTITION BY student_id, status ORDER BY attendance_date) AS grp ")
                            .append("      FROM attendance ")
                            .append("      WHERE (tenant_id = :tenantId OR :tenantId = 'SYSTEM') ")
                            .append("    ) t ")
                            .append("    WHERE status = 'absent' ")
                            .append("    GROUP BY student_id, grp ")
                            .append("  ) t2 WHERE consec_count >= :consecDays ")
                            .append(") ");
                        params.put("consecDays", consecDays);
                    }
                    case "late_more_than" -> {
                        int lateLimit = Integer.parseInt(filters.getOrDefault("lateLimit", "3"));
                        queryBuilder.append("AND COALESCE(att.late, 0) > :lateLimit ");
                        params.put("lateLimit", lateLimit);
                    }
                    case "leave_more_than" -> {
                        int leaveLimit = Integer.parseInt(filters.getOrDefault("leaveLimit", "3"));
                        queryBuilder.append("AND COALESCE(att.leave_cnt, 0) > :leaveLimit ");
                        params.put("leaveLimit", leaveLimit);
                    }
                    case "not_marked" -> {
                        queryBuilder.append("AND COALESCE(att.total, 0) = 0 ");
                    }
                    case "warning" -> {
                        queryBuilder.append("AND COALESCE(att.total, 0) > 0 AND (COALESCE(att.present, 0) * 100.0) / att.total < 75.0 ");
                    }
                }
            }
        }

        // 2. Count Total Elements
        String countQueryStr = "SELECT COUNT(*) FROM (" + queryBuilder.toString() + ") countTable";
        jakarta.persistence.Query countQuery = entityManager.createNativeQuery(countQueryStr);
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            countQuery.setParameter(entry.getKey(), entry.getValue());
        }
        long totalElements = ((Number) countQuery.getSingleResult()).longValue();

        // 3. Sorting
        String sortColumn = "student_name";
        String sortDirection = "ASC";
        if (filters != null) {
            if (filters.containsKey("sortColumn") && !filters.get("sortColumn").isBlank()) {
                sortColumn = filters.get("sortColumn");
            }
            if (filters.containsKey("sortDirection") && !filters.get("sortDirection").isBlank()) {
                sortDirection = filters.get("sortDirection").toUpperCase();
                if (!"ASC".equals(sortDirection) && !"DESC".equals(sortDirection)) {
                    sortDirection = "ASC";
                }
            }
        }

        String sqlSortColumn = switch (sortColumn) {
            case "student_name" -> "s.name";
            case "reg_number" -> "s.reg_number";
            case "batch_name" -> "b.batch_name";
            case "course_name" -> "c.name";
            case "total_sessions" -> "total_sessions";
            case "present_count" -> "present_count";
            case "absent_count" -> "absent_count";
            case "late_count" -> "late_count";
            case "leave_count" -> "leave_count";
            case "percentage" -> "percentage";
            default -> "s.name";
        };

        queryBuilder.append("ORDER BY ").append(sqlSortColumn).append(" ").append(sortDirection).append(" ");

        // 4. Pagination limits
        int page = 0;
        int size = -1;
        if (filters != null) {
            if (filters.containsKey("page")) {
                page = Integer.parseInt(filters.get("page"));
            }
            if (filters.containsKey("size")) {
                size = Integer.parseInt(filters.get("size"));
            }
        }

        jakarta.persistence.Query query = entityManager.createNativeQuery(queryBuilder.toString());
        for (Map.Entry<String, Object> entry : params.entrySet()) {
            query.setParameter(entry.getKey(), entry.getValue());
        }

        if (size > 0) {
            query.setFirstResult(page * size);
            query.setMaxResults(size);
        }

        List<Object[]> rows = query.getResultList();
        List<AttendanceGlanceDTO> content = rows.stream().map(row -> {
            Long studentId = ((Number) row[0]).longValue();
            String name = (String) row[1];
            String regNumber = (String) row[2];
            String gender = (String) row[3];
            String studentStatus = (String) row[4];
            String batchName = (String) row[5];
            String courseName = (String) row[6];
            Long total = ((Number) row[7]).longValue();
            Long present = ((Number) row[8]).longValue();
            Long absent = ((Number) row[9]).longValue();
            Long late = ((Number) row[10]).longValue();
            Long leave = ((Number) row[11]).longValue();
            Double pct = ((Number) row[12]).doubleValue();

            return AttendanceGlanceDTO.builder()
                .student_id(studentId)
                .student_name(name)
                .reg_number(regNumber != null ? regNumber : "N/A")
                .batch_name(batchName != null ? batchName : "N/A")
                .course_name(courseName != null ? courseName : "N/A")
                .gender(gender != null ? gender : "N/A")
                .student_status(studentStatus)
                .total_sessions(total)
                .present_count(present)
                .absent_count(absent)
                .late_count(late)
                .leave_count(leave)
                .percentage(pct)
                .build();
        }).collect(Collectors.toList());

        Map<String, Object> response = new HashMap<>();
        response.put("content", content);
        response.put("totalElements", totalElements);
        response.put("totalPages", size > 0 ? (int) Math.ceil((double) totalElements / size) : 1);
        response.put("page", page);
        response.put("size", size);
        return response;
    }

    public Map<String, Object> getAttendanceAnalytics(Map<String, String> filters) {
        DateRange range = parseRange(filters);
        String tenantId = TenantContext.getTenantId();

        Map<String, String> baseFilters = new HashMap<>(filters != null ? filters : Collections.emptyMap());
        baseFilters.put("size", "5");
        baseFilters.put("page", "0");

        // Perfect attendance (100% and total_sessions > 0)
        Map<String, String> perfectFilters = new HashMap<>(baseFilters);
        perfectFilters.put("percentFilter", "perfect");
        perfectFilters.put("sortColumn", "student_name");
        perfectFilters.put("sortDirection", "ASC");
        Map<String, Object> perfectRes = (Map<String, Object>) getAttendanceReport(perfectFilters);

        // Lowest attendance
        Map<String, String> lowestFilters = new HashMap<>(baseFilters);
        lowestFilters.put("sortColumn", "percentage");
        lowestFilters.put("sortDirection", "ASC");
        Map<String, Object> lowestRes = (Map<String, Object>) getAttendanceReport(lowestFilters);

        // Frequently absent (highest absent count)
        Map<String, String> absentFilters = new HashMap<>(baseFilters);
        absentFilters.put("sortColumn", "absent_count");
        absentFilters.put("sortDirection", "DESC");
        Map<String, Object> absentRes = (Map<String, Object>) getAttendanceReport(absentFilters);

        // Consecutive Absentees
        String consecutiveSql = "SELECT s.id, s.name, b.batch_name, consec_count " +
            "FROM ( " +
            "  SELECT student_id, MAX(consec_count) as consec_count FROM ( " +
            "    SELECT student_id, status, COUNT(*) as consec_count FROM ( " +
            "      SELECT student_id, status, " +
            "      ROW_NUMBER() OVER (PARTITION BY student_id ORDER BY attendance_date) - " +
            "      ROW_NUMBER() OVER (PARTITION BY student_id, status ORDER BY attendance_date) AS grp " +
            "      FROM attendance " +
            "      WHERE (tenant_id = :tenantId OR :tenantId = 'SYSTEM') " +
            "    ) t " +
            "    WHERE status = 'absent' " +
            "    GROUP BY student_id, grp " +
            "  ) t2 GROUP BY student_id " +
            ") consec " +
            "JOIN students s ON consec.student_id = s.id " +
            "LEFT JOIN batches b ON s.batch_id = b.id " +
            "ORDER BY consec_count DESC LIMIT 5";
        jakarta.persistence.Query consecQuery = entityManager.createNativeQuery(consecutiveSql);
        consecQuery.setParameter("tenantId", tenantId);
        List<Object[]> consecRows = consecQuery.getResultList();
        List<Map<String, Object>> consecutiveAbsentees = consecRows.stream().map(row -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("student_id", ((Number) row[0]).longValue());
            map.put("student_name", row[1]);
            map.put("batch_name", row[2] != null ? row[2] : "N/A");
            map.put("consec_count", ((Number) row[3]).longValue());
            return map;
        }).collect(Collectors.toList());

        // Monthly comparison
        String monthlySql = "SELECT " +
            "DATE_FORMAT(attendance_date, '%b %Y') as month_label, " +
            "ROUND((SUM(CASE WHEN status = 'present' THEN 1 ELSE 0 END) * 100.0) / COUNT(*), 2) as val, " +
            "DATE_FORMAT(attendance_date, '%Y-%m') as sort_label " +
            "FROM attendance " +
            "WHERE attendance_date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH) " +
            "AND (tenant_id = :tenantId OR :tenantId = 'SYSTEM') " +
            "GROUP BY month_label, sort_label " +
            "ORDER BY sort_label ASC";
        jakarta.persistence.Query monthlyQuery = entityManager.createNativeQuery(monthlySql);
        monthlyQuery.setParameter("tenantId", tenantId);
        List<Object[]> monthlyRows = monthlyQuery.getResultList();
        List<Map<String, Object>> monthlyComparison = monthlyRows.stream().map(row -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("month", row[0]);
            map.put("percentage", ((Number) row[1]).doubleValue());
            return map;
        }).collect(Collectors.toList());

        Map<String, Object> analytics = new HashMap<>();
        analytics.put("perfectAttendance", perfectRes.get("content"));
        analytics.put("lowestAttendance", lowestRes.get("content"));
        analytics.put("frequentlyAbsent", absentRes.get("content"));
        analytics.put("consecutiveAbsentees", consecutiveAbsentees);
        analytics.put("monthlyComparison", monthlyComparison);
        return analytics;
    }

    // 5. BATCH PERFORMANCE
    public List<BatchPerformanceDTO> getBatchPerformance(Map<String, String> filters) {
        String tenantId = TenantContext.getTenantId();
        List<Object[]> stats = examSubmissionRepo.getBatchPerformanceStats(tenantId);
        
        return stats.stream().map(row -> {
            Long batchId = ((Number) row[0]).longValue();
            String batchName = (String) row[1];
            Double avgScore = ((Number) row[2]).doubleValue();
            Long totalSub = ((Number) row[3]).longValue();
            
            Batch b = batchRepo.findById(batchId).orElse(null);
            Course c = b != null ? courseRepo.findById(b.getCourseId()).orElse(null) : null;

            return BatchPerformanceDTO.builder()
                    .batch_name(batchName)
                    .course_name(c != null ? c.getName() : "N/A")
                    .avg_score(avgScore)
                    .students_participated(totalSub)
                    .build();
        }).collect(Collectors.toList());
    }

    // 6. COURSE REVENUE INDEX
    public List<CourseRevenueDTO> getCourseRevenue(Map<String, String> filters) {
        DateRange range = parseRange(filters);
        String tenantId = TenantContext.getTenantId();
        
        List<Object[]> revData = receiptRepo.getCourseWiseRevenue(range.from, range.to, tenantId);
        
        return revData.stream().map(row -> {
            Long courseId = ((Number) row[0]).longValue();
            BigDecimal totalRev = (BigDecimal) row[1];
            
            Course c = courseRepo.findById(courseId).orElse(null);
            if (c == null) return null;
            
            return CourseRevenueDTO.builder()
                    .name(c.getName())
                    .enrollment_count(studentRepo.countByCourseId(courseId))
                    .total_revenue(totalRev)
                    .build();
        })
        .filter(Objects::nonNull)
        .collect(Collectors.toList());
    }

    // 7. ENROLLMENT TRENDS
    public List<EnrollmentTrendDTO> getEnrollmentTrends(Map<String, String> filters, String tenantId) {
        DateRange range = parseRange(filters);
        List<Object[]> trends = studentRepo.getMonthlyEnrollmentTrends(range.from, range.to, tenantId);
        
        return trends.stream().map(row -> EnrollmentTrendDTO.builder()
                .month((String) row[0])
                .count(((Number) row[1]).longValue())
                .build())
                .collect(Collectors.toList());
    }

    // 8. STUDENT MAP
    public List<StudentMapDTO> getStudentMap(Map<String, String> filters) {
        List<Student> students = studentRepo.findAll();
        Map<String, Long> districtCounts = students.stream()
                .filter(s -> s.getDistrict() != null)
                .collect(Collectors.groupingBy(Student::getDistrict, Collectors.counting()));
        
        return districtCounts.entrySet().stream()
                .map(e -> StudentMapDTO.builder()
                        .region(e.getKey())
                        .student_count(e.getValue())
                        .build())
                .collect(Collectors.toList());
    }

    // 9. AUDIT LOGS
    public List<AuditLogDTO> getAuditLogs(Map<String, String> filters) {
        DateRange range = parseRange(filters);
        List<ActivityLog> logs = activityLogRepo.findByCreatedAtBetweenOrderByCreatedAtDesc(range.from.atStartOfDay(), range.to.atTime(23, 59, 59));
        
        return logs.stream().map(log -> AuditLogDTO.builder()
                .created_at(log.getCreatedAt())
                .user_type(log.getUserType())
                .user_name(log.getUserId() != null ? "User " + log.getUserId() : "System")
                .action(log.getAction())
                .description(log.getDescription())
                .build())
                .collect(Collectors.toList());
    }

    // 10. STAFF WORKLOG
    public List<StaffWorklogDTO> getStaffWorklog(Map<String, String> filters) {
        List<Staff> staffList = staffRepo.findAll();
        
        return staffList.stream().map(s -> StaffWorklogDTO.builder()
                .name(s.getName())
                .classes_taken(attendanceRepo.countByStaffId(s.getId()))
                .exams_created(examRepo.countByCreatedBy(s.getId()))
                .system_activities(activityLogRepo.countByUserIdAndUserType(s.getId(), "staff"))
                .build())
                .collect(Collectors.toList());
    }

    private BigDecimal calculateTotalOverdue() {
        BigDecimal totalOverdue = BigDecimal.ZERO;
        List<Fee> allFees = feeRepo.findAll();
        for (Fee fee : allFees) {
            if (fee.getStudentId() != null) {
                Optional<Student> studentOpt = studentRepo.findById(fee.getStudentId());
                if (studentOpt.isPresent()) {
                    Student student = studentOpt.get();
                    if (student.getCourseId() != null) {
                        Optional<Course> courseOpt = courseRepo.findById(student.getCourseId());
                        if (courseOpt.isPresent()) {
                            BigDecimal overdue = InstituteService.calculateFeeOverdue(student, courseOpt.get(), fee);
                            if (overdue != null) {
                                totalOverdue = totalOverdue.add(overdue);
                            }
                        }
                    }
                }
            }
        }
        return totalOverdue;
    }

    public Map<String, Object> getDashboardStats(Map<String, String> filters) {
        BigDecimal feeOverdue = calculateTotalOverdue();
        if (filters == null || filters.isEmpty()) {
            Map<String, Object> stats = new LinkedHashMap<>();
            stats.put("totalStudents", studentRepo.count());
            stats.put("activeStudents", studentRepo.countByStatus("active"));
            stats.put("completedStudents", studentRepo.countByStatus("completed"));
            stats.put("totalBatches", batchRepo.count());
            stats.put("totalCourses", courseRepo.count());
            stats.put("totalFeesCollected", feeRepo.sumAllPaidAmounts());
            stats.put("feeOverdue", feeOverdue);
            return stats;
        }

        DateRange range = parseRange(filters);
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalStudents", studentRepo.countByCreatedAtBetween(range.from.atStartOfDay(), range.to.atTime(23, 59, 59))); 
        stats.put("activeStudents", studentRepo.countByStatus("active"));
        stats.put("completedStudents", studentRepo.countByStatus("completed"));
        stats.put("totalBatches", batchRepo.count());
        stats.put("totalCourses", courseRepo.count());
        stats.put("totalFeesCollected", receiptRepo.sumAmountPaidBetween(range.from, range.to));
        stats.put("feeOverdue", feeOverdue);
        
        // Simple AI Insight: Growth Comparison
        BigDecimal currentRevenue = (BigDecimal) stats.get("totalFeesCollected");
        BigDecimal prevRevenue = receiptRepo.sumAmountPaidBetween(range.from.minusMonths(1), range.from.minusDays(1));
        if (currentRevenue == null) {
            currentRevenue = BigDecimal.ZERO;
        }
        if (prevRevenue != null && prevRevenue.compareTo(BigDecimal.ZERO) > 0) {
            double growth = currentRevenue.subtract(prevRevenue)
                    .divide(prevRevenue, 4, java.math.RoundingMode.HALF_UP)
                    .multiply(BigDecimal.valueOf(100))
                    .doubleValue();
            stats.put("growthInsight", (growth >= 0 ? "+" : "") + String.format("%.1f", growth) + "% growth vs last month");
        } else {
            stats.put("growthInsight", "Stable revenue this month");
        }
        
        return stats;
    }

    public List<Map<String, Object>> getRecentActivities() {
        return activityLogRepo.findTop100ByOrderByCreatedAtDesc().stream().map(log -> {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", log.getId());
            map.put("type", log.getAction() != null && log.getAction().contains("Fee") ? "fee_payment" :
                            log.getAction() != null && log.getAction().contains("Student") ? "enrollment" : "attendance");
            map.put("description", log.getDescription());
            map.put("timestamp", log.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    public List<Map<String, Object>> getUpcomingDeadlines() {
        List<Map<String, Object>> result = new ArrayList<>();
        feeRepo.findAll().stream()
            .filter(f -> f.getBalanceAmount() != null && f.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0)
            .forEach(f -> studentRepo.findById(f.getStudentId()).ifPresent(s -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("type", "fee");
                map.put("label", "Fee Due: " + s.getName());

                // Compute period-aware payable amount
                BigDecimal displayAmount = f.getBalanceAmount();
                String periodLabel = "Pending Balance";
                if (s.getCourseId() != null) {
                    var courseOpt = courseRepo.findById(s.getCourseId());
                    if (courseOpt.isPresent()) {
                        Course course = courseOpt.get();
                        BigDecimal periodPayable = InstituteService.calculateThisPeriodPayable(s, course, f);
                        displayAmount = periodPayable;
                        String feePeriod = course.getFeePeriod() != null ? course.getFeePeriod().toLowerCase().trim() : "course";
                        if (feePeriod.contains("month")) periodLabel = "This Month Due";
                        else if (feePeriod.contains("week")) periodLabel = "This Week Due";
                        else if (feePeriod.contains("day")) periodLabel = "Today Due";
                        else if (feePeriod.contains("year")) periodLabel = "This Year Due";
                        else periodLabel = "Pending Balance";
                    }
                }

                // Skip if current period is fully paid
                if (displayAmount.compareTo(BigDecimal.ZERO) <= 0) return;

                map.put("detail", periodLabel + ": ₹" + displayAmount);
                map.put("urgency", displayAmount.compareTo(new BigDecimal("5000")) > 0 ? "high" : "medium");
                result.add(map);
            }));
        return result;
    }

    public Map<String, Object> getDayBookData(LocalDate date) {
        Map<String, Object> data = new LinkedHashMap<>();

        // 1. Staff Attendance (login and logout times)
        List<Map<String, Object>> staffAttendanceList = new ArrayList<>();
        List<StaffAttendance> attendances = staffAttendanceRepo.findByAttendanceDate(date);
        for (StaffAttendance sa : attendances) {
            Map<String, Object> saMap = new LinkedHashMap<>();
            saMap.put("id", sa.getId());
            saMap.put("staffId", sa.getStaffId());
            saMap.put("loginTime", sa.getLoginTime());
            saMap.put("logoutTime", sa.getLogoutTime());
            staffRepo.findById(sa.getStaffId()).ifPresent(s -> {
                saMap.put("staffName", s.getName());
                saMap.put("role", s.getDesignation());
            });
            staffAttendanceList.add(saMap);
        }
        data.put("staffAttendance", staffAttendanceList);

        // 2. Scheduled Classes with staff name
        List<Map<String, Object>> scheduledClassesList = new ArrayList<>();
        List<ScheduledClass> classes = scheduledClassRepo.findByClassDateOrderByStartTimeAsc(date);
        for (ScheduledClass sc : classes) {
            Map<String, Object> scMap = new LinkedHashMap<>();
            scMap.put("id", sc.getId());
            scMap.put("topic", sc.getTopic());
            scMap.put("startTime", sc.getStartTime());
            scMap.put("endTime", sc.getEndTime());
            scMap.put("status", sc.getStatus());
            scMap.put("batchId", sc.getBatchId());
            scMap.put("studentId", sc.getStudentId());
            scMap.put("staffId", sc.getStaffId());
            staffRepo.findById(sc.getStaffId()).ifPresent(s -> scMap.put("staffName", s.getName()));
            if (sc.getBatchId() != null) {
                batchRepo.findById(sc.getBatchId()).ifPresent(b -> scMap.put("batchName", b.getBatchName()));
            }
            if (sc.getStudentId() != null) {
                studentRepo.findById(sc.getStudentId()).ifPresent(st -> scMap.put("studentName", st.getName()));
            }
            scheduledClassesList.add(scMap);
        }
        data.put("scheduledClasses", scheduledClassesList);

        // 3. Exams Conducted Today
        List<Map<String, Object>> examsList = new ArrayList<>();
        List<Exam> exams = examRepo.findByExamDateAndIsDeleted(date, 0);
        for (Exam e : exams) {
            Map<String, Object> eMap = new LinkedHashMap<>();
            eMap.put("id", e.getId());
            eMap.put("title", e.getTitle());
            eMap.put("duration", e.getDurationMinutes());
            eMap.put("totalMarks", e.getTotalMarks());
            eMap.put("examType", e.getExamType());
            if (e.getCourseId() != null) {
                courseRepo.findById(e.getCourseId()).ifPresent(c -> eMap.put("courseName", c.getName()));
            }
            examsList.add(eMap);
        }
        data.put("exams", examsList);

        // 4. Student Attendance Percentage
        List<Attendance> studentAtt = attendanceRepo.findByAttendanceDate(date);
        long totalAtt = studentAtt.size();
        long presentAtt = studentAtt.stream().filter(a -> "present".equalsIgnoreCase(a.getStatus())).count();
        long absentAtt = totalAtt - presentAtt;
        double percentage = totalAtt > 0 ? (presentAtt * 100.0 / totalAtt) : 0.0;
        Map<String, Object> attSummary = new LinkedHashMap<>();
        attSummary.put("total", totalAtt);
        attSummary.put("present", presentAtt);
        attSummary.put("absent", absentAtt);
        attSummary.put("percentage", percentage);
        data.put("studentAttendance", attSummary);

        // 5. Today Joined Students
        List<Map<String, Object>> joinedList = new ArrayList<>();
        List<Student> joinedStudents = studentRepo.findByJoiningDate(date);
        for (Student s : joinedStudents) {
            Map<String, Object> sMap = new LinkedHashMap<>();
            sMap.put("id", s.getId());
            sMap.put("name", s.getName());
            sMap.put("regNumber", s.getRegNumber());
            sMap.put("mobile", s.getMobile());
            if (s.getCourseId() != null) {
                courseRepo.findById(s.getCourseId()).ifPresent(c -> sMap.put("courseName", c.getName()));
            }
            joinedList.add(sMap);
        }
        data.put("joinedStudents", joinedList);

        // 6. Fees Alerted Students List
        List<Map<String, Object>> alertedList = new ArrayList<>();
        List<Fee> alertedFees = feeRepo.findByReminderDateAndIsReminderEnabled(date, 1);
        for (Fee f : alertedFees) {
            Map<String, Object> fMap = new LinkedHashMap<>();
            fMap.put("id", f.getId());
            fMap.put("balanceAmount", f.getBalanceAmount());
            fMap.put("totalAmount", f.getTotalAmount());
            studentRepo.findById(f.getStudentId()).ifPresent(s -> {
                fMap.put("studentName", s.getName());
                fMap.put("regNumber", s.getRegNumber());
                fMap.put("mobile", s.getMobile());
            });
            alertedList.add(fMap);
        }
        data.put("feeAlerts", alertedList);

        // 7. Batches Created/Started today
        List<Map<String, Object>> batchList = new ArrayList<>();
        List<Batch> allBatches = batchRepo.findAll();
        for (Batch b : allBatches) {
            boolean isStarted = date.equals(b.getStartDate());
            boolean isCreated = b.getCreatedAt() != null && date.equals(b.getCreatedAt().toLocalDate());
            if (isStarted || isCreated) {
                Map<String, Object> bMap = new LinkedHashMap<>();
                bMap.put("id", b.getId());
                bMap.put("batchName", b.getBatchName());
                bMap.put("status", b.getStatus());
                bMap.put("action", isCreated && isStarted ? "Created & Started" : (isCreated ? "Created" : "Started"));
                if (b.getCourseId() != null) {
                    courseRepo.findById(b.getCourseId()).ifPresent(c -> bMap.put("courseName", c.getName()));
                }
                batchList.add(bMap);
            }
        }
        data.put("batches", batchList);

        // 8. Students who paid fees today
        List<Map<String, Object>> receiptsList = new ArrayList<>();
        List<Receipt> receipts = receiptRepo.findByPaymentDate(date);
        BigDecimal totalCollected = BigDecimal.ZERO;
        for (Receipt r : receipts) {
            Map<String, Object> rMap = new LinkedHashMap<>();
            rMap.put("receiptNo", r.getReceiptNo());
            rMap.put("amountPaid", r.getAmountPaid());
            rMap.put("paymentMethod", r.getPaymentMethod());
            totalCollected = totalCollected.add(r.getAmountPaid());
            studentRepo.findById(r.getStudentId()).ifPresent(s -> {
                rMap.put("studentName", s.getName());
                rMap.put("regNumber", s.getRegNumber());
            });
            receiptsList.add(rMap);
        }
        Map<String, Object> feesCollected = new LinkedHashMap<>();
        feesCollected.put("totalCollected", totalCollected);
        feesCollected.put("transactions", receiptsList);
        data.put("feesCollected", feesCollected);

        // 9. Any expense today
        List<Map<String, Object>> expensesList = new ArrayList<>();
        List<Expense> expenses = expenseRepo.findByExpenseDate(date);
        BigDecimal totalExpense = BigDecimal.ZERO;
        for (Expense e : expenses) {
            Map<String, Object> eMap = new LinkedHashMap<>();
            eMap.put("id", e.getId());
            eMap.put("title", e.getTitle());
            eMap.put("category", e.getCategory());
            eMap.put("amount", e.getAmount());
            eMap.put("paymentMethod", e.getPaymentMethod());
            totalExpense = totalExpense.add(e.getAmount());
            expensesList.add(eMap);
        }
        Map<String, Object> expensesSummary = new LinkedHashMap<>();
        expensesSummary.put("totalExpense", totalExpense);
        expensesSummary.put("items", expensesList);
        data.put("expenses", expensesSummary);

        return data;
    }

    /**
     * Returns fee reminders that are due today or overdue (past dates).
     * Used for the dashboard popup notification on admin login.
     */
    public List<Map<String, Object>> getDueReminders() {
        LocalDate today = LocalDate.now();
        List<Map<String, Object>> result = new ArrayList<>();

        // Find all fees with reminders enabled
        List<Fee> allFees = feeRepo.findAll();
        for (Fee f : allFees) {
            if (f.getIsReminderEnabled() == null || f.getIsReminderEnabled() != 1) continue;
            if (f.getReminderDate() == null) continue;
            if (f.getReminderDate().isAfter(today)) continue; // not yet due
            if (f.getBalanceAmount() == null || f.getBalanceAmount().compareTo(BigDecimal.ZERO) <= 0) continue;

            studentRepo.findById(f.getStudentId()).ifPresent(s -> {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("studentId", s.getId());
                map.put("studentName", s.getName());
                map.put("regNumber", s.getRegNumber());
                map.put("reminderDate", f.getReminderDate().toString());
                map.put("balanceAmount", f.getBalanceAmount());

                // Period-aware due amount
                BigDecimal dueAmount = f.getBalanceAmount();
                String courseName = "";
                String periodLabel = "Due";
                if (s.getCourseId() != null) {
                    var courseOpt = courseRepo.findById(s.getCourseId());
                    if (courseOpt.isPresent()) {
                        Course course = courseOpt.get();
                        courseName = course.getName();
                        BigDecimal periodPayable = InstituteService.calculateThisPeriodPayable(s, course, f);
                        if (periodPayable.compareTo(BigDecimal.ZERO) > 0) {
                            dueAmount = periodPayable;
                        }
                        String feePeriod = course.getFeePeriod() != null ? course.getFeePeriod().toLowerCase().trim() : "course";
                        if (feePeriod.contains("month")) periodLabel = "This Month";
                        else if (feePeriod.contains("week")) periodLabel = "This Week";
                        else if (feePeriod.contains("day")) periodLabel = "Today";
                        else if (feePeriod.contains("year")) periodLabel = "This Year";
                    }
                }
                map.put("courseName", courseName);
                map.put("dueAmount", dueAmount);
                map.put("periodLabel", periodLabel);
                map.put("isOverdue", f.getReminderDate().isBefore(today));

                result.add(map);
            });
        }
        return result;
    }
}
