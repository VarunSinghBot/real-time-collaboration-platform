package controllers

import (
	"collab-platform/api/internal/api/models"
	"collab-platform/api/internal/api/utils"
	"encoding/json"
	"net/http"
	"strings"

	"gorm.io/gorm"
)

type SignupRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
	Username string `json:"username"`
	Name     string `json:"name"`
}

type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

type AuthResponse struct {
	Token string      `json:"token"`
	User  interface{} `json:"user"`
}

// GetDB returns the database from context
func GetDB(r *http.Request) *gorm.DB {
	db, ok := r.Context().Value("db").(*gorm.DB)
	if !ok {
		return nil
	}
	return db
}

// Signup handles user registration
func Signup(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	var req SignupRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		http.Error(w, `{"error": "Email and password are required"}`, http.StatusBadRequest)
		return
	}

	// Normalize email
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Check if user already exists
	var existingUser models.User
	if err := db.Where("email = ?", req.Email).First(&existingUser).Error; err == nil {
		http.Error(w, `{"error": "User with this email already exists"}`, http.StatusConflict)
		return
	}

	// Check if username is taken (if provided)
	if req.Username != "" {
		var existingUsername models.User
		if err := db.Where("username = ?", req.Username).First(&existingUsername).Error; err == nil {
			http.Error(w, `{"error": "Username is already taken"}`, http.StatusConflict)
			return
		}
	}

	// Hash password
	hashedPassword, err := utils.HashPassword(req.Password)
	if err != nil {
		http.Error(w, `{"error": "Failed to process password"}`, http.StatusInternalServerError)
		return
	}

	// Create user
	user := models.User{
		Email:    req.Email,
		Password: &hashedPassword,
	}

	if req.Username != "" {
		user.Username = &req.Username
	}
	if req.Name != "" {
		user.Name = &req.Name
	}

	if err := db.Create(&user).Error; err != nil {
		http.Error(w, `{"error": "Failed to create user"}`, http.StatusInternalServerError)
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	// Return response (don't send password)
	response := AuthResponse{
		Token: token,
		User: map[string]interface{}{
			"id":       user.ID,
			"email":    user.Email,
			"username": user.Username,
			"name":     user.Name,
		},
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(response)
}

// Login handles user authentication
func Login(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	var req LoginRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	// Validate input
	if req.Email == "" || req.Password == "" {
		http.Error(w, `{"error": "Email and password are required"}`, http.StatusBadRequest)
		return
	}

	// Normalize email
	req.Email = strings.ToLower(strings.TrimSpace(req.Email))

	// Find user
	var user models.User
	if err := db.Where("email = ?", req.Email).First(&user).Error; err != nil {
		http.Error(w, `{"error": "Invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	// Check if password exists (OAuth users might not have password)
	if user.Password == nil {
		http.Error(w, `{"error": "This account uses OAuth authentication"}`, http.StatusBadRequest)
		return
	}

	// Verify password
	if err := utils.ComparePassword(*user.Password, req.Password); err != nil {
		http.Error(w, `{"error": "Invalid email or password"}`, http.StatusUnauthorized)
		return
	}

	// Generate JWT token
	token, err := utils.GenerateJWT(user.ID, user.Email)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate token"}`, http.StatusInternalServerError)
		return
	}

	// Return response
	response := AuthResponse{
		Token: token,
		User: map[string]interface{}{
			"id":       user.ID,
			"email":    user.Email,
			"username": user.Username,
			"name":     user.Name,
		},
	}

	json.NewEncoder(w).Encode(response)
}
