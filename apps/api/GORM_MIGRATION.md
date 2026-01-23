# Migration from Prisma to GORM

This document outlines the migration from Prisma to GORM.

## Changes Made

### 1. Database Connection (`db.go`)
- **Before**: Used Prisma Client with `db.NewClient()` and manual connect/disconnect
- **After**: Uses GORM with PostgreSQL driver
- **New**: Auto-migration on startup with `DB.AutoMigrate(&models.User{})`

### 2. Models
- **Before**: Generated from `prisma/schema.prisma`
- **After**: Defined as Go structs in `internal/api/models/user.go`
- **Benefits**: Type-safe, no code generation needed, better IDE support

### 3. Queries
- **Before**: Prisma fluent API
  ```go
  user, err := prismaClient.User.FindUnique(
      db.User.Email.Equals(email),
  ).Exec(ctx)
  ```
- **After**: GORM query builder
  ```go
  var user models.User
  err := db.Where("email = ?", email).First(&user).Error
  ```

### 4. Benefits of GORM

1. **No Code Generation**: Models are regular Go structs
2. **Auto-Migration**: Automatic schema management
3. **Better Performance**: Direct SQL queries, connection pooling
4. **Rich Ecosystem**: Many plugins and extensions
5. **Soft Deletes**: Built-in support with `DeletedAt` field
6. **Hooks**: BeforeCreate, AfterCreate, etc.
7. **Associations**: Easy relationship management

## Running the Application

```bash
# Install dependencies
go mod download

# Create .env file
cp .env.example .env

# Edit .env with your database credentials
# DATABASE_URL="postgresql://username:password@localhost:5432/dbname?sslmode=disable"

# Run the server (auto-migrates on startup)
go run cmd/main.go
```

## Testing

The API endpoints remain the same:
- POST `/api/auth/signup`
- POST `/api/auth/login`
- GET `/api/auth/me` (protected)

Frontend integration is unchanged - the API contract is identical.
