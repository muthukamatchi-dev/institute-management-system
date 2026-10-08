-- ============================================================
-- Classivo IMS - Database Migration Script V4
-- Professional Programs / Structured Course Programs
-- Safe to run on existing databases (non-destructive)
-- ============================================================

-- 1. PROGRAMS TABLE
CREATE TABLE IF NOT EXISTS `programs` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `program_code` VARCHAR(100) DEFAULT NULL,
  `name` VARCHAR(150) NOT NULL,
  `description` TEXT,
  `category` VARCHAR(100) DEFAULT NULL,
  `total_duration` VARCHAR(50) DEFAULT NULL,
  `total_fee` DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  `fee_mode` VARCHAR(20) NOT NULL DEFAULT 'lump_sum',
  `status` VARCHAR(20) NOT NULL DEFAULT 'active',
  `image_path` VARCHAR(255) DEFAULT NULL,
  `branch_id` BIGINT DEFAULT NULL,
  `tenant_id` VARCHAR(100) NOT NULL DEFAULT 'default',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_programs_tenant` (`tenant_id`),
  INDEX `idx_programs_branch` (`branch_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 2. PROGRAM MODULES TABLE
CREATE TABLE IF NOT EXISTS `program_modules` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `program_id` BIGINT NOT NULL,
  `course_id` BIGINT NOT NULL,
  `module_order` INT NOT NULL,
  `module_name` VARCHAR(150) DEFAULT NULL,
  `is_mandatory` TINYINT(1) DEFAULT 1,
  `prerequisite_type` VARCHAR(30) NOT NULL DEFAULT 'PREVIOUS_MODULE',
  `prerequisite_course_id` BIGINT DEFAULT NULL,
  `prerequisite_module_id` BIGINT DEFAULT NULL,
  `min_attendance_pct` INT DEFAULT 0,
  `min_exam_score_pct` INT DEFAULT 0,
  `branch_id` BIGINT DEFAULT NULL,
  `tenant_id` VARCHAR(100) NOT NULL DEFAULT 'default',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX `idx_pm_program` (`program_id`),
  INDEX `idx_pm_course` (`course_id`),
  INDEX `idx_pm_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 3. STUDENT PROGRAM ENROLLMENTS TABLE
CREATE TABLE IF NOT EXISTS `student_program_enrollments` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `student_id` BIGINT NOT NULL,
  `program_id` BIGINT NOT NULL,
  `enrollment_date` DATE NOT NULL,
  `completion_date` DATE DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS',
  `current_module_order` INT DEFAULT 1,
  `branch_id` BIGINT DEFAULT NULL,
  `tenant_id` VARCHAR(100) NOT NULL DEFAULT 'default',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_spe_student` (`student_id`),
  INDEX `idx_spe_program` (`program_id`),
  INDEX `idx_spe_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- 4. STUDENT MODULE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS `student_module_progress` (
  `id` BIGINT AUTO_INCREMENT PRIMARY KEY,
  `program_enrollment_id` BIGINT NOT NULL,
  `program_module_id` BIGINT NOT NULL,
  `student_id` BIGINT NOT NULL,
  `course_id` BIGINT NOT NULL,
  `student_course_id` BIGINT DEFAULT NULL,
  `batch_id` BIGINT DEFAULT NULL,
  `status` VARCHAR(20) NOT NULL DEFAULT 'LOCKED',
  `unlocked_at` DATETIME DEFAULT NULL,
  `started_at` DATETIME DEFAULT NULL,
  `completed_at` DATETIME DEFAULT NULL,
  `branch_id` BIGINT DEFAULT NULL,
  `tenant_id` VARCHAR(100) NOT NULL DEFAULT 'default',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX `idx_smp_enrollment` (`program_enrollment_id`),
  INDEX `idx_smp_student` (`student_id`),
  INDEX `idx_smp_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
