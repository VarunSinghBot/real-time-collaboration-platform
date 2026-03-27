package controllers

import (
	"collab-platform/api/internal/api/middlewares"
	"collab-platform/api/internal/api/models"
	"collab-platform/api/internal/api/utils"
	"encoding/json"
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	"gorm.io/gorm"
)

type CreateDocumentRequest struct {
	Title string `json:"title"`
}

type UpdateDocumentRequest struct {
	Title   string `json:"title"`
	Content string `json:"content"`
}

type AddDocumentMemberRequest struct {
	Email      string `json:"email"`
	Permission string `json:"permission"` // "edit" or "view"
}

// CreateDocument creates a new collaborative document
func CreateDocument(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	claims, ok := r.Context().Value(middlewares.UserContextKey).(*utils.Claims)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req CreateDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.Title == "" {
		req.Title = "Untitled Document"
	}

	// Create document
	document := models.CollabDocument{
		Title:   req.Title,
		OwnerID: claims.UserID,
		Content: "",
	}

	if err := db.Create(&document).Error; err != nil {
		http.Error(w, `{"error": "Failed to create document"}`, http.StatusInternalServerError)
		return
	}

	// Add owner as a member with owner permission
	member := models.DocumentMember{
		DocumentID: document.ID,
		UserID:     claims.UserID,
		Permission: "owner",
		JoinedAt:   time.Now(),
	}

	if err := db.Create(&member).Error; err != nil {
		http.Error(w, `{"error": "Failed to add owner as member"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(document)
}

// GetDocuments retrieves all documents for the authenticated user
func GetDocuments(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	claims, ok := r.Context().Value(middlewares.UserContextKey).(*utils.Claims)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var members []models.DocumentMember
	if err := db.Where("user_id = ?", claims.UserID).
		Preload("Document").
		Find(&members).Error; err != nil {
		http.Error(w, `{"error": "Failed to fetch documents"}`, http.StatusInternalServerError)
		return
	}

	// Transform to response format
	type DocumentResponse struct {
		ID         string    `json:"id"`
		RoomCode   string    `json:"roomCode"`
		Title      string    `json:"title"`
		Permission string    `json:"permission"`
		CreatedAt  time.Time `json:"createdAt"`
		UpdatedAt  time.Time `json:"updatedAt"`
	}

	var documents []DocumentResponse
	for _, member := range members {
		documents = append(documents, DocumentResponse{
			ID:         member.Document.ID,
			RoomCode:   member.Document.RoomCode,
			Title:      member.Document.Title,
			Permission: member.Permission,
			CreatedAt:  member.Document.CreatedAt,
			UpdatedAt:  member.Document.UpdatedAt,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(documents)
}

// GetDocument retrieves a specific document and checks user permission
func GetDocument(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	claims, ok := r.Context().Value(middlewares.UserContextKey).(*utils.Claims)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	roomCode := chi.URLParam(r, "roomCode")

	// Find document by room code
	var document models.CollabDocument
	if err := db.Where("room_code = ?", roomCode).First(&document).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, `{"error": "Document not found"}`, http.StatusNotFound)
		} else {
			http.Error(w, `{"error": "Failed to fetch document"}`, http.StatusInternalServerError)
		}
		return
	}

	// Check user permission
	var member models.DocumentMember
	if err := db.Where("document_id = ? AND user_id = ?", document.ID, claims.UserID).
		First(&member).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			http.Error(w, `{"error": "Access denied"}`, http.StatusForbidden)
		} else {
			http.Error(w, `{"error": "Failed to check permission"}`, http.StatusInternalServerError)
		}
		return
	}

	response := map[string]interface{}{
		"id":         document.ID,
		"roomCode":   document.RoomCode,
		"title":      document.Title,
		"content":    document.Content,
		"permission": member.Permission,
		"createdAt":  document.CreatedAt,
		"updatedAt":  document.UpdatedAt,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// UpdateDocument updates a document's title or content
func UpdateDocument(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	claims, ok := r.Context().Value(middlewares.UserContextKey).(*utils.Claims)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	roomCode := chi.URLParam(r, "roomCode")

	var req UpdateDocumentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Find document
	var document models.CollabDocument
	if err := db.Where("room_code = ?", roomCode).First(&document).Error; err != nil {
		http.Error(w, `{"error": "Document not found"}`, http.StatusNotFound)
		return
	}

	// Check permission (only owner and edit can update)
	var member models.DocumentMember
	if err := db.Where("document_id = ? AND user_id = ?", document.ID, claims.UserID).
		First(&member).Error; err != nil {
		http.Error(w, `{"error": "Access denied"}`, http.StatusForbidden)
		return
	}

	if member.Permission != "owner" && member.Permission != "edit" {
		http.Error(w, `{"error": "Insufficient permissions"}`, http.StatusForbidden)
		return
	}

	// Update document
	updates := map[string]interface{}{}
	if req.Title != "" {
		updates["title"] = req.Title
	}
	if req.Content != "" {
		updates["content"] = req.Content
	}
	updates["updated_at"] = time.Now()

	if err := db.Model(&document).Updates(updates).Error; err != nil {
		http.Error(w, `{"error": "Failed to update document"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(document)
}

// DeleteDocument deletes a document (owner only)
func DeleteDocument(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	claims, ok := r.Context().Value(middlewares.UserContextKey).(*utils.Claims)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	roomCode := chi.URLParam(r, "roomCode")

	// Find document
	var document models.CollabDocument
	if err := db.Where("room_code = ?", roomCode).First(&document).Error; err != nil {
		http.Error(w, `{"error": "Document not found"}`, http.StatusNotFound)
		return
	}

	// Check if user is owner
	if document.OwnerID != claims.UserID {
		http.Error(w, `{"error": "Only owner can delete document"}`, http.StatusForbidden)
		return
	}

	// Delete document (soft delete)
	if err := db.Delete(&document).Error; err != nil {
		http.Error(w, `{"error": "Failed to delete document"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(`{"message": "Document deleted successfully"}`))
}

// AddDocumentMember adds a member to a document
func AddDocumentMember(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	claims, ok := r.Context().Value(middlewares.UserContextKey).(*utils.Claims)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	roomCode := chi.URLParam(r, "roomCode")

	var req AddDocumentMemberRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Find document
	var document models.CollabDocument
	if err := db.Where("room_code = ?", roomCode).First(&document).Error; err != nil {
		http.Error(w, `{"error": "Document not found"}`, http.StatusNotFound)
		return
	}

	// Check if requester is owner or has edit permission
	var requesterMember models.DocumentMember
	if err := db.Where("document_id = ? AND user_id = ?", document.ID, claims.UserID).
		First(&requesterMember).Error; err != nil {
		http.Error(w, `{"error": "Access denied"}`, http.StatusForbidden)
		return
	}

	if requesterMember.Permission != "owner" && requesterMember.Permission != "edit" {
		http.Error(w, `{"error": "Insufficient permissions"}`, http.StatusForbidden)
		return
	}

	// Find user by email
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		http.Error(w, `{"error": "User not found"}`, http.StatusNotFound)
		return
	}

	// Check if user is already a member
	var existingMember models.DocumentMember
	err := db.Where("document_id = ? AND user_id = ?", document.ID, user.ID).
		First(&existingMember).Error
	if err == nil {
		http.Error(w, `{"error": "User is already a member"}`, http.StatusBadRequest)
		return
	}

	// Add member
	permission := req.Permission
	if permission != "edit" && permission != "view" {
		permission = "view"
	}

	member := models.DocumentMember{
		DocumentID: document.ID,
		UserID:     user.ID,
		Permission: permission,
		JoinedAt:   time.Now(),
	}

	if err := db.Create(&member).Error; err != nil {
		http.Error(w, `{"error": "Failed to add member"}`, http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(member)
}
