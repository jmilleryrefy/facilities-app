# Database Setup Guide

## Database User Accounts

This application uses two separate database accounts for security:

### 1. Admin Account (localhost only)
- **User:** `facility_admin@localhost`
- **Permissions:** Full access (ALL PRIVILEGES)
- **Usage:** Database administration, running migrations, backups
- **Can connect from:** localhost only
- **Can:** Create/drop tables, modify schema, manage data

### 2. Web Application Account (remote access)
- **User:** `facility_web@%`
- **Permissions:** Limited to necessary operations
- **Usage:** Web application database connection
- **Can connect from:** Any host
- **Can:** SELECT, INSERT, UPDATE, DELETE (CRUD operations)
- **Cannot:** DROP tables, TRUNCATE, modify schema (after initial setup)

## Setup Instructions

### Step 1: Create Database and Users

Connect to MySQL as root:
```bash
mysql -h 100.71.177.68 -u root -p
```

Run the setup script:
```bash
mysql -h 100.71.177.68 -u root -p < database/setup.sql
```

Or manually:
```sql
source /path/to/database/setup.sql
```

**IMPORTANT:** Edit `setup.sql` first and change the default passwords:
- `CHANGE_THIS_ADMIN_PASSWORD` → Strong password for admin
- `CHANGE_THIS_WEB_PASSWORD` → Strong password for web app

### Step 2: Configure Environment Variables

For **initial setup and migrations**, use the admin account:
```env
# .env (during setup)
DATABASE_URL="mysql://facility_admin:ADMIN_PASSWORD@localhost:3306/facility_requests"
```

Run Prisma migrations:
```bash
npx prisma db push
```

### Step 3: Switch to Web User for Production

After migrations are complete, update `.env` to use the web user:
```env
# .env (production)
DATABASE_URL="mysql://facility_web:WEB_PASSWORD@100.71.177.68:3306/facility_requests"
```

### Step 4: (Optional) Further Restrict Web User

After initial setup, you can remove schema modification privileges from the web user:

```bash
mysql -h 100.71.177.68 -u root -p < database/revoke-migration-privileges.sql
```

This ensures the web application can only perform CRUD operations.

## Security Best Practices

### Password Requirements
- Use strong, unique passwords (minimum 16 characters)
- Include uppercase, lowercase, numbers, and symbols
- Store passwords securely (use environment variables, never commit)
- Rotate passwords periodically (every 90 days)

### Generate Secure Passwords
```bash
# Generate random password
openssl rand -base64 24
```

### Connection Security
- Admin user: localhost only - cannot be accessed remotely
- Web user: Use strong password, consider IP restrictions if possible
- Enable SSL/TLS for database connections in production

### Principle of Least Privilege
The web application user has minimal permissions:
- ✅ Can read/write data (SELECT, INSERT, UPDATE, DELETE)
- ✅ Can modify schema during migrations (CREATE, ALTER)
- ❌ Cannot drop tables or database
- ❌ Cannot truncate tables
- ❌ Cannot manage users or permissions
- ❌ Cannot access other databases

## Monitoring & Maintenance

### Check Current Permissions
```sql
-- Show grants for admin user
SHOW GRANTS FOR 'facility_admin'@'localhost';

-- Show grants for web user
SHOW GRANTS FOR 'facility_web'@'%';
```

### View Active Connections
```sql
SELECT User, Host, db, Command, Time, State
FROM information_schema.processlist
WHERE db = 'facility_requests';
```

### Audit Failed Login Attempts
```sql
-- Check error log for failed authentication
-- Location varies by MySQL installation
```

## Backup & Recovery

### Creating Backups (use admin account)
```bash
# Full database backup
mysqldump -h localhost -u facility_admin -p facility_requests > backup_$(date +%Y%m%d_%H%M%S).sql

# Schema only
mysqldump -h localhost -u facility_admin -p --no-data facility_requests > schema_backup.sql

# Data only
mysqldump -h localhost -u facility_admin -p --no-create-info facility_requests > data_backup.sql
```

### Restoring from Backup
```bash
mysql -h localhost -u facility_admin -p facility_requests < backup_file.sql
```

## Troubleshooting

### Web User Cannot Connect
```sql
-- Check if user exists and has correct host
SELECT User, Host FROM mysql.user WHERE User = 'facility_web';

-- Verify permissions
SHOW GRANTS FOR 'facility_web'@'%';

-- Check if password is correct (try resetting)
ALTER USER 'facility_web'@'%' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Migrations Failing
- Ensure using `facility_admin` account for migrations
- Check admin account has CREATE, ALTER privileges
- Verify connection from localhost

### Permission Denied Errors
```sql
-- If web app needs a specific privilege, grant it carefully:
GRANT LOCK TABLES ON facility_requests.* TO 'facility_web'@'%';
FLUSH PRIVILEGES;
```

## Migration Strategy

### Development
Use admin account for all operations:
```env
DATABASE_URL="mysql://facility_admin:PASSWORD@localhost:3306/facility_requests"
```

### Staging
Use web account, but keep migration privileges:
```env
DATABASE_URL="mysql://facility_web:PASSWORD@staging-host:3306/facility_requests"
```

### Production
Two options:

**Option 1: Manual migrations (more secure)**
1. Run migrations with admin account
2. Use web account for application
3. Web account has no schema modification rights

**Option 2: Automated migrations (less secure but convenient)**
1. Keep CREATE, ALTER privileges for web account
2. Application can run migrations on startup
3. Higher risk if application is compromised

## User Management

### Change Password
```sql
-- Admin user
ALTER USER 'facility_admin'@'localhost' IDENTIFIED BY 'new_strong_password';

-- Web user
ALTER USER 'facility_web'@'%' IDENTIFIED BY 'new_strong_password';

FLUSH PRIVILEGES;
```

### Delete Users (if needed)
```sql
DROP USER IF EXISTS 'facility_admin'@'localhost';
DROP USER IF EXISTS 'facility_web'@'%';
```

### Restrict Web User by IP (optional)
```sql
-- Create user that can only connect from specific IP
CREATE USER 'facility_web'@'192.168.1.100' IDENTIFIED BY 'password';
GRANT SELECT, INSERT, UPDATE, DELETE ON facility_requests.* TO 'facility_web'@'192.168.1.100';

-- Remove unrestricted user
DROP USER 'facility_web'@'%';
```

## Database Schema

The application uses these tables:
- `users` - User accounts and profiles
- `accounts` - OAuth account linkages
- `sessions` - Active user sessions
- `verification_tokens` - Email verification tokens
- `facility_requests` - Facility maintenance requests
- `request_responses` - Admin responses to requests

All tables are created automatically by Prisma migrations.
