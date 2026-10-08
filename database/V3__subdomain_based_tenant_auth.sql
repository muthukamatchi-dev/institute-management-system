-- ============================================================
-- IMS SaaS — V3: Subdomain-Based Multi-Tenant Authentication
-- Adds subdomain column to tenants table for URL-based tenant routing
-- ============================================================

-- 1. Add subdomain column (unique, lowercase, URL-safe)
ALTER TABLE `tenants` ADD COLUMN IF NOT EXISTS `subdomain` VARCHAR(63) DEFAULT NULL UNIQUE
    COMMENT 'Unique subdomain identifier (e.g., abcschool for abcschool.classivo.app)';

ALTER TABLE `tenants` ADD INDEX IF NOT EXISTS `idx_tenant_subdomain` (`subdomain`);

-- 2. Auto-populate subdomain from existing tenant_code (lowercase, sanitized)
-- Convert tenant_code to lowercase, replace non-alphanumeric with hyphen
UPDATE `tenants`
SET `subdomain` = LOWER(REPLACE(REPLACE(`tenant_code`, '_', '-'), ' ', '-'))
WHERE `subdomain` IS NULL AND `tenant_code` IS NOT NULL AND `tenant_code` != 'DEFAULT';

-- For DEFAULT tenant, set subdomain to 'default'
UPDATE `tenants`
SET `subdomain` = 'default'
WHERE `tenant_code` = 'DEFAULT' AND (`subdomain` IS NULL OR `subdomain` = '');

-- 3. Update existing test tenants with proper subdomains
UPDATE `tenants`
SET `subdomain` = 'inst-01'
WHERE `tenant_code` = 'INST-01' AND (`subdomain` IS NULL OR `subdomain` = '');

-- ============================================================
-- NOTE: After running this migration, set subdomain to NOT NULL
-- once all existing tenants have subdomains populated.
-- ALTER TABLE `tenants` MODIFY COLUMN `subdomain` VARCHAR(63) NOT NULL;
-- ============================================================
