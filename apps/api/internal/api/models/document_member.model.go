package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DocumentMember represents a member of a collaborative document
type DocumentMember struct {
	ID         string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	DocumentID string         `gorm:"not null;type:varchar(36);index:idx_document_member" json:"documentId"`
	UserID     string         `gorm:"not null;type:varchar(36);index:idx_document_member" json:"userId"`
	Permission string         `gorm:"type:varchar(20);not null;default:'view'" json:"permission"` // "owner", "edit", "view"
	JoinedAt   time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"joinedAt"`
	CreatedAt  time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt  time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Document CollabDocument `gorm:"foreignKey:DocumentID" json:"-"`
	User     User           `gorm:"foreignKey:UserID" json:"user,omitempty"`
}

// TableName overrides the table name
func (DocumentMember) TableName() string {
	return "document_members"
}

// BeforeCreate hook to generate UUID-based ID
func (dm *DocumentMember) BeforeCreate(tx *gorm.DB) error {
	if dm.ID == "" {
		dm.ID = uuid.New().String()
	}
	return nil
}
