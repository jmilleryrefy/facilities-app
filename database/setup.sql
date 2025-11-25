-- Facility Requests Database Setup
-- Run this script as MySQL root user

-- Create the database
CREATE DATABASE IF NOT EXISTS facility_requests CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- ============================================
-- LOCALHOST ADMIN USER (Full Permissions)
-- ============================================
-- This user has ALL privileges and can only connect from localhost
-- Use this for database administration, migrations, and maintenance

CREATE USER IF NOT EXISTS 'facility_admin'@'localhost' IDENTIFIED BY 'CHANGE_THIS_ADMIN_PASSWORD';

-- Grant all privileges on the facility_requests database
GRANT ALL PRIVILEGES ON facility_requests.* TO 'facility_admin'@'localhost';

-- Grant ability to create/drop databases (for testing/dev)
GRANT CREATE, DROP ON *.* TO 'facility_admin'@'localhost';

-- ============================================
-- WEB APPLICATION USER (Limited Permissions)
-- ============================================
-- This user has only CRUD operations and can connect remotely
-- Use this for the web application connection

CREATE USER IF NOT EXISTS 'facility_web'@'%' IDENTIFIED BY 'CHANGE_THIS_WEB_PASSWORD';

-- Grant only necessary privileges for application operations
GRANT SELECT, INSERT, UPDATE, DELETE ON facility_requests.* TO 'facility_web'@'%';

-- Grant CREATE and ALTER for Prisma migrations (comment out after initial setup if desired)
GRANT CREATE, ALTER, INDEX, REFERENCES ON facility_requests.* TO 'facility_web'@'%';

-- Note: facility_web CANNOT:
-- - DROP tables
-- - TRUNCATE tables
-- - DROP database
-- - Modify other databases
-- - Create/delete users
-- - Manage permissions

-- ============================================
-- Apply Changes
-- ============================================
FLUSH PRIVILEGES;

-- ============================================
-- Verify Users Created
-- ============================================
SELECT User, Host,
       IF(password_last_changed IS NOT NULL, 'Yes', 'No') as Has_Password
FROM mysql.user
WHERE User IN ('facility_admin', 'facility_web')
ORDER BY User, Host;

-- ============================================
-- Show Grants (Verify Permissions)
-- ============================================
SHOW GRANTS FOR 'facility_admin'@'localhost';
SHOW GRANTS FOR 'facility_web'@'%';
