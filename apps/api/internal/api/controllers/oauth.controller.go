package controllers

import (
	"collab-platform/api/internal/api/middlewares"
	"collab-platform/api/internal/api/models"
	"collab-platform/api/internal/api/utils"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"gorm.io/gorm"
)

type OAuthCallbackRequest struct {
	Code  string `json:"code"`
	State string `json:"state"`
}

type GoogleUserInfo struct {
	ID            string `json:"id"`
	Email         string `json:"email"`
	VerifiedEmail bool   `json:"verified_email"`
	Name          string `json:"name"`
	GivenName     string `json:"given_name"`
	FamilyName    string `json:"family_name"`
	Picture       string `json:"picture"`
}

type GoogleTokenResponse struct {
	AccessToken  string `json:"access_token"`
	ExpiresIn    int    `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	Scope        string `json:"scope"`
	TokenType    string `json:"token_type"`
	IDToken      string `json:"id_token"`
}

// GoogleOAuthCallback handles the OAuth callback from Google
func GoogleOAuthCallback(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	// Get code and state from query parameters (Google redirects with GET request)
	code := r.URL.Query().Get("code")
	// state → _ (for future CSRF validation)
	_ = r.URL.Query().Get("state")
	// fmt.Printf("Received OAuth callback with code: %s and state: %s\n", code, state)

	if code == "" {
		http.Error(w, `{"error": "Authorization code is required"}`, http.StatusBadRequest)
		return
	}

	// Exchange code for tokens
	googleTokens, err := exchangeGoogleCode(code)
	if err != nil {
		http.Error(w, `{"error": "Failed to exchange authorization code"}`, http.StatusBadRequest)
		return
	}

	// Get user info from Google
	userInfo, err := getGoogleUserInfo(googleTokens.AccessToken)
	if err != nil {
		http.Error(w, `{"error": "Failed to get user information"}`, http.StatusBadRequest)
		return
	}

	// Find or create user
	// isNewUser → _ (intentionally unused)
	user, _, err := findOrCreateOAuthUser(db, userInfo, "google")
	// fmt.Printf("OAuth user %s (new: %t)\n", user.Email, isNewUser)
	if err != nil {
		http.Error(w, `{"error": "Failed to process user"}`, http.StatusInternalServerError)
		return
	}

	// Generate tokens
	tokenPair, err := utils.GenerateTokenPair(user.ID, user.Email)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate tokens"}`, http.StatusInternalServerError)
		return
	}

	// Store refresh token in database
	refreshToken := models.RefreshToken{
		UserID:    user.ID,
		Token:     tokenPair.RefreshToken,
		ExpiresAt: utils.GetRefreshTokenExpiry(),
	}
	if err := db.Create(&refreshToken).Error; err != nil {
		http.Error(w, `{"error": "Failed to store refresh token"}`, http.StatusInternalServerError)
		return
	}

	// Clean up old refresh tokens for this user (keep only the last 5)
	cleanupOldRefreshTokens(db, user.ID, 5)

	// Redirect to frontend with tokens in URL
	// Use first CORS origin for redirect (the web app)
	frontendURL := os.Getenv("CORS_ORIGIN")
	if frontendURL == "" {
		frontendURL = "http://localhost:3000"
	} else {
		// If multiple origins, use the first one (web app)
		if idx := strings.Index(frontendURL, ","); idx != -1 {
			frontendURL = strings.TrimSpace(frontendURL[:idx])
		}
	}

	// Build redirect URL with tokens
	redirectURL := fmt.Sprintf("%s/auth/callback?accessToken=%s&refreshToken=%s&expiresIn=%d",
		frontendURL,
		url.QueryEscape(tokenPair.AccessToken),
		url.QueryEscape(tokenPair.RefreshToken),
		tokenPair.ExpiresIn,
	)

	http.Redirect(w, r, redirectURL, http.StatusTemporaryRedirect)
}

