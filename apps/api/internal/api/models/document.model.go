package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

// DocumentData represents a user's private document
type DocumentData struct {
	ID        string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	UserID    string         `gorm:"not null;type:varchar(36);index:idx_user_document" json:"userId"`
	Title     string         `gorm:"type:varchar(255);default:'Untitled Document'" json:"title"`
	Content   string         `gorm:"type:text;not null" json:"content"` // HTML or JSON string of document content
	CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	User User `gorm:"foreignKey:UserID" json:"-"`
}

// TableName overrides the table name
func (DocumentData) TableName() string {
	return "document_data"
}

// BeforeCreate hook to generate UUID-based ID
func (d *DocumentData) BeforeCreate(tx *gorm.DB) error {
	if d.ID == "" {
		d.ID = uuid.New().String()
	}
	return nil
}

// CollabDocument represents a collaborative document room
type CollabDocument struct {
	ID        string         `gorm:"primaryKey;type:varchar(36)" json:"id"`
	RoomCode  string         `gorm:"uniqueIndex;type:varchar(8);not null" json:"roomCode"`
	Title     string         `gorm:"type:varchar(255);not null;default:'Untitled Document'" json:"title"`
	OwnerID   string         `gorm:"not null;type:varchar(36);index" json:"ownerId"`
	Content   string         `gorm:"type:text;default:''" json:"content"`
	CreatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"createdAt"`
	UpdatedAt time.Time      `gorm:"not null;default:CURRENT_TIMESTAMP" json:"updatedAt"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`

	// Relations
	Owner   User             `gorm:"foreignKey:OwnerID" json:"-"`
	Members []DocumentMember `gorm:"foreignKey:DocumentID" json:"members,omitempty"`
}

// TableName overrides the table name
func (CollabDocument) TableName() string {
	return "collab_documents"
}

// BeforeCreate hook to generate UUID and room code
func (cd *CollabDocument) BeforeCreate(tx *gorm.DB) error {
	if cd.ID == "" {
		cd.ID = uuid.New().String()
	}
	if cd.RoomCode == "" {
		cd.RoomCode = generateDocumentRoomCode()
	}
	return nil
}

// generateDocumentRoomCode creates a unique 8-char alphanumeric room code
func generateDocumentRoomCode() string {
	const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789"
	id := uuid.New()
	bytes := id[:]
	code := make([]byte, 8)
	for i := 0; i < 8; i++ {
		code[i] = chars[int(bytes[i])%len(chars)]
	}
	return string(code)
}
