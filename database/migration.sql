-- Institute Management System - Database Migration Script
-- Migrated from: CodeIgniter 3 → Spring Boot (JPA/Hibernate)
-- Multi-tenant strategy: Database-per-tenant (no tenant_id column)

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS `roles` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `role_name` VARCHAR(50) NOT NULL UNIQUE,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `tenant_id` VARCHAR(100) DEFAULT 'default'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. USERS TABLE
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `username` VARCHAR(100) NOT NULL UNIQUE,
  `password` VARCHAR(255) NOT NULL,
  `email` VARCHAR(150) NOT NULL UNIQUE,
  `role_id` BIGINT NOT NULL,
  `full_name` VARCHAR(150),
  `status` VARCHAR(20) DEFAULT 'active',
  `token` VARCHAR(255),
  `last_login` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`role_id`) REFERENCES `roles`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. INSTITUTE SETTINGS TABLE
CREATE TABLE IF NOT EXISTS `institute_settings` (
  `id` BIGINT PRIMARY KEY DEFAULT 1,
  `name` VARCHAR(255) NOT NULL,
  `address` TEXT,
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `logo_path` VARCHAR(255),
  `updated_at` DATETIME,
  `reg_prefix` VARCHAR(100),
  `reg_suffix` VARCHAR(100),
  `reg_start_from` VARCHAR(100),
  `reg_mode` VARCHAR(100),
  `reg_last_number` VARCHAR(100),
  `institute_name` VARCHAR(255),
  `registration_id` VARCHAR(100),
  `staff_id_prefix` VARCHAR(100),
  `staff_id_suffix` VARCHAR(100),
  `staff_id_start_from` VARCHAR(100),
  `staff_id_mode` VARCHAR(100),
  `staff_id_last_number` VARCHAR(100),
  `course_id_prefix` VARCHAR(100),
  `course_id_suffix` VARCHAR(100),
  `course_id_start_from` VARCHAR(100),
  `course_id_mode` VARCHAR(100),
  `course_id_last_number` VARCHAR(100),
  `appearance_color` VARCHAR(20),
  `appearance_mode` VARCHAR(20),
  `admin_as_staff` INT DEFAULT 0,
  `allow_performance_exams` INT DEFAULT 0,
  `enable_multiple_branches` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. COURSES TABLE
CREATE TABLE IF NOT EXISTS `courses` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `course_id` VARCHAR(100),
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100),
  `duration` VARCHAR(50),
  `fees` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `status` VARCHAR(20) DEFAULT 'active',
  `syllabus_path` VARCHAR(255),
  `image_path` VARCHAR(255),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 5. BATCHES TABLE
CREATE TABLE IF NOT EXISTS `batches` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `course_id` BIGINT NOT NULL,
  `batch_name` VARCHAR(100) NOT NULL,
  `timing` VARCHAR(100),
  `start_date` DATE,
  `instructor` VARCHAR(100),
  `status` VARCHAR(20) DEFAULT 'upcoming',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 6. STUDENTS TABLE
CREATE TABLE IF NOT EXISTS `students` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(150) NOT NULL,
  `mobile` VARCHAR(15) NOT NULL,
  `email` VARCHAR(150),
  `course_id` BIGINT,
  `batch_id` BIGINT,
  `joining_date` DATE,
  `status` VARCHAR(20) DEFAULT 'active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `reg_number` VARCHAR(100),
  `father_name` VARCHAR(100),
  `parent_mobile` VARCHAR(20),
  `dob` DATE,
  `qualification` VARCHAR(100),
  `referred_by` VARCHAR(100),
  `referral_profession` VARCHAR(100),
  `instructor` VARCHAR(100),
  `timing` VARCHAR(100),
  `start_date` DATE,
  `password` VARCHAR(255),
  `token` VARCHAR(255),
  `last_login` DATETIME,
  `district` VARCHAR(100),
  FOREIGN KEY (`course_id`) REFERENCES `courses`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`batch_id`) REFERENCES `batches`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 7. STAFF TABLE
CREATE TABLE IF NOT EXISTS `staff` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(100) NOT NULL,
  `email` VARCHAR(100),
  `mobile` VARCHAR(20) NOT NULL,
  `qualification` VARCHAR(255),
  `experience` VARCHAR(50),
  `designation` VARCHAR(100),
  `joining_date` DATE,
  `status` VARCHAR(20) DEFAULT 'active',
  `salary` DECIMAL(10,2),
  `staff_id` VARCHAR(100),
  `token` VARCHAR(255),
  `last_login` DATETIME,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 8. FEES TABLE
