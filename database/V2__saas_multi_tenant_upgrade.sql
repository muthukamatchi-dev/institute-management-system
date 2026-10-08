-- ============================================================
-- IMS SaaS Multi-Tenant Upgrade — Migration Script V2
-- Safe to run on existing databases (non-destructive)
-- ============================================================

-- ============================================================
-- 1. TENANTS MASTER TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS `tenants` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `tenant_name` VARCHAR(255) NOT NULL,
  `tenant_code` VARCHAR(50) NOT NULL UNIQUE,
  `domain` VARCHAR(255),
  `database_type` VARCHAR(20) NOT NULL DEFAULT 'shared' COMMENT 'shared or dedicated',
  `database_name` VARCHAR(100) DEFAULT NULL COMMENT 'Only for dedicated mode',
  `admin_email` VARCHAR(255) NOT NULL,
  `admin_phone` VARCHAR(20),
  `status` VARCHAR(20) NOT NULL DEFAULT 'active' COMMENT 'active, inactive, suspended',
  `trial_start_date` DATE,
  `trial_end_date` DATE,
  `is_trial_active` TINYINT(1) DEFAULT 1,
  `max_students` INT DEFAULT 500,
  `max_staff` INT DEFAULT 50,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_tenant_code` (`tenant_code`),
  INDEX `idx_tenant_status` (`status`),
  INDEX `idx_tenant_domain` (`domain`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- 2. ADD tenant_id TO ALL ENTITY TABLES
-- (Default 'default' preserves existing data for backward compatibility)
-- ============================================================

-- Users
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'DEFAULT';
ALTER TABLE `users` ADD INDEX IF NOT EXISTS `idx_users_tenant` (`tenant_id`);

-- Students
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `students` ADD INDEX IF NOT EXISTS `idx_students_tenant` (`tenant_id`);

-- Staff
ALTER TABLE `staff` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `staff` ADD INDEX IF NOT EXISTS `idx_staff_tenant` (`tenant_id`);

-- Courses
ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `courses` ADD INDEX IF NOT EXISTS `idx_courses_tenant` (`tenant_id`);

-- Batches
ALTER TABLE `batches` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `batches` ADD INDEX IF NOT EXISTS `idx_batches_tenant` (`tenant_id`);

-- Fees
ALTER TABLE `fees` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `fees` ADD INDEX IF NOT EXISTS `idx_fees_tenant` (`tenant_id`);

-- Receipts
ALTER TABLE `receipts` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `receipts` ADD INDEX IF NOT EXISTS `idx_receipts_tenant` (`tenant_id`);

-- Attendance
ALTER TABLE `attendance` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `attendance` ADD INDEX IF NOT EXISTS `idx_attendance_tenant` (`tenant_id`);

-- Activity Log
ALTER TABLE `activity_log` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `activity_log` ADD INDEX IF NOT EXISTS `idx_activity_log_tenant` (`tenant_id`);

-- Notifications
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `notifications` ADD INDEX IF NOT EXISTS `idx_notifications_tenant` (`tenant_id`);

-- Scheduled Classes
ALTER TABLE `scheduled_classes` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `scheduled_classes` ADD INDEX IF NOT EXISTS `idx_scheduled_classes_tenant` (`tenant_id`);

-- Exams
ALTER TABLE `exams` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `exams` ADD INDEX IF NOT EXISTS `idx_exams_tenant` (`tenant_id`);

-- External Exams
ALTER TABLE `external_exams` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `external_exams` ADD INDEX IF NOT EXISTS `idx_external_exams_tenant` (`tenant_id`);

-- Exam Questions
ALTER TABLE `exam_questions` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `exam_questions` ADD INDEX IF NOT EXISTS `idx_exam_questions_tenant` (`tenant_id`);

-- Exam Options
ALTER TABLE `exam_options` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `exam_options` ADD INDEX IF NOT EXISTS `idx_exam_options_tenant` (`tenant_id`);

-- Exam Assignments
ALTER TABLE `exam_assignments` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `exam_assignments` ADD INDEX IF NOT EXISTS `idx_exam_assignments_tenant` (`tenant_id`);

-- Exam Submissions
ALTER TABLE `exam_submissions` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `exam_submissions` ADD INDEX IF NOT EXISTS `idx_exam_submissions_tenant` (`tenant_id`);

-- Exam Submission Answers
ALTER TABLE `exam_submission_answers` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `exam_submission_answers` ADD INDEX IF NOT EXISTS `idx_exam_submission_answers_tenant` (`tenant_id`);

-- External Questions
ALTER TABLE `external_questions` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `external_questions` ADD INDEX IF NOT EXISTS `idx_external_questions_tenant` (`tenant_id`);

-- External Options
ALTER TABLE `external_options` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `external_options` ADD INDEX IF NOT EXISTS `idx_external_options_tenant` (`tenant_id`);

-- External Participants
ALTER TABLE `external_participants` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `external_participants` ADD INDEX IF NOT EXISTS `idx_external_participants_tenant` (`tenant_id`);

-- External Exam Submissions
ALTER TABLE `external_exam_submissions` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `external_exam_submissions` ADD INDEX IF NOT EXISTS `idx_external_exam_submissions_tenant` (`tenant_id`);

-- External Submission Answers
ALTER TABLE `external_submission_answers` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `external_submission_answers` ADD INDEX IF NOT EXISTS `idx_external_submission_answers_tenant` (`tenant_id`);

-- Study Materials
ALTER TABLE `study_materials` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `study_materials` ADD INDEX IF NOT EXISTS `idx_study_materials_tenant` (`tenant_id`);

-- Study Material Assignments
ALTER TABLE `study_material_assignments` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `study_material_assignments` ADD INDEX IF NOT EXISTS `idx_study_material_assignments_tenant` (`tenant_id`);

-- Expenses
ALTER TABLE `expenses` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `expenses` ADD INDEX IF NOT EXISTS `idx_expenses_tenant` (`tenant_id`);

-- Custom Fields
ALTER TABLE `custom_fields` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `custom_fields` ADD INDEX IF NOT EXISTS `idx_custom_fields_tenant` (`tenant_id`);

-- Custom Field Values
ALTER TABLE `custom_field_values` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `custom_field_values` ADD INDEX IF NOT EXISTS `idx_custom_field_values_tenant` (`tenant_id`);

-- Question Templates
ALTER TABLE `question_templates` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `question_templates` ADD INDEX IF NOT EXISTS `idx_question_templates_tenant` (`tenant_id`);

-- Template Questions
ALTER TABLE `template_questions` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `template_questions` ADD INDEX IF NOT EXISTS `idx_template_questions_tenant` (`tenant_id`);

-- Template Options
ALTER TABLE `template_options` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `template_options` ADD INDEX IF NOT EXISTS `idx_template_options_tenant` (`tenant_id`);

-- Branches
ALTER TABLE `branches` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'DEFAULT';
ALTER TABLE `branches` ADD INDEX IF NOT EXISTS `idx_branches_tenant` (`tenant_id`);

-- Institute Settings
ALTER TABLE `institute_settings` ADD COLUMN IF NOT EXISTS `tenant_id` VARCHAR(100) DEFAULT 'default';
ALTER TABLE `institute_settings` ADD INDEX IF NOT EXISTS `idx_institute_settings_tenant` (`tenant_id`);

-- Roles
-- roles already has tenant_id from migration.sql

-- ============================================================
-- 3. SEED DEFAULT TENANT
-- ============================================================
INSERT INTO `tenants` (`tenant_name`, `tenant_code`, `database_type`, `admin_email`, `admin_phone`, `status`, `is_trial_active`, `trial_start_date`, `trial_end_date`)
SELECT 'Default Institute', 'DEFAULT', 'shared', 'admin@institute.com', '1234567890', 'active', 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 365 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `tenants` WHERE `tenant_code` = 'DEFAULT' LIMIT 1);

INSERT INTO `tenants` (`tenant_name`, `tenant_code`, `database_type`, `admin_email`, `admin_phone`, `status`, `is_trial_active`, `trial_start_date`, `trial_end_date`)
SELECT 'Test Institute 01', 'INST-01', 'shared', 'admin01@institute.com', '9876543210', 'active', 0, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 365 DAY)
WHERE NOT EXISTS (SELECT 1 FROM `tenants` WHERE `tenant_code` = 'INST-01' LIMIT 1);

-- ============================================================
-- 4. ADD 'Super Admin' ROLE (for platform-wide super admin)
-- Already exists in seed data, but only at tenant level.
-- We ensure the Super Admin role exists.
-- ============================================================
INSERT INTO `roles` (`role_name`, `tenant_id`)
SELECT 'Super Admin', 'SYSTEM'
WHERE NOT EXISTS (SELECT 1 FROM `roles` WHERE `role_name` = 'Super Admin' AND `tenant_id` = 'SYSTEM' LIMIT 1);

-- ============================================================
-- 5. NORMALIZE existing tenant_id values (NULL -> 'DEFAULT')
-- ============================================================
UPDATE `users` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `roles` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `students` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `staff` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `courses` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `batches` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `fees` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `receipts` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `attendance` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `activity_log` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `notifications` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `scheduled_classes` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `exams` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `external_exams` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `exam_questions` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `exam_options` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `exam_assignments` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `exam_submissions` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `exam_submission_answers` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `external_questions` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `external_options` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `external_participants` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `external_exam_submissions` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `external_submission_answers` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `study_materials` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `study_material_assignments` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `expenses` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `custom_fields` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `custom_field_values` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `question_templates` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `template_questions` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `template_options` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `branches` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
UPDATE `institute_settings` SET `tenant_id` = 'DEFAULT' WHERE `tenant_id` IS NULL OR `tenant_id` = 'default';
;

-- ============================================================
-- 6. OPTIONAL: Seed a Super Admin user (default password: admin123)
-- NOTE: Change password immediately after first login.
-- ============================================================
INSERT INTO `users` (`username`, `password`, `email`, `role_id`, `full_name`, `status`, `tenant_id`)
SELECT 'superadmin',
       '$2a$10$OHZebFdw0lhoc.SIrb3MEO.dH3LiS4CzbZzUrR3bkbsdVcDLChpwm',
       'superadmin@system.local',
       r.id,
       'Super Admin',
       'active',
       'SYSTEM'
FROM `roles` r
WHERE r.role_name = 'Super Admin'
  AND r.tenant_id = 'SYSTEM'
  AND NOT EXISTS (SELECT 1 FROM `users` WHERE `username` = 'superadmin' LIMIT 1);