// GetGoogleAuthURL returns the Google OAuth authorization URL
func GetGoogleAuthURL(w http.ResponseWriter, r *http.Request) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	if clientID == "" || redirectURI == "" {
		http.Error(w, `{"error": "OAuth not configured"}`, http.StatusInternalServerError)
		return
	}

	// Generate a random state for CSRF protection
	state, err := utils.GenerateRefreshToken() // Reuse the random token generator
	if err != nil {
		http.Error(w, `{"error": "Failed to generate state"}`, http.StatusInternalServerError)
		return
	}

	authURL := "https://accounts.google.com/o/oauth2/v2/auth" +
		"?client_id=" + clientID +
		"&redirect_uri=" + redirectURI +
		"&response_type=code" +
		"&scope=openid%20email%20profile" +
		"&state=" + state +
		"&access_type=offline" +
		"&prompt=consent"

	json.NewEncoder(w).Encode(map[string]interface{}{
		"url":   authURL,
		"state": state,
	})
}

// exchangeGoogleCode exchanges an authorization code for tokens
func exchangeGoogleCode(code string) (*GoogleTokenResponse, error) {
	clientID := os.Getenv("GOOGLE_CLIENT_ID")
	clientSecret := os.Getenv("GOOGLE_CLIENT_SECRET")
	redirectURI := os.Getenv("GOOGLE_REDIRECT_URI")

	if clientID == "" || clientSecret == "" || redirectURI == "" {
		return nil, errors.New("OAuth credentials not configured")
	}

	fmt.Printf("Exchanging code with redirect_uri: %s\n", redirectURI)

	data := "code=" + code +
		"&client_id=" + clientID +
		"&client_secret=" + clientSecret +
		"&redirect_uri=" + redirectURI +
		"&grant_type=authorization_code"

	resp, err := http.Post(
		"https://oauth2.googleapis.com/token",
		"application/x-www-form-urlencoded",
		strings.NewReader(data),
	)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		fmt.Printf("Google token exchange failed with status %d: %s\n", resp.StatusCode, string(body))
		return nil, fmt.Errorf("failed to exchange code (status %d): %s", resp.StatusCode, string(body))
	}

	var tokens GoogleTokenResponse
	if err := json.NewDecoder(resp.Body).Decode(&tokens); err != nil {
		return nil, err
	}

	return &tokens, nil
}

