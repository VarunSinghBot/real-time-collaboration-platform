package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WhiteboardMember represents a user's membership in a collaborative whiteboard
type WhiteboardMember struct {
	ID           string    `gorm:"primaryKey;type:varchar(36)" json:"id"`
	WhiteboardID string    `gorm:"not null;type:varchar(36);uniqueIndex:idx_wb_user" json:"whiteboardId"`
	UserID       string    `gorm:"not null;type:varchar(36);uniqueIndex:idx_wb_user;index" json:"userId"`
	Permission   string    `gorm:"not null;type:varchar(10);default:'view'" json:"permission"` // "edit" or "view"
	CreatedAt    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt    time.Time `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`

	// Relations
	Whiteboard CollabWhiteboard `gorm:"foreignKey:WhiteboardID" json:"-"`
	User       User             `gorm:"foreignKey:UserID" json:"-"`
}

// TableName overrides the table name
func (WhiteboardMember) TableName() string {
	return "whiteboard_members"
}

// BeforeCreate hook to generate UUID-based ID
func (wm *WhiteboardMember) BeforeCreate(tx *gorm.DB) error {
	if wm.ID == "" {
		wm.ID = uuid.New().String()
	}
	return nil
}
