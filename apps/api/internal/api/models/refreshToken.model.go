package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// RefreshToken represents a refresh token for maintaining user sessions
type RefreshToken struct {
	ID        string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID    string         `gorm:"not null;type:varchar(36);index" json:"userId"`
	Token     string         `gorm:"uniqueIndex;not null;type:varchar(512)" json:"token"`
	ExpiresAt time.Time      `gorm:"not null" json:"expiresAt"`
	CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	RevokedAt *time.Time     `gorm:"index" json:"revokedAt,omitempty"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

// TableName overrides the table name
func (RefreshToken) TableName() string {
	return "refresh_tokens"
}

// BeforeCreate hook to generate UUID-based ID
func (rt *RefreshToken) BeforeCreate(tx *gorm.DB) error {
	if rt.ID == "" {
		rt.ID = generateRefreshTokenID()
	}
	return nil
}

// IsValid checks if the token is still valid
func (rt *RefreshToken) IsValid() bool {
	now := time.Now()
	return rt.RevokedAt == nil && rt.ExpiresAt.After(now)
}

// Revoke marks the token as revoked
func (rt *RefreshToken) Revoke() {
	now := time.Now()
	rt.RevokedAt = &now
}

// generateRefreshTokenID creates a unique refresh token ID with "rtk_" prefix
func generateRefreshTokenID() string {
	return "rtk_" + strings.ReplaceAll(uuid.New().String(), "-", "")
}
