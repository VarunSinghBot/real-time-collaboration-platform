package models

import (
	"strings"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// OAuthProvider represents an OAuth provider connection for a user
type OAuthProvider struct {
	ID         string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID     string         `gorm:"not null;type:varchar(36);index" json:"userId"`
	Provider   string         `gorm:"not null;type:varchar(50);index" json:"provider"` // google, github, etc.
	ProviderID string         `gorm:"not null;type:varchar(255)" json:"providerId"`
	Email      *string        `gorm:"type:varchar(255)" json:"email,omitempty"`
	Name       *string        `gorm:"type:varchar(100)" json:"name,omitempty"`
	Avatar     *string        `gorm:"type:text" json:"avatar,omitempty"`
	CreatedAt  time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt  time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User User `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
}

// TableName overrides the table name
func (OAuthProvider) TableName() string {
	return "oauth_providers"
}

// BeforeCreate hook to generate UUID-based ID
func (op *OAuthProvider) BeforeCreate(tx *gorm.DB) error {
	if op.ID == "" {
		op.ID = generateOAuthProviderID()
	}
	return nil
}

// generateOAuthProviderID creates a unique OAuth provider ID with "oap_" prefix
func generateOAuthProviderID() string {
	return "oap_" + strings.ReplaceAll(uuid.New().String(), "-", "")
}
