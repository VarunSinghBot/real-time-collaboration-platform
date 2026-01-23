# Database Schema Documentation

## Users Table Schema

```
┌─────────────────────────────────────────────────────────────┐
│                         USERS TABLE                         │
├──────────────┬──────────────┬─────────────┬─────────────────┤
│ Column       │ Type         │ Constraints │ Description     │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ id           │ VARCHAR(36)  │ PRIMARY KEY │ usr_xxxxx       │
│              │              │             │ (UUID-based)    │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ username     │ VARCHAR(50)  │ UNIQUE      │ Optional        │
│              │              │ NULLABLE    │ unique username │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ name         │ VARCHAR(100) │ NULLABLE    │ Display name    │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ email        │ VARCHAR(255) │ UNIQUE      │ Auto-normalized │
│              │              │ NOT NULL    │ to lowercase    │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ password     │ VARCHAR(255) │ NULLABLE    │ Bcrypt hashed   │
│              │              │             │ (null for OAuth)│
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ google_id    │ VARCHAR(255) │ UNIQUE      │ Google OAuth ID │
│              │              │ NULLABLE    │                 │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ created_at   │ TIMESTAMP    │ NOT NULL    │ UTC timestamp   │
│              │              │ DEFAULT NOW │                 │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ updated_at   │ TIMESTAMP    │ NOT NULL    │ Auto-updated    │
│              │              │ DEFAULT NOW │                 │
├──────────────┼──────────────┼─────────────┼─────────────────┤
│ deleted_at   │ TIMESTAMP    │ NULLABLE    │ Soft delete     │
│              │              │ INDEXED     │                 │
└──────────────┴──────────────┴─────────────┴─────────────────┘
```

## Field Details

### ID Field
- **Type**: UUID-based with `usr_` prefix
- **Format**: `usr_` + 32-character UUID (no hyphens)
- **Example**: `usr_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6`
- **Generation**: Automatic on user creation via GORM hook

### Username Field
- **Optional**: Can be null
- **Unique**: No two users can have the same username
- **Length**: Maximum 50 characters
- **Validation**: Should be done at application level

### Name Field
- **Optional**: Can be null
- **Purpose**: Display name for the user
- **Length**: Maximum 100 characters

### Email Field
- **Required**: Cannot be null
- **Unique**: No duplicates allowed
- **Auto-normalized**: Converted to lowercase and trimmed
- **Validation**: Email format validated at application level

### Password Field
- **Optional**: Null for OAuth users (Google login)
- **Security**: Bcrypt hashed (cost factor 10)
- **Storage**: 255 characters to accommodate hash
- **Never returned**: Excluded from JSON responses (`json:"-"`)

### Google ID
- **Optional**: Only for Google OAuth users
- **Unique**: One Google account = one user
- **Purpose**: Links user to Google account

### Timestamps
- **created_at**: Set once on creation (UTC)
- **updated_at**: Auto-updated on every change (UTC)
- **deleted_at**: Soft delete support (null = active user)

## Indexes

```
PRIMARY KEY: id
UNIQUE INDEX: email
UNIQUE INDEX: username (where username IS NOT NULL)
UNIQUE INDEX: google_id (where google_id IS NOT NULL)
INDEX: deleted_at (for soft delete queries)
```

## GORM Model

```go
type User struct {
    ID        string         `gorm:"primaryKey;type:varchar(36)"`
    Username  *string        `gorm:"uniqueIndex;type:varchar(50)"`
    Name      *string        `gorm:"type:varchar(100)"`
    Email     string         `gorm:"uniqueIndex;not null;type:varchar(255)"`
    Password  *string        `gorm:"type:varchar(255)" json:"-"`
    GoogleID  *string        `gorm:"uniqueIndex;type:varchar(255)"`
    CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP"`
    UpdatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP"`
    DeletedAt gorm.DeletedAt `gorm:"index"`
}
```

## Hooks

### BeforeCreate
```go
func (u *User) BeforeCreate(tx *gorm.DB) error {
    // Generate UUID-based ID
    if u.ID == "" {
        u.ID = generateUserID()
    }
    // Normalize email
    u.Email = strings.ToLower(strings.TrimSpace(u.Email))
    return nil
}
```

### BeforeUpdate
```go
func (u *User) BeforeUpdate(tx *gorm.DB) error {
    // Normalize email on updates
    u.Email = strings.ToLower(strings.TrimSpace(u.Email))
    return nil
}
```

## Example Queries

### Create User (Email/Password)
```go
user := models.User{
    Email:    "user@example.com",
    Password: &hashedPassword,
    Username: &username,
    Name:     &name,
}
db.Create(&user)
```

### Create User (Google OAuth)
```go
user := models.User{
    Email:    "user@gmail.com",
    GoogleID: &googleID,
    Name:     &name,
}
db.Create(&user)
```

### Find User by Email
```go
var user models.User
db.Where("email = ?", email).First(&user)
```

### Find User by Google ID
```go
var user models.User
db.Where("google_id = ?", googleID).First(&user)
```

### Update User
```go
db.Model(&user).Updates(models.User{
    Name: &newName,
})
```

### Soft Delete
```go
db.Delete(&user) // Sets deleted_at to current timestamp
```

### Permanent Delete
```go
db.Unscoped().Delete(&user)
```

### Find All Active Users
```go
var users []models.User
db.Find(&users) // Automatically excludes soft-deleted
```

### Include Soft-Deleted Users
```go
var users []models.User
db.Unscoped().Find(&users)
```

## Constraints & Validation

### Database Level
- Primary key uniqueness
- Email uniqueness
- Username uniqueness (when provided)
- Google ID uniqueness (when provided)
- NOT NULL on required fields

### Application Level (Recommended)
- Email format validation
- Password strength requirements (min length, complexity)
- Username format validation (alphanumeric, length)
- Rate limiting for signup/login

## Migration Strategy

GORM handles migrations automatically with `AutoMigrate()`:
- ✅ Creates new tables
- ✅ Adds new columns
- ✅ Creates indexes
- ❌ Does NOT delete columns (safety)
- ❌ Does NOT change column types (safety)

For major schema changes, use manual migrations or migration tools.
