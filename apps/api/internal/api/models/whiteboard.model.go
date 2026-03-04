package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// WhiteboardData represents a user's private whiteboard state
type WhiteboardData struct {
	ID        string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID    string         `gorm:"not null;type:varchar(36);index:idx_user_whiteboard" json:"userId"`
	Name      string         `gorm:"type:varchar(255);default:'Private Board'" json:"name"`
	Data      string         `gorm:"type:text;not null" json:"data"` // JSON string of whiteboard state
	CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName overrides the table name
func (WhiteboardData) TableName() string {
	return "whiteboard_data"
}

// BeforeCreate hook to generate UUID-based ID
func (w *WhiteboardData) BeforeCreate(tx *gorm.DB) error {
	if w.ID == "" {
		w.ID = uuid.New().String()
	}
	return nil
}

// CollabWhiteboard represents a collaborative whiteboard room
type CollabWhiteboard struct {
	ID        string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	RoomCode  string         `gorm:"uniqueIndex;type:varchar(8);not null" json:"roomCode"`
	Title     string         `gorm:"type:varchar(255);not null;default:'Untitled Whiteboard'" json:"title"`
	OwnerID   string         `gorm:"not null;type:varchar(36);index" json:"ownerId"`
	Data      string         `gorm:"type:text;default:'{}'" json:"data"`
	CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Owner   User               `gorm:"foreignKey:OwnerID" json:"-"`
	Members []WhiteboardMember `gorm:"foreignKey:WhiteboardID" json:"members,omitempty"`
}

// TableName overrides the table name
func (CollabWhiteboard) TableName() string {
	return "collab_whiteboards"
}

// BeforeCreate hook to generate UUID and room code
func (cw *CollabWhiteboard) BeforeCreate(tx *gorm.DB) error {
	if cw.ID == "" {
		cw.ID = uuid.New().String()
	}
	if cw.RoomCode == "" {
		cw.RoomCode = generateRoomCode()
	}
	return nil
}

// generateRoomCode creates a unique 8-char alphanumeric room code
func generateRoomCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
	id := uuid.New()
	bytes := id[:]
	code := make([]byte, 8)
	for i := 0; i < 8; i++ {
		code[i] = chars[int(bytes[i])%len(chars)]
	}
	return string(code)
}
