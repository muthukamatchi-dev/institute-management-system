package com.institute.util;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Component
public class DatabaseSchemaFixer {
    private static final Logger logger = LoggerFactory.getLogger(DatabaseSchemaFixer.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @PostConstruct
    public void fixSchema() {
        logger.info("Initializing DatabaseSchemaFixer...");

        // 1. Fix invalid dates in students table
        try {
            jdbcTemplate.execute("UPDATE students SET dob = NULL WHERE dob = '0000-00-00'");
            jdbcTemplate.execute("UPDATE students SET joining_date = '2000-01-01' WHERE joining_date = '0000-00-00'");
            logger.info("Successfully cleaned up invalid dates in students table.");
        } catch (Exception e) {
            logger.debug("Date cleanup skipped or failed: {}", e.getMessage());
        }

        // 1b. Fix invalid zero dates in exam/template tables from legacy MySQL data
        String[] nullableDateColumns = {
                "question_templates.created_at",
                "question_templates.updated_at",
                "exams.created_at",
                "exams.updated_at",
                "exams.exam_date",
                "external_exams.created_at",
                "external_exams.updated_at",
                "external_exams.exam_date"
        };
        for (String columnRef : nullableDateColumns) {
            try {
                String[] parts = columnRef.split("\\.");
                String table = parts[0];
                String column = parts[1];
                jdbcTemplate.execute("UPDATE " + table + " SET " + column + " = NULL WHERE " + column
                        + " IN ('0000-00-00', '0000-00-00 00:00:00')");
                logger.info("Successfully cleaned invalid zero dates in {}.{}", table, column);
            } catch (Exception e) {
                logger.debug("Zero-date cleanup skipped for {}: {}", columnRef, e.getMessage());
            }
        }

        // 2. Fix AUTO_INCREMENT on key tables
        String[] tables = {
                "activity_log", "notifications", "students", "users", "courses", "batches", "fees", "receipts",
                "expenses", "staff",
                "exams", "exam_questions", "exam_options", "exam_assignments", "exam_submissions", "exam_answers",
                "external_exams", "external_questions", "external_options", "external_participants",
                "external_exam_submissions", "external_submission_answers",
                "question_templates", "template_questions", "template_options", "institute_settings"
        };
        for (String table : tables) {
            try {
                // Try applying both PK and AUTO_INCREMENT
                jdbcTemplate.execute("ALTER TABLE " + table + " MODIFY id BIGINT AUTO_INCREMENT PRIMARY KEY;");
                logger.info("Successfully ensured AUTO_INCREMENT on {}(id)", table);
            } catch (Exception e) {
                try {
                    // Try applying just AUTO_INCREMENT if PK already exists
                    jdbcTemplate.execute("ALTER TABLE " + table + " MODIFY id BIGINT AUTO_INCREMENT;");
                    logger.info("Successfully ensured AUTO_INCREMENT on {}(id) - PK was already set.", table);
                } catch (Exception e2) {
                    logger.debug("Table {} might not need update or doesn't exist: {}", table, e2.getMessage());
                }
            }
        }

        // 2c. Ensure course_id column in batches is nullable for subject-only batches
        try {
            jdbcTemplate.execute("ALTER TABLE batches MODIFY course_id BIGINT NULL");
            logger.info("Successfully ensured batches.course_id is nullable.");
        } catch (Exception e) {
            try {
                jdbcTemplate.execute("ALTER TABLE batches MODIFY COLUMN course_id BIGINT NULL");
            } catch (Exception ignored) {}
        }

        try {
            jdbcTemplate.execute("ALTER TABLE courses ADD COLUMN schedule_type VARCHAR(50) DEFAULT 'Weekdays'");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("ALTER TABLE courses ADD COLUMN custom_days VARCHAR(255) DEFAULT NULL");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("ALTER TABLE courses ADD COLUMN is_online TINYINT(1) DEFAULT 0");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("ALTER TABLE courses ADD COLUMN valid_from DATE DEFAULT NULL");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("ALTER TABLE courses ADD COLUMN valid_to DATE DEFAULT NULL");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("ALTER TABLE institute_settings ADD COLUMN basic_settings TEXT NULL");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("UPDATE institute_settings SET basic_settings = '{\"allowPast\": true, \"allowFuture\": true}' WHERE basic_settings IS NULL OR basic_settings = ''");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("ALTER TABLE institute_settings DROP COLUMN allow_schedule_past_dates");
        } catch (Exception ignored) {
        }
        try {
            jdbcTemplate.execute("ALTER TABLE institute_settings DROP COLUMN allow_schedule_future_dates");
        } catch (Exception ignored) {
        }

        // 3. Ensure student_courses table exists (multi-course enrollment feature)

        try {
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS student_courses (" +
                            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "  student_id BIGINT NOT NULL," +
                            "  course_id BIGINT NOT NULL," +
                            "  batch_id BIGINT DEFAULT NULL," +
                            "  joining_date DATE DEFAULT NULL," +
                            "  status VARCHAR(20) DEFAULT 'active'," +
                            "  selected_subjects TEXT DEFAULT NULL," +
                            "  created_at DATETIME DEFAULT NULL," +
                            "  branch_id BIGINT DEFAULT NULL," +
                            "  tenant_id VARCHAR(100) DEFAULT 'default'," +
                            "  UNIQUE KEY uq_student_course (student_id, course_id, tenant_id)" +
                            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            logger.info("student_courses table ensured.");
            // Backfill student_courses for existing students with a course_id
            jdbcTemplate.execute(
                    "INSERT IGNORE INTO student_courses (student_id, course_id, batch_id, joining_date, status, selected_subjects, created_at, branch_id, tenant_id) "
                            +
                            "SELECT id, course_id, batch_id, joining_date, COALESCE(status, 'active'), selected_subjects, NOW(), branch_id, COALESCE(tenant_id, 'default') "
                            +
                            "FROM students " +
                            "WHERE course_id IS NOT NULL AND course_id > 0");
            logger.info("student_courses backfilled from existing students.");
        } catch (Exception e) {
            logger.debug("student_courses table creation skipped: {}", e.getMessage());
        }

        // 4. Ensure enquiries table exists
        try {
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS enquiries (" +
                            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "  name VARCHAR(150) NOT NULL," +
                            "  mobile VARCHAR(30) DEFAULT NULL," +
                            "  email VARCHAR(150) DEFAULT NULL," +
                            "  address VARCHAR(255) DEFAULT NULL," +
                            "  course_id BIGINT DEFAULT NULL," +
                            "  course_name VARCHAR(150) DEFAULT NULL," +
                            "  enquiry_type VARCHAR(50) DEFAULT 'walk-in'," +
                            "  status VARCHAR(50) DEFAULT 'new'," +
                            "  follow_up_date DATE DEFAULT NULL," +
                            "  assigned_staff_id BIGINT DEFAULT NULL," +
                            "  assigned_staff_name VARCHAR(150) DEFAULT NULL," +
                            "  reference_source VARCHAR(100) DEFAULT NULL," +
                            "  notes TEXT DEFAULT NULL," +
                            "  created_at DATETIME DEFAULT NULL," +
                            "  updated_at DATETIME DEFAULT NULL," +
                            "  branch_id BIGINT DEFAULT NULL," +
                            "  tenant_id VARCHAR(100) DEFAULT 'default'" +
                            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");
            logger.info("enquiries table ensured.");
        } catch (Exception e) {
            logger.debug("enquiries table creation skipped: {}", e.getMessage());
        }

        // 5. Clean up old tenant_storage_configs table and ensure tenant_file_metadata exists
        try {
            jdbcTemplate.execute("DROP TABLE IF EXISTS tenant_storage_configs;");
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS tenant_file_metadata (" +
                            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "  tenant_id VARCHAR(100) NOT NULL DEFAULT 'default'," +
                            "  entity_type VARCHAR(50) NOT NULL," +
                            "  entity_id BIGINT DEFAULT NULL," +
                            "  provider VARCHAR(50) DEFAULT 'LOCAL'," +
                            "  provider_file_id VARCHAR(255) DEFAULT NULL," +
                            "  file_name VARCHAR(255) DEFAULT NULL," +
                            "  mime_type VARCHAR(100) DEFAULT NULL," +
                            "  file_size BIGINT DEFAULT NULL," +
                            "  category VARCHAR(50) DEFAULT NULL," +
                            "  web_view_link TEXT DEFAULT NULL," +
                            "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP" +
                            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;");
            logger.info("Storage tables cleaned up and tenant_file_metadata table ensured.");
        } catch (Exception e) {
            logger.debug("Storage tables setup skipped: {}", e.getMessage());
        }

        // 6. Ensure Professional Programs tables exist
        try {
            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS programs (" +
                            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "  program_code VARCHAR(100) DEFAULT NULL," +
                            "  name VARCHAR(150) NOT NULL," +
                            "  description TEXT," +
                            "  category VARCHAR(100) DEFAULT NULL," +
                            "  total_duration VARCHAR(50) DEFAULT NULL," +
                            "  total_fee DECIMAL(10,2) NOT NULL DEFAULT 0.00," +
                            "  fee_mode VARCHAR(20) NOT NULL DEFAULT 'lump_sum'," +
                            "  status VARCHAR(20) NOT NULL DEFAULT 'active'," +
                            "  image_path VARCHAR(255) DEFAULT NULL," +
                            "  branch_id BIGINT DEFAULT NULL," +
                            "  tenant_id VARCHAR(100) NOT NULL DEFAULT 'default'," +
                            "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
                            "  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                            "  INDEX idx_programs_tenant (tenant_id)" +
                            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS program_modules (" +
                            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "  program_id BIGINT NOT NULL," +
                            "  course_id BIGINT NOT NULL," +
                            "  module_order INT NOT NULL," +
                            "  module_name VARCHAR(150) DEFAULT NULL," +
                            "  is_mandatory TINYINT(1) DEFAULT 1," +
                            "  prerequisite_type VARCHAR(30) NOT NULL DEFAULT 'PREVIOUS_MODULE'," +
                            "  prerequisite_course_id BIGINT DEFAULT NULL," +
                            "  prerequisite_module_id BIGINT DEFAULT NULL," +
                            "  min_attendance_pct INT DEFAULT 0," +
                            "  min_exam_score_pct INT DEFAULT 0," +
                            "  branch_id BIGINT DEFAULT NULL," +
                            "  tenant_id VARCHAR(100) NOT NULL DEFAULT 'default'," +
                            "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
                            "  INDEX idx_pm_program (program_id)" +
                            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS student_program_enrollments (" +
                            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "  student_id BIGINT NOT NULL," +
                            "  program_id BIGINT NOT NULL," +
                            "  enrollment_date DATE NOT NULL," +
                            "  completion_date DATE DEFAULT NULL," +
                            "  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS'," +
                            "  current_module_order INT DEFAULT 1," +
                            "  branch_id BIGINT DEFAULT NULL," +
                            "  tenant_id VARCHAR(100) NOT NULL DEFAULT 'default'," +
                            "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
                            "  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                            "  INDEX idx_spe_student (student_id)" +
                            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            jdbcTemplate.execute(
                    "CREATE TABLE IF NOT EXISTS student_module_progress (" +
                            "  id BIGINT AUTO_INCREMENT PRIMARY KEY," +
                            "  program_enrollment_id BIGINT NOT NULL," +
                            "  program_module_id BIGINT NOT NULL," +
                            "  student_id BIGINT NOT NULL," +
                            "  course_id BIGINT NOT NULL," +
                            "  student_course_id BIGINT DEFAULT NULL," +
                            "  batch_id BIGINT DEFAULT NULL," +
                            "  status VARCHAR(20) NOT NULL DEFAULT 'LOCKED'," +
                            "  unlocked_at DATETIME DEFAULT NULL," +
                            "  started_at DATETIME DEFAULT NULL," +
                            "  completed_at DATETIME DEFAULT NULL," +
                            "  branch_id BIGINT DEFAULT NULL," +
                            "  tenant_id VARCHAR(100) NOT NULL DEFAULT 'default'," +
                            "  created_at DATETIME DEFAULT CURRENT_TIMESTAMP," +
                            "  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP," +
                            "  INDEX idx_smp_enrollment (program_enrollment_id)" +
                            ") ENGINE=InnoDB DEFAULT CHARSET=utf8mb4");

            logger.info("Professional Program tables (programs, program_modules, student_program_enrollments, student_module_progress) ensured.");
        } catch (Exception e) {
            logger.debug("Professional Program tables creation skipped or failed: {}", e.getMessage());
        }

        logger.info("DatabaseSchemaFixer: Schema check completed.");
    }
}
