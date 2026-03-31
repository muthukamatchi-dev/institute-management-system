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
                jdbcTemplate.execute("UPDATE " + table + " SET " + column + " = NULL WHERE " + column + " IN ('0000-00-00', '0000-00-00 00:00:00')");
                logger.info("Successfully cleaned invalid zero dates in {}.{}", table, column);
            } catch (Exception e) {
                logger.debug("Zero-date cleanup skipped for {}: {}", columnRef, e.getMessage());
            }
        }

        // 2. Fix AUTO_INCREMENT on key tables
        String[] tables = {
            "activity_log", "notifications", "students", "users", "courses", "batches", "fees", "receipts", "expenses", "staff",
            "exams", "exam_questions", "exam_options", "exam_assignments", "exam_submissions", "exam_answers",
            "external_exams", "external_questions", "external_options", "external_participants", "external_exam_submissions", "external_submission_answers",
            "question_templates", "template_questions", "template_options"
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
        logger.info("DatabaseSchemaFixer: Schema check completed.");
    }
}
