package controllers

import (
	"collab-platform/api/internal/api/models"
	"collab-platform/api/websocket"
	"encoding/json"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

// --- Request/Response Types ---

type CreateCollabWhiteboardRequest struct {
	Title string `json:"title"`
}

type UpdateCollabWhiteboardRequest struct {
	Title string `json:"title"`
}

type AddMemberRequest struct {
	Email      string `json:"email"`
	Permission string `json:"permission"` // "edit" or "view"
}

type UpdateMemberRequest struct {
	Permission string `json:"permission"` // "edit" or "view"
}

type SaveCollabWhiteboardRequest struct {
	Data string `json:"data"` // JSON string of Tldraw state
}

type CollabWhiteboardResponse struct {
	ID        string `json:"id"`
	RoomCode  string `json:"roomCode"`
	Title     string `json:"title"`
	OwnerID   string `json:"ownerId"`
	OwnerName string `json:"ownerName,omitempty"`
	Data      string `json:"data"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

type WhiteboardListItem struct {
	ID          string `json:"id"`
	RoomCode    string `json:"roomCode"`
	Title       string `json:"title"`
	OwnerID     string `json:"ownerId"`
	OwnerName   string `json:"ownerName"`
	OwnerEmail  string `json:"ownerEmail"`
	Permission  string `json:"permission"` // "owner", "edit", or "view"
	MemberCount int    `json:"memberCount"`
	CreatedAt   string `json:"createdAt"`
	UpdatedAt   string `json:"updatedAt"`
}

type MemberResponse struct {
	ID         string `json:"id"`
	UserID     string `json:"userId"`
	UserName   string `json:"userName"`
	UserEmail  string `json:"userEmail"`
	Permission string `json:"permission"`
	CreatedAt  string `json:"createdAt"`
}

// --- Handlers ---

// CreateCollabWhiteboard creates a new collaborative whiteboard
func CreateCollabWhiteboard(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req CreateCollabWhiteboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		// Allow empty body, default title will be used
		req.Title = "Untitled Whiteboard"
	}

	if req.Title == "" {
		req.Title = "Untitled Whiteboard"
	}

	wb := models.CollabWhiteboard{
		Title:   req.Title,
		OwnerID: userID,
		Data:    "{}",
	}

	if err := db.Create(&wb).Error; err != nil {
		http.Error(w, `{"error": "Failed to create whiteboard"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(CollabWhiteboardResponse{
		ID:        wb.ID,
		RoomCode:  wb.RoomCode,
		Title:     wb.Title,
		OwnerID:   wb.OwnerID,
		Data:      wb.Data,
		CreatedAt: wb.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: wb.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

// ListCollabWhiteboards returns all whiteboards the user owns or is a member of
func ListCollabWhiteboards(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var result []WhiteboardListItem

	// Get owned whiteboards
	var ownedBoards []models.CollabWhiteboard
	db.Where("owner_id = ?", userID).Find(&ownedBoards)

	for _, wb := range ownedBoards {
		var owner models.User
		db.Select("id, name, email").Where("id = ?", wb.OwnerID).First(&owner)

		var memberCount int64
		db.Model(&models.WhiteboardMember{}).Where("whiteboard_id = ?", wb.ID).Count(&memberCount)

		ownerName := ""
		if owner.Name != nil {
			ownerName = *owner.Name
		}

		result = append(result, WhiteboardListItem{
			ID:          wb.ID,
			RoomCode:    wb.RoomCode,
			Title:       wb.Title,
			OwnerID:     wb.OwnerID,
			OwnerName:   ownerName,
			OwnerEmail:  owner.Email,
			Permission:  "owner",
			MemberCount: int(memberCount),
			CreatedAt:   wb.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   wb.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	// Get shared whiteboards (where user is a member)
	var memberships []models.WhiteboardMember
	db.Where("user_id = ?", userID).Find(&memberships)

	for _, m := range memberships {
		var wb models.CollabWhiteboard
		if err := db.Where("id = ?", m.WhiteboardID).First(&wb).Error; err != nil {
			continue
		}

		var owner models.User
		db.Select("id, name, email").Where("id = ?", wb.OwnerID).First(&owner)

		var memberCount int64
		db.Model(&models.WhiteboardMember{}).Where("whiteboard_id = ?", wb.ID).Count(&memberCount)

		ownerName := ""
		if owner.Name != nil {
			ownerName = *owner.Name
		}

		result = append(result, WhiteboardListItem{
			ID:          wb.ID,
			RoomCode:    wb.RoomCode,
			Title:       wb.Title,
			OwnerID:     wb.OwnerID,
			OwnerName:   ownerName,
			OwnerEmail:  owner.Email,
			Permission:  m.Permission,
			MemberCount: int(memberCount),
			CreatedAt:   wb.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
			UpdatedAt:   wb.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	if result == nil {
		result = []WhiteboardListItem{}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// GetCollabWhiteboard returns a single whiteboard by ID (must be owner or member)
func GetCollabWhiteboard(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	whiteboardID := chi.URLParam(r, "id")

	var wb models.CollabWhiteboard
	if err := db.Where("id = ?", whiteboardID).First(&wb).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, `{"error": "Whiteboard not found"}`, http.StatusNotFound)
			return
		}
		http.Error(w, `{"error": "Failed to fetch whiteboard"}`, http.StatusInternalServerError)
		return
	}

	// Check access: owner or member
	if wb.OwnerID != userID {
		var member models.WhiteboardMember
		if err := db.Where("whiteboard_id = ? AND user_id = ?", whiteboardID, userID).First(&member).Error; err != nil {
			http.Error(w, `{"error": "Access denied"}`, http.StatusForbidden)
			return
		}
	}

	var owner models.User
	db.Select("id, name, email").Where("id = ?", wb.OwnerID).First(&owner)
	ownerName := ""
	if owner.Name != nil {
		ownerName = *owner.Name
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(CollabWhiteboardResponse{
		ID:        wb.ID,
		RoomCode:  wb.RoomCode,
		Title:     wb.Title,
		OwnerID:   wb.OwnerID,
		OwnerName: ownerName,
		Data:      wb.Data,
		CreatedAt: wb.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: wb.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

// UpdateCollabWhiteboard updates the whiteboard title (owner only)
func UpdateCollabWhiteboard(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	whiteboardID := chi.URLParam(r, "id")

	var wb models.CollabWhiteboard
	if err := db.Where("id = ? AND owner_id = ?", whiteboardID, userID).First(&wb).Error; err != nil {
		http.Error(w, `{"error": "Whiteboard not found or access denied"}`, http.StatusNotFound)
		return
	}

	var req UpdateCollabWhiteboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Title != "" {
		wb.Title = req.Title
	}

	if err := db.Save(&wb).Error; err != nil {
		http.Error(w, `{"error": "Failed to update whiteboard"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Whiteboard updated"})
}

// DeleteCollabWhiteboard deletes the whiteboard (owner only)
func DeleteCollabWhiteboard(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	userEmail, _ := r.Context().Value("email").(string)

	whiteboardID := chi.URLParam(r, "id")

	var wb models.CollabWhiteboard
	if err := db.Where("id = ? AND owner_id = ?", whiteboardID, userID).First(&wb).Error; err != nil {
		http.Error(w, `{"error": "Whiteboard not found or access denied"}`, http.StatusNotFound)
		return
	}

	// Broadcast deletion notification to all connected users via WebSocket
	msg := map[string]interface{}{
		"type": "deleted",
		"payload": map[string]string{
			"deletedBy": userEmail,
			"message":   "This whiteboard has been deleted by the owner.",
		},
	}
	msgBytes, _ := json.Marshal(msg)
	websocket.GetManager().BroadcastToAll(whiteboardID, msgBytes)

	// Delete all members first
	db.Where("whiteboard_id = ?", whiteboardID).Delete(&models.WhiteboardMember{})

	// Delete the whiteboard
	if err := db.Delete(&wb).Error; err != nil {
		http.Error(w, `{"error": "Failed to delete whiteboard"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Whiteboard deleted"})
}

// SaveCollabWhiteboardData saves the whiteboard Tldraw snapshot
func SaveCollabWhiteboardData(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	whiteboardID := chi.URLParam(r, "id")

	var wb models.CollabWhiteboard
	if err := db.Where("id = ?", whiteboardID).First(&wb).Error; err != nil {
		http.Error(w, `{"error": "Whiteboard not found"}`, http.StatusNotFound)
		return
	}

	// Check edit access
	if wb.OwnerID != userID {
		var member models.WhiteboardMember
		if err := db.Where("whiteboard_id = ? AND user_id = ? AND permission = ?", whiteboardID, userID, "edit").First(&member).Error; err != nil {
			http.Error(w, `{"error": "Edit access denied"}`, http.StatusForbidden)
			return
		}
	}

	var req SaveCollabWhiteboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	wb.Data = req.Data
	if err := db.Save(&wb).Error; err != nil {
		http.Error(w, `{"error": "Failed to save whiteboard"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Whiteboard saved"})
}

// --- Member Management ---

// AddMember adds a user to a whiteboard by email
func AddMember(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	whiteboardID := chi.URLParam(r, "id")

	// Check that requester is the owner
	var wb models.CollabWhiteboard
	if err := db.Where("id = ? AND owner_id = ?", whiteboardID, userID).First(&wb).Error; err != nil {
		http.Error(w, `{"error": "Only the owner can add members"}`, http.StatusForbidden)
		return
	}

	var req AddMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	req.Email = strings.ToLower(strings.TrimSpace(req.Email))
	if req.Email == "" {
		http.Error(w, `{"error": "Email is required"}`, http.StatusBadRequest)
		return
	}

	if req.Permission != "edit" && req.Permission != "view" {
		req.Permission = "view"
	}

	// Find user by email
	var targetUser models.User
	if err := db.Where("email = ?", req.Email).First(&targetUser).Error; err != nil {
		http.Error(w, `{"error": "User not found with that email"}`, http.StatusNotFound)
		return
	}

	// Can't add yourself
	if targetUser.ID == userID {
		http.Error(w, `{"error": "Cannot add yourself as a member"}`, http.StatusBadRequest)
		return
	}

	// Check if already a member
	var existing models.WhiteboardMember
	if err := db.Where("whiteboard_id = ? AND user_id = ?", whiteboardID, targetUser.ID).First(&existing).Error; err == nil {
		http.Error(w, `{"error": "User is already a member"}`, http.StatusConflict)
		return
	}

	member := models.WhiteboardMember{
		WhiteboardID: whiteboardID,
		UserID:       targetUser.ID,
		Permission:   req.Permission,
	}

	if err := db.Create(&member).Error; err != nil {
		http.Error(w, `{"error": "Failed to add member"}`, http.StatusInternalServerError)
		return
	}

	userName := ""
	if targetUser.Name != nil {
		userName = *targetUser.Name
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(MemberResponse{
		ID:         member.ID,
		UserID:     targetUser.ID,
		UserName:   userName,
		UserEmail:  targetUser.Email,
		Permission: member.Permission,
		CreatedAt:  member.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
	})
}

// ListMembers lists all members of a whiteboard
func ListMembers(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	whiteboardID := chi.URLParam(r, "id")

	// Check access
	var wb models.CollabWhiteboard
	if err := db.Where("id = ?", whiteboardID).First(&wb).Error; err != nil {
		http.Error(w, `{"error": "Whiteboard not found"}`, http.StatusNotFound)
		return
	}

	if wb.OwnerID != userID {
		var member models.WhiteboardMember
		if err := db.Where("whiteboard_id = ? AND user_id = ?", whiteboardID, userID).First(&member).Error; err != nil {
			http.Error(w, `{"error": "Access denied"}`, http.StatusForbidden)
			return
		}
	}

	var members []models.WhiteboardMember
	db.Where("whiteboard_id = ?", whiteboardID).Find(&members)

	var result []MemberResponse
	for _, m := range members {
		var user models.User
		db.Select("id, name, email").Where("id = ?", m.UserID).First(&user)
		userName := ""
		if user.Name != nil {
			userName = *user.Name
		}
		result = append(result, MemberResponse{
			ID:         m.ID,
			UserID:     user.ID,
			UserName:   userName,
			UserEmail:  user.Email,
			Permission: m.Permission,
			CreatedAt:  m.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		})
	}

	if result == nil {
		result = []MemberResponse{}
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(result)
}

// UpdateMember updates a member's permission (owner only)
func UpdateMember(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	whiteboardID := chi.URLParam(r, "id")
	memberID := chi.URLParam(r, "memberId")

	// Check that requester is owner
	var wb models.CollabWhiteboard
	if err := db.Where("id = ? AND owner_id = ?", whiteboardID, userID).First(&wb).Error; err != nil {
		http.Error(w, `{"error": "Only the owner can update members"}`, http.StatusForbidden)
		return
	}

	var req UpdateMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Permission != "edit" && req.Permission != "view" {
		http.Error(w, `{"error": "Permission must be 'edit' or 'view'"}`, http.StatusBadRequest)
		return
	}

	var member models.WhiteboardMember
	if err := db.Where("id = ? AND whiteboard_id = ?", memberID, whiteboardID).First(&member).Error; err != nil {
		http.Error(w, `{"error": "Member not found"}`, http.StatusNotFound)
		return
	}

	member.Permission = req.Permission
	if err := db.Save(&member).Error; err != nil {
		http.Error(w, `{"error": "Failed to update member"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Member permission updated"})
}

// RemoveMember removes a member from a whiteboard (owner only)
func RemoveMember(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	whiteboardID := chi.URLParam(r, "id")
	memberID := chi.URLParam(r, "memberId")

	// Check that requester is owner
	var wb models.CollabWhiteboard
	if err := db.Where("id = ? AND owner_id = ?", whiteboardID, userID).First(&wb).Error; err != nil {
		http.Error(w, `{"error": "Only the owner can remove members"}`, http.StatusForbidden)
		return
	}

	if err := db.Where("id = ? AND whiteboard_id = ?", memberID, whiteboardID).Delete(&models.WhiteboardMember{}).Error; err != nil {
		http.Error(w, `{"error": "Failed to remove member"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{"message": "Member removed"})
}
