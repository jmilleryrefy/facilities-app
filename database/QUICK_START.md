# Database Quick Start Guide

## Overview

This guide will help you set up the database with secure user accounts in 5 minutes.

## Two User Accounts

### 1. Admin Account (`facility_admin@localhost`)
- **Purpose:** Database administration, running migrations
- **Access:** Localhost only (secure)
- **Permissions:** Full database control
- **Use for:** Initial setup, schema changes, backups

### 2. Web Application Account (`facility_web@%`)
- **Purpose:** Web application database access
- **Access:** Remote connections allowed
- **Permissions:** CRUD operations only (no DROP, TRUNCATE)
- **Use for:** Production application

## Setup Steps

### Step 1: Choose Strong Passwords

Generate secure passwords:
```bash
# Admin password
openssl rand -base64 24

# Web password
openssl rand -base64 24
```

**Save these passwords** - you'll need them in Step 3.

### Step 2: Create Database and Users

Edit `database/setup.sql` and replace:
- `CHANGE_THIS_ADMIN_PASSWORD` with admin password from Step 1
- `CHANGE_THIS_WEB_PASSWORD` with web password from Step 1

Run the setup:
```bash
mysql -h 100.71.177.68 -u root -p < database/setup.sql
```

**Expected output:**
```
Query OK, 1 row affected
Query OK, 0 rows affected
Query OK, 0 rows affected
...
```

Verify users were created:
```sql
SELECT User, Host FROM mysql.user WHERE User LIKE 'facility_%';
```

Should show:
```
+----------------+-----------+
| User           | Host      |
+----------------+-----------+
| facility_admin | localhost |
| facility_web   | %         |
+----------------+-----------+
```

### Step 3: Configure Application

Edit `.env` file:

**For initial setup:**
```env
DATABASE_URL="mysql://facility_admin:YOUR_ADMIN_PASSWORD@localhost:3306/facility_requests"
```

Replace `YOUR_ADMIN_PASSWORD` with the password from Step 1.

### Step 4: Run Database Migrations

Create the database schema:
```bash
npx prisma db push
```

**Expected output:**
```
✔ Generated Prisma Client
🚀 Your database is now in sync with your schema.
```

### Step 5: Switch to Web User (Production)

After migrations complete, update `.env`:
```env
DATABASE_URL="mysql://facility_web:YOUR_WEB_PASSWORD@100.71.177.68:3306/facility_requests"
```

Replace `YOUR_WEB_PASSWORD` with the password from Step 1.

### Step 6: (Optional) Lock Down Web User

For maximum security, revoke schema modification from web user:
```bash
mysql -h 100.71.177.68 -u root -p < database/revoke-migration-privileges.sql
```

Now `facility_web` can ONLY:
- SELECT (read data)
- INSERT (create records)
- UPDATE (modify records)
- DELETE (remove records)

## Verification

### Test Admin Connection
```bash
mysql -h localhost -u facility_admin -p facility_requests
```

Try a privileged operation:
```sql
SHOW CREATE TABLE users;
```

Should work ✓

### Test Web Connection
```bash
mysql -h 100.71.177.68 -u facility_web -p facility_requests
```

Try CRUD operations:
```sql
SELECT * FROM users LIMIT 1;  -- Should work ✓
```

Try destructive operation:
```sql
DROP TABLE users;  -- Should fail ✗
```

Expected error:
```
ERROR 1142 (42000): DROP command denied to user 'facility_web'@'%' for table 'users'
```

## Workflow Summary

```
Initial Setup (localhost):
  facility_admin → Run migrations → Create tables

Production (remote):
  facility_web → Application uses → CRUD only
```

## Common Issues

### "Access denied for user 'facility_admin'@'100.71.177.68'"
- Admin user can only connect from localhost
- SSH into the server first, then connect to MySQL

### "Host is not allowed to connect"
- Check MySQL `bind-address` in my.cnf
- Verify firewall allows port 3306
- Ensure `facility_web` user has `@'%'` host

### Migrations fail with "Access denied"
- Ensure using `facility_admin` in DATABASE_URL
- Verify admin has CREATE, ALTER privileges

### Application can't connect
- Ensure using `facility_web` in production DATABASE_URL
- Check password is correct
- Verify web user has SELECT, INSERT, UPDATE, DELETE

## Password Management

### Change Admin Password
```sql
ALTER USER 'facility_admin'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

Update `.env` when running migrations.

### Change Web Password
```sql
ALTER USER 'facility_web'@'%' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

Update `.env` and restart application.

### Rotate Passwords (Recommended: Every 90 days)
1. Generate new password: `openssl rand -base64 24`
2. Update MySQL user
3. Update `.env` file
4. Restart application
5. Test connection

## Security Checklist

- [ ] Strong passwords used (minimum 16 characters)
- [ ] Passwords stored in `.env` (not committed to git)
- [ ] Admin user localhost-only (cannot connect remotely)
- [ ] Web user has minimal permissions (CRUD only)
- [ ] Schema modification revoked from web user (after setup)
- [ ] Regular password rotation scheduled
- [ ] Database backups configured
- [ ] SSL/TLS enabled for remote connections

## Next Steps

1. Complete application `.env` configuration
2. Run `npm run build`
3. Test authentication with Microsoft Entra ID
4. Deploy to production

For detailed information, see `database/README.md`.
