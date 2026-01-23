# Database Setup Guide

## PostgreSQL Installation & Setup

### 1. Install PostgreSQL

**Windows:**
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use chocolatey:
choco install postgresql
```

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create Database

```bash
# Connect to PostgreSQL
psql -U postgres

# In psql shell:
CREATE DATABASE collab_platform;
CREATE USER collabuser WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE collab_platform TO collabuser;
\q
```

### 3. Configure Environment

Create `.env` file in `apps/api/`:

```env
DATABASE_URL=postgresql://collabuser:your_secure_password@localhost:5432/collab_platform?sslmode=disable
JWT_SECRET=$(openssl rand -base64 32)
PORT=4000
CORS_ORIGIN=http://localhost:3000
GO_ENV=development
```

### 4. Test Connection

```bash
# Test database connection
psql -U collabuser -d collab_platform -h localhost

# Should connect successfully
# Type \q to exit
```

## GORM Schema

The application uses GORM for database management with the following schema:

### Users Table

| Column      | Type         | Constraints                    | Description                    |
|-------------|--------------|--------------------------------|--------------------------------|
| id          | VARCHAR(36)  | PRIMARY KEY                    | UUID-based ID (usr_xxxxx)     |
| username    | VARCHAR(50)  | UNIQUE, NULL                   | Optional unique username       |
| name        | VARCHAR(100) | NULL                           | User's display name            |
| email       | VARCHAR(255) | UNIQUE, NOT NULL               | User's email (normalized)      |
| password    | VARCHAR(255) | NULL                           | Bcrypt hashed password         |
| google_id   | VARCHAR(255) | UNIQUE, NULL                   | Google OAuth ID                |
| created_at  | TIMESTAMP    | NOT NULL, DEFAULT NOW()        | Account creation time          |
| updated_at  | TIMESTAMP    | NOT NULL, DEFAULT NOW()        | Last update time               |
| deleted_at  | TIMESTAMP    | NULL, INDEX                    | Soft delete timestamp          |

### Indexes

- Primary key on `id`
- Unique index on `email`
- Unique index on `username` (when not null)
- Unique index on `google_id` (when not null)
- Index on `deleted_at` for soft deletes

## Auto-Migration

GORM automatically creates/updates the database schema on application startup:

```go
DB.AutoMigrate(&models.User{})
```

This will:
- Create the `users` table if it doesn't exist
- Add missing columns
- Create indexes
- **Note**: Won't delete columns or change types for safety

## Manual Migration (if needed)

```bash
# Connect to database
psql -U collabuser -d collab_platform

# View table structure
\d users

# View all tables
\dt

# View indexes
\di
```

## Connection Pooling

The application uses connection pooling for better performance:

```go
sqlDB.SetMaxIdleConns(10)       // Max idle connections
sqlDB.SetMaxOpenConns(100)      // Max open connections
sqlDB.SetConnMaxLifetime(time.Hour) // Connection lifetime
```

## Running the Application

```bash
cd apps/api

# Install dependencies
go mod download

# Run the server (auto-migrates on startup)
go run cmd/main.go
```

Expected output:
```
Running database migrations...
✅ Connected to database and ran migrations successfully
📊 Database: PostgreSQL
📦 Tables: users
Server running on port 4000
```

## Troubleshooting

### Connection refused
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list               # macOS
Get-Service postgresql*          # Windows
```

### Authentication failed
- Verify username and password in `.env`
- Check `pg_hba.conf` for authentication settings
- Ensure user has proper permissions

### Database doesn't exist
```sql
-- Create it manually
CREATE DATABASE collab_platform;
```

### Port already in use
```bash
# Check what's using port 5432
lsof -i :5432  # macOS/Linux
netstat -ano | findstr :5432  # Windows
```

## Production Considerations

1. **Use strong passwords** for database users
2. **Enable SSL** for database connections (`sslmode=require`)
3. **Set up backups** using `pg_dump`
4. **Monitor connections** and adjust pool settings
5. **Use environment-specific configs** (staging, production)
6. **Enable query logging** for debugging (disable in production)

## Database Backup

```bash
# Backup
pg_dump -U collabuser -d collab_platform > backup.sql

# Restore
psql -U collabuser -d collab_platform < backup.sql
```

## Useful Commands

```sql
-- View all users
SELECT * FROM users;

-- Count users
SELECT COUNT(*) FROM users;

-- Find user by email
SELECT * FROM users WHERE email = 'user@example.com';

-- Delete soft-deleted records
DELETE FROM users WHERE deleted_at IS NOT NULL;

-- Reset auto-increment (if needed)
-- Not applicable as we use UUID-based IDs
```
