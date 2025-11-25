-- Revoke Migration Privileges from Web User
-- Run this AFTER initial database setup and migrations are complete
-- This further restricts the web user to only CRUD operations

-- This script removes the ability for facility_web to:
-- - CREATE new tables
-- - ALTER existing tables
-- - CREATE/DROP indexes
-- - Modify foreign key references

USE facility_requests;

-- Revoke schema modification privileges
REVOKE CREATE, ALTER, INDEX, REFERENCES ON facility_requests.* FROM 'facility_web'@'%';

FLUSH PRIVILEGES;

-- Verify current privileges (should only show SELECT, INSERT, UPDATE, DELETE)
SHOW GRANTS FOR 'facility_web'@'%';

-- Expected result:
-- GRANT USAGE ON *.* TO `facility_web`@`%`
-- GRANT SELECT, INSERT, UPDATE, DELETE ON `facility_requests`.* TO `facility_web`@`%`