// getGoogleUserInfo fetches user information from Google
func getGoogleUserInfo(accessToken string) (*GoogleUserInfo, error) {
	req, err := http.NewRequest("GET", "https://www.googleapis.com/oauth2/v2/userinfo", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, errors.New("failed to get user info: " + string(body))
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

// findOrCreateOAuthUser finds an existing user or creates a new one for OAuth login
func findOrCreateOAuthUser(db *gorm.DB, userInfo *GoogleUserInfo, provider string) (*models.User, bool, error) {
	var oauthProvider models.OAuthProvider
	isNewUser := false

	// Try to find existing OAuth provider connection
	err := db.Where("provider = ? AND provider_id = ?", provider, userInfo.ID).
		Preload("User").
		First(&oauthProvider).Error

	if err == nil {
		// User exists with this OAuth provider
		return &oauthProvider.User, false, nil
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, err
	}

	// Check if user exists with this email
	var user models.User
	err = db.Where("email = ?", strings.ToLower(userInfo.Email)).First(&user).Error

	if errors.Is(err, gorm.ErrRecordNotFound) {
		// Create new user
		isNewUser = true
		user = models.User{
			Email:         strings.ToLower(userInfo.Email),
			Name:          &userInfo.Name,
			Avatar:        &userInfo.Picture,
			EmailVerified: userInfo.VerifiedEmail,
		}

		if err := db.Create(&user).Error; err != nil {
			return nil, false, err
		}
	} else if err != nil {
		return nil, false, err
	} else {
		// User exists, update avatar if not set
		if user.Avatar == nil || *user.Avatar == "" {
			user.Avatar = &userInfo.Picture
			db.Save(&user)
		}
	}

	// Create OAuth provider connection
	oauthProvider = models.OAuthProvider{
		UserID:     user.ID,
		Provider:   provider,
		ProviderID: userInfo.ID,
		Email:      &userInfo.Email,
		Name:       &userInfo.Name,
		Avatar:     &userInfo.Picture,
	}

	if err := db.Create(&oauthProvider).Error; err != nil {
		return nil, false, err
	}

	return &user, isNewUser, nil
}

// cleanupOldRefreshTokens removes old refresh tokens, keeping only the most recent ones
func cleanupOldRefreshTokens(db *gorm.DB, userID string, keepCount int) {
	var tokens []models.RefreshToken
	db.Where("user_id = ?", userID).
		Order("created_at DESC").
		Offset(keepCount).
		Find(&tokens)

	for _, token := range tokens {
		db.Delete(&token)
	}
}

// RefreshAccessToken generates a new access token using a refresh token
func RefreshAccessToken(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	var req struct {
		RefreshToken string `json:"refreshToken"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.RefreshToken == "" {
		http.Error(w, `{"error": "Refresh token is required"}`, http.StatusBadRequest)
		return
	}

	// Find refresh token in database
	var refreshToken models.RefreshToken
	err := db.Where("token = ?", req.RefreshToken).
		Preload("User").
		First(&refreshToken).Error

	if err != nil {
		http.Error(w, `{"error": "Invalid refresh token"}`, http.StatusUnauthorized)
		return
	}

	// Check if token is valid
	if !refreshToken.IsValid() {
		http.Error(w, `{"error": "Refresh token expired or revoked"}`, http.StatusUnauthorized)
		return
	}

	// Generate new access token
	accessToken, err := utils.GenerateJWT(refreshToken.User.ID, refreshToken.User.Email)
	if err != nil {
		http.Error(w, `{"error": "Failed to generate access token"}`, http.StatusInternalServerError)
		return
	}

	// Optionally rotate refresh token (recommended for security)
	newRefreshToken, err := utils.GenerateRefreshToken()
	if err != nil {
		http.Error(w, `{"error": "Failed to generate refresh token"}`, http.StatusInternalServerError)
		return
	}

	// Revoke old refresh token
	refreshToken.Revoke()
	db.Save(&refreshToken)

	// Create new refresh token
	newToken := models.RefreshToken{
		UserID:    refreshToken.UserID,
		Token:     newRefreshToken,
		ExpiresAt: utils.GetRefreshTokenExpiry(),
	}
	if err := db.Create(&newToken).Error; err != nil {
		http.Error(w, `{"error": "Failed to store refresh token"}`, http.StatusInternalServerError)
		return
	}

	response := map[string]interface{}{
		"accessToken":  accessToken,
		"refreshToken": newRefreshToken,
		"expiresIn":    900, // 15 minutes
	}

	json.NewEncoder(w).Encode(response)
}

// RevokeRefreshToken revokes a refresh token (logout)
func RevokeRefreshToken(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	var req struct {
		RefreshToken string `json:"refreshToken"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, `{"error": "Invalid request body"}`, http.StatusBadRequest)
		return
	}

	if req.RefreshToken == "" {
		http.Error(w, `{"error": "Refresh token is required"}`, http.StatusBadRequest)
		return
	}

	// Find and revoke refresh token
	var refreshToken models.RefreshToken
	err := db.Where("token = ?", req.RefreshToken).First(&refreshToken).Error

	if err == nil {
		refreshToken.Revoke()
		db.Save(&refreshToken)
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "Logged out successfully",
	})
}

// RevokeAllRefreshTokens revokes all refresh tokens for a user
func RevokeAllRefreshTokens(w http.ResponseWriter, r *http.Request) {
	db := GetDB(r)
	if db == nil {
		http.Error(w, `{"error": "Database connection not available"}`, http.StatusInternalServerError)
		return
	}

	// Get user from context (protected route)
	claims := middlewares.GetUserFromContext(r)
	if claims == nil {
		http.Error(w, `{"error": "Unauthorized"}`, http.StatusUnauthorized)
		return
	}

	// Revoke all tokens for this user
	now := time.Now()
	db.Model(&models.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", claims.UserID).
		Update("revoked_at", now)

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"message": "All sessions revoked successfully",
	})
}
