package com.institute.service;

import com.institute.model.*;
import com.institute.repository.*;
import org.springframework.stereotype.Service;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.*;

/**
 * Reports Service
 * Line-by-line migration of: Reports_model.php (183 lines)
 */
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

    public ReportsService(StudentRepository studentRepo, BatchRepository batchRepo,
                          CourseRepository courseRepo, FeeRepository feeRepo,
                          ReceiptRepository receiptRepo, ExpenseRepository expenseRepo,
                          AttendanceRepository attendanceRepo, ActivityLogRepository activityLogRepo,
                          StaffRepository staffRepo) {
        this.studentRepo = studentRepo;
        this.batchRepo = batchRepo;
        this.courseRepo = courseRepo;
        this.feeRepo = feeRepo;
        this.receiptRepo = receiptRepo;
        this.expenseRepo = expenseRepo;
        this.attendanceRepo = attendanceRepo;
        this.activityLogRepo = activityLogRepo;
        this.staffRepo = staffRepo;
    }

    /**
     * Migrated from: Reports_model.php -> get_dashboard_stats() + Reports.php -> dashboard_stats()
     */
    public Map<String, Object> getDashboardStats() {
        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalStudents", studentRepo.count());
        stats.put("activeStudents", studentRepo.countByStatus("active"));
        stats.put("completedStudents", studentRepo.countByStatus("completed"));
        stats.put("totalBatches", batchRepo.count());
        stats.put("totalCourses", courseRepo.count());
        stats.put("totalFeesCollected", feeRepo.sumAllPaidAmounts());
        return stats;
    }

    public List<Map<String, Object>> getRecentActivities() {
        List<ActivityLog> logs = activityLogRepo.findTop100ByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (ActivityLog log : logs) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", log.getId());
            map.put("type", log.getAction() != null && log.getAction().contains("Fee") ? "fee_payment" :
                            log.getAction() != null && log.getAction().contains("Student") ? "enrollment" : "attendance");
            map.put("description", log.getDescription());
            map.put("timestamp", log.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getUpcomingDeadlines() {
        List<Map<String, Object>> result = new ArrayList<>();
        // Students with balance fees
        List<Fee> fees = feeRepo.findAll();
        for (Fee f : fees) {
            if (f.getBalanceAmount() != null && f.getBalanceAmount().compareTo(BigDecimal.ZERO) > 0) {
                studentRepo.findById(f.getStudentId()).ifPresent(s -> {
                    Map<String, Object> map = new LinkedHashMap<>();
                    map.put("type", "fee");
                    map.put("label", "Fee Due: " + s.getName());
                    map.put("detail", "Pending Balance: ₹" + f.getBalanceAmount());
                    map.put("urgency", f.getBalanceAmount().compareTo(new BigDecimal("5000")) > 0 ? "high" : "medium");
                    result.add(map);
                });
            }
        }
        return result;
    }

    public List<Map<String, Object>> getAttendanceReport(Map<String, String> filters) {
        List<Student> students = studentRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Student s : students) {
            long total = attendanceRepo.findByStudentIdOrderByAttendanceDateDesc(s.getId()).size();
            long present = attendanceRepo.countByStudentIdAndStatus(s.getId(), "present");
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("student_id", s.getId());
            map.put("student_name", s.getName());
            map.put("total_sessions", total);
            map.put("present_count", present);
            map.put("absent_count", total - present);
            result.add(map);
        }
        return result;
    }

    /**
     * Migrated from: Reports_model.php -> get_profit_loss()
     */
    public Map<String, Object> getProfitLoss(Map<String, String> filters) {
        LocalDate from = filters.containsKey("date_from") ? LocalDate.parse(filters.get("date_from")) : LocalDate.now().withDayOfMonth(1);
        LocalDate to = filters.containsKey("date_to") ? LocalDate.parse(filters.get("date_to")) : LocalDate.now();

        BigDecimal income = receiptRepo.sumAmountPaidBetween(from, to);
        BigDecimal expenses = expenseRepo.sumAmountBetween(from, to);
        BigDecimal profit = income.subtract(expenses);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("total_income", income);
        result.put("total_expenses", expenses);
        result.put("net_profit", profit);
        result.put("from", from);
        result.put("to", to);
        return result;
    }

    public List<Map<String, Object>> getExpensesReport(Map<String, String> filters) {
        List<Expense> expenses = expenseRepo.findAllByOrderByExpenseDateDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Expense e : expenses) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", e.getId());
            map.put("title", e.getTitle());
            map.put("category", e.getCategory());
            map.put("amount", e.getAmount());
            map.put("expense_date", e.getExpenseDate());
            map.put("payment_method", e.getPaymentMethod());
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getBatchPerformance(Map<String, String> filters) {
        List<Batch> batches = batchRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Batch b : batches) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("batch_name", b.getBatchName());
            map.put("status", b.getStatus());
            map.put("student_count", studentRepo.findByBatchId(b.getId()).size());
            courseRepo.findById(b.getCourseId()).ifPresent(c -> map.put("course_name", c.getName()));
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getCourseRevenue(Map<String, String> filters) {
        List<Course> courses = courseRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Course c : courses) {
            long studentCount = studentRepo.findByCourseId(c.getId()).size();
            BigDecimal totalFees = BigDecimal.ZERO;
            BigDecimal collected = BigDecimal.ZERO;
            for (Student s : studentRepo.findByCourseId(c.getId())) {
                List<Fee> fees = feeRepo.findByStudentId(s.getId());
                if (!fees.isEmpty()) {
                    Fee f = fees.get(0);
                    totalFees = totalFees.add(f.getTotalAmount() != null ? f.getTotalAmount() : BigDecimal.ZERO);
                    collected = collected.add(f.getPaidAmount() != null ? f.getPaidAmount() : BigDecimal.ZERO);
                }
            }
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("course_name", c.getName());
            map.put("student_count", studentCount);
            map.put("total_fees", totalFees);
            map.put("total_revenue", collected);
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getEnrollmentTrends(Map<String, String> filters) {
        LocalDate startDate = LocalDate.now().minusMonths(6).withDayOfMonth(1);
        List<Object[]> trends = studentRepo.getMonthlyEnrollmentTrends(startDate);
        List<Map<String, Object>> result = new ArrayList<>();
        for (Object[] row : trends) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("month", row[0]);
            map.put("count", row[1]);
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getStudentMap(Map<String, String> filters) {
        List<Student> students = studentRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Student s : students) {
            if (s.getDistrict() != null) {
                Map<String, Object> map = new LinkedHashMap<>();
                map.put("district", s.getDistrict());
                map.put("name", s.getName());
                result.add(map);
            }
        }
        return result;
    }

    public List<Map<String, Object>> getAuditLogs(Map<String, String> filters) {
        List<ActivityLog> logs = activityLogRepo.findTop100ByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (ActivityLog log : logs) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("id", log.getId());
            map.put("action", log.getAction());
            map.put("description", log.getDescription());
            map.put("user_type", log.getUserType());
            map.put("created_at", log.getCreatedAt());
            result.add(map);
        }
        return result;
    }

    public List<Map<String, Object>> getStaffWorklog(Map<String, String> filters) {
        List<Staff> staffList = staffRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (Staff s : staffList) {
            Map<String, Object> map = new LinkedHashMap<>();
            map.put("staff_id", s.getStaffId());
            map.put("name", s.getName());
            map.put("classes_taken", attendanceRepo.countByStaffId(s.getId()));
            map.put("activities", activityLogRepo.countByUserIdAndUserType(s.getId(), "staff"));
            result.add(map);
        }
        return result;
    }
}
