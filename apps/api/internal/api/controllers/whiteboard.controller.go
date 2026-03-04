package controllers

import (
	"collab-platform/api/internal/api/models"
	"encoding/json"
	"net/http"

	"gorm.io/gorm"
)

type SaveWhiteboardRequest struct {
	Name string `json:"name"`
	Data string `json:"data"` // JSON string of whiteboard state
}

type WhiteboardResponse struct {
	ID        string `json:"id"`
	UserID    string `json:"userId"`
	Name      string `json:"name"`
	Data      string `json:"data"`
	CreatedAt string `json:"createdAt"`
	UpdatedAt string `json:"updatedAt"`
}

// GetUserWhiteboard retrieves the user's private whiteboard data
func GetUserWhiteboard(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var whiteboard models.WhiteboardData
	err := db.Where("user_id = ?", userID).First(&whiteboard).Error

	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// Return empty whiteboard if not found
			w.WriteHeader(http.StatusOK)
			json.NewEncoder(w).Encode(map[string]interface{}{
				"id":     "",
				"userId": userID,
				"name":   "Private Board",
				"data":   "{}",
			})
			return
		}
		http.Error(w, `{"error": "Failed to fetch whiteboard"}`, http.StatusInternalServerError)
		return
	}

	response := WhiteboardResponse{
		ID:        whiteboard.ID,
		UserID:    whiteboard.UserID,
		Name:      whiteboard.Name,
		Data:      whiteboard.Data,
		CreatedAt: whiteboard.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: whiteboard.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// SaveUserWhiteboard saves or updates the user's private whiteboard data
func SaveUserWhiteboard(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	var req SaveWhiteboardRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Validate that data is valid JSON
	var tempData interface{}
	if err := json.Unmarshal([]byte(req.Data), &tempData); err != nil {
		http.Error(w, `{"error": "Invalid whiteboard data format"}`, http.StatusBadRequest)
		return
	}

	// Check if whiteboard exists for user
	var whiteboard models.WhiteboardData
	err := db.Where("user_id = ?", userID).First(&whiteboard).Error

	if err == gorm.ErrRecordNotFound {
		// Create new whiteboard
		whiteboard = models.WhiteboardData{
			UserID: userID,
			Name:   req.Name,
			Data:   req.Data,
		}
		if err := db.Create(&whiteboard).Error; err != nil {
			http.Error(w, `{"error": "Failed to create whiteboard"}`, http.StatusInternalServerError)
			return
		}
	} else if err != nil {
		http.Error(w, `{"error": "Failed to fetch whiteboard"}`, http.StatusInternalServerError)
		return
	} else {
		// Update existing whiteboard
		whiteboard.Data = req.Data
		if req.Name != "" {
			whiteboard.Name = req.Name
		}
		if err := db.Save(&whiteboard).Error; err != nil {
			http.Error(w, `{"error": "Failed to update whiteboard"}`, http.StatusInternalServerError)
			return
		}
	}

	response := WhiteboardResponse{
		ID:        whiteboard.ID,
		UserID:    whiteboard.UserID,
		Name:      whiteboard.Name,
		Data:      whiteboard.Data,
		CreatedAt: whiteboard.CreatedAt.Format("2006-01-02T15:04:05Z07:00"),
		UpdatedAt: whiteboard.UpdatedAt.Format("2006-01-02T15:04:05Z07:00"),
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(response)
}

// DeleteUserWhiteboard deletes the user's private whiteboard data
func DeleteUserWhiteboard(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	// Get user ID from context (set by auth middleware)
	userID, ok := r.Context().Value("userID").(string)
	if !ok {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Delete the whiteboard
	if err := db.Where("user_id = ?", userID).Delete(&models.WhiteboardData{}).Error; err != nil {
		http.Error(w, `{"error": "Failed to delete whiteboard"}`, http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]string{
		"message": "Whiteboard deleted successfully",
	})
}