CREATE TABLE IF NOT EXISTS `fees` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `student_id` BIGINT NOT NULL,
  `total_amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `paid_amount` DECIMAL(10,2) DEFAULT 0.00,
  `balance_amount` DECIMAL(10,2),
  `last_payment_date` DATE,
  `status` VARCHAR(20) DEFAULT 'pending',
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 9. RECEIPTS TABLE
CREATE TABLE IF NOT EXISTS `receipts` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `receipt_no` VARCHAR(50) NOT NULL,
  `student_id` BIGINT NOT NULL,
  `fee_id` BIGINT NOT NULL,
  `amount_paid` DECIMAL(10,2) NOT NULL,
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `payment_date` DATE NOT NULL,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`fee_id`) REFERENCES `fees`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 10. ATTENDANCE TABLE
CREATE TABLE IF NOT EXISTS `attendance` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `student_id` BIGINT NOT NULL,
  `batch_id` BIGINT,
  `attendance_date` DATE NOT NULL,
  `status` VARCHAR(10) NOT NULL DEFAULT 'absent',
  `remarks` TEXT,
  `staff_id` BIGINT,
  `scheduled_class_id` BIGINT,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  UNIQUE KEY `uq_att` (`student_id`, `attendance_date`, `batch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 11. ACTIVITY LOG TABLE
CREATE TABLE IF NOT EXISTS `activity_log` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `user_type` VARCHAR(20),
  `action` VARCHAR(255),
  `description` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 12. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `user_id` BIGINT,
  `user_type` VARCHAR(20) DEFAULT 'all',
  `title` VARCHAR(255),
  `message` TEXT,
  `type` VARCHAR(50),
  `is_read` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 13. SCHEDULED CLASSES TABLE
CREATE TABLE IF NOT EXISTS `scheduled_classes` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `staff_id` BIGINT NOT NULL,
  `batch_id` BIGINT,
  `student_id` BIGINT,
  `topic` VARCHAR(255),
  `class_date` DATE,
  `start_time` VARCHAR(20),
  `end_time` VARCHAR(20),
  `status` VARCHAR(20) DEFAULT 'scheduled',
  `staff_on_leave_id` BIGINT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 14. EXAMS (INTERNAL) TABLE
CREATE TABLE IF NOT EXISTS `exams` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `course_id` BIGINT,
  `total_marks` INT DEFAULT 0,
  `duration_minutes` INT DEFAULT 0,
  `pass_percentage` INT DEFAULT 40,
  `exam_type` VARCHAR(20) DEFAULT 'standard',
  `status` VARCHAR(20) DEFAULT 'draft',
  `exam_date` DATE,
  `created_by` BIGINT,
  `is_deleted` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 15. EXAM QUESTIONS TABLE
CREATE TABLE IF NOT EXISTS `exam_questions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` BIGINT NOT NULL,
  `question_type` VARCHAR(10) DEFAULT 'mcq',
  `question_text` TEXT NOT NULL,
  `marks` INT DEFAULT 1,
  `order_index` INT DEFAULT 0,
  FOREIGN KEY (`exam_id`) REFERENCES `exams`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 16. EXAM OPTIONS TABLE
CREATE TABLE IF NOT EXISTS `exam_options` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `question_id` BIGINT NOT NULL,
  `option_text` TEXT NOT NULL,
  `is_correct` INT DEFAULT 0,
  FOREIGN KEY (`question_id`) REFERENCES `exam_questions`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 17. EXAM ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS `exam_assignments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `expires_at` DATETIME,
  `is_reassigned` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 18. EXAM SUBMISSIONS TABLE
CREATE TABLE IF NOT EXISTS `exam_submissions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` BIGINT NOT NULL,
  `student_id` BIGINT,
  `participant_id` BIGINT,
  `start_time` DATETIME,
  `end_time` DATETIME,
  `total_score` DECIMAL(10,2) DEFAULT 0.00,
  `is_evaluated` INT DEFAULT 0,
  `attempt_number` INT DEFAULT 1,
  `status` VARCHAR(20) DEFAULT 'ongoing'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 19. EXAM SUBMISSION ANSWERS TABLE
CREATE TABLE IF NOT EXISTS `exam_submission_answers` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` BIGINT NOT NULL,
  `question_id` BIGINT NOT NULL,
  `selected_option_id` BIGINT,
  `answer_text` TEXT,
  `marks_obtained` DECIMAL(10,2) DEFAULT 0.00,
  `is_correct` INT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 20. EXTERNAL EXAMS TABLE
CREATE TABLE IF NOT EXISTS `external_exams` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE,
  `description` TEXT,
  `course_id` BIGINT,
  `total_marks` INT DEFAULT 0,
  `duration_minutes` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'draft',
  `exam_type` VARCHAR(20) DEFAULT 'standard',
  `pass_percentage` INT DEFAULT 40,
  `exam_date` DATE,
  `created_by` BIGINT,
  `results_published` INT DEFAULT 0,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 21-26. External exam sub-tables
