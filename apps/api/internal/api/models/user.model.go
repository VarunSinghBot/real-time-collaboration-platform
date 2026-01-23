package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// User represents a user in the system
type User struct {
	ID        string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	Username  *string        `gorm:"uniqueIndex;type:varchar(50)" json:"username,omitempty"`
	Name      *string        `gorm:"type:varchar(100)" json:"name,omitempty"`
	Email     string         `gorm:"uniqueIndex;not null;type:varchar(255)" json:"email"`
	Password  *string        `gorm:"type:varchar(255)" json:"-"` // nullable for OAuth users
	GoogleID  *string        `gorm:"uniqueIndex;type:varchar(255)" json:"googleId,omitempty"`
	CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// TableName overrides the table name
func (User) TableName() string {
	return "users"
}

// BeforeCreate hook to generate UUID-based ID
func (u *User) BeforeCreate(tx *gorm.DB) error {
	if u.ID == "" {
		u.ID = generateUserID()
	}
	// Normalize email to lowercase
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
	return nil
}

// BeforeUpdate hook to normalize email
func (u *User) BeforeUpdate(tx *gorm.DB) error {
	u.Email = strings.ToLower(strings.TrimSpace(u.Email))
	return nil
}

// generateUserID creates a unique user ID with "usr_" prefix
func generateUserID() string {
	return "usr_" + strings.ReplaceAll(uuid.New().String(), "-", "")
}