CREATE TABLE IF NOT EXISTS `external_questions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` BIGINT NOT NULL,
  `question_type` VARCHAR(10) DEFAULT 'mcq',
  `question_text` TEXT NOT NULL,
  `marks` INT DEFAULT 1,
  `order_index` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `external_options` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `question_id` BIGINT NOT NULL,
  `option_text` TEXT NOT NULL,
  `is_correct` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `external_participants` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` BIGINT NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `email` VARCHAR(255) NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `mobile` VARCHAR(20),
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `external_exam_submissions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `exam_id` BIGINT NOT NULL,
  `participant_id` BIGINT NOT NULL,
  `score` DECIMAL(10,2) DEFAULT 0.00,
  `submitted_at` DATETIME,
  `is_evaluated` INT DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'submitted',
  `attempt_number` INT DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `external_submission_answers` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `submission_id` BIGINT NOT NULL,
  `question_id` BIGINT NOT NULL,
  `selected_option_id` BIGINT,
  `answer_text` TEXT,
  `is_correct` INT DEFAULT 0,
  `marks_obtained` DECIMAL(10,2) DEFAULT 0.00
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 27. STUDY MATERIALS TABLE
CREATE TABLE IF NOT EXISTS `study_materials` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `course_id` BIGINT NOT NULL,
  `file_url` VARCHAR(500),
  `file_name` VARCHAR(255),
  `file_type` VARCHAR(100),
  `target_type` VARCHAR(20) DEFAULT 'all',
  `target_ids` TEXT,
  `uploaded_by` BIGINT,
  `uploaded_by_type` VARCHAR(20) DEFAULT 'admin',
  `uploaded_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 28. STUDY MATERIAL ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS `study_material_assignments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `material_id` BIGINT NOT NULL,
  `target_type` VARCHAR(20) DEFAULT 'batch',
  `target_id` BIGINT NOT NULL,
  `assigned_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 29. EXPENSES TABLE
CREATE TABLE IF NOT EXISTS `expenses` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `category` VARCHAR(100) NOT NULL,
  `amount` DECIMAL(15,2) NOT NULL,
  `expense_date` DATE NOT NULL,
  `description` TEXT,
  `reference_no` VARCHAR(100),
  `payment_method` VARCHAR(50) DEFAULT 'Cash',
  `created_by` BIGINT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 30. CUSTOM FIELDS TABLE
CREATE TABLE IF NOT EXISTS `custom_fields` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `location` VARCHAR(50) NOT NULL,
  `field_label` VARCHAR(255) NOT NULL,
  `field_type` VARCHAR(20) DEFAULT 'text',
  `is_required` INT DEFAULT 0,
  `options` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 31. CUSTOM FIELD VALUES TABLE
CREATE TABLE IF NOT EXISTS `custom_field_values` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `field_id` BIGINT NOT NULL,
  `entity_id` BIGINT NOT NULL,
  `field_value` TEXT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME,
  FOREIGN KEY (`field_id`) REFERENCES `custom_fields`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 32. QUESTION TEMPLATES TABLE (Question Bank)
CREATE TABLE IF NOT EXISTS `question_templates` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `course_id` BIGINT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `template_questions` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `template_id` BIGINT NOT NULL,
  `question_type` VARCHAR(10) DEFAULT 'mcq',
  `question_text` TEXT NOT NULL,
  `marks` INT DEFAULT 1,
  `order_index` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS `template_options` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `question_id` BIGINT NOT NULL,
  `option_text` TEXT NOT NULL,
  `is_correct` INT DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ===============================================
-- Seed Data
-- ===============================================
INSERT INTO `roles` (`role_name`) VALUES ('Super Admin'), ('Admin'), ('Staff'), ('Student');
INSERT INTO `users` (`username`, `password`, `email`, `role_id`, `full_name`, `status`) VALUES ('admin', 'admin123', 'admin@institute.com', 2, 'Administrator', 'active');
INSERT INTO `institute_settings` (`id`, `name`, `institute_name`, `email`, `phone`) VALUES (1, 'Institute', 'My Institute', 'info@institute.com', '1234567890');

-- ===============================================
-- Branch Support Upgrade (run on existing DBs)
-- ===============================================

-- Branches table
CREATE TABLE IF NOT EXISTS `branches` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `code` VARCHAR(50),
  `address` TEXT,
  `phone` VARCHAR(20),
  `email` VARCHAR(100),
  `is_main` TINYINT(1) DEFAULT 0,
  `status` VARCHAR(20) DEFAULT 'Active',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add enable_multiple_branches to institute_settings
ALTER TABLE `institute_settings`
  ADD COLUMN IF NOT EXISTS `enable_multiple_branches` INT DEFAULT 0;

-- Add branch_id to all entity tables
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `students` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `staff` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `courses` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `batches` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `fees` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `receipts` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `attendance` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `scheduled_classes` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `exams` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `external_exams` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `expenses` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `study_materials` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;
ALTER TABLE `notifications` ADD COLUMN IF NOT EXISTS `branch_id` BIGINT NULL;

-- Seed: Insert a default Main Branch (only if branches table is empty)
INSERT INTO `branches` (`name`, `code`, `is_main`, `status`)
  SELECT 'Main Branch', 'MAIN', 1, 'Active'
  WHERE NOT EXISTS (SELECT 1 FROM `branches` LIMIT 1);

