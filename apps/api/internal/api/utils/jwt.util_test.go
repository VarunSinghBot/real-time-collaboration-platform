package utils

import (
	"os"
	"testing"
)

// ============================================================
// Testing — JWT Utility Tests
// Demonstrates: unit tests, table-driven tests
// ============================================================

// setupJWTSecret sets a test JWT secret for the duration of a test
func setupJWTSecret(t *testing.T) {
	t.Helper()
	os.Setenv("JWT_SECRET", "test-secret-key-for-unit-testing-only")
	t.Cleanup(func() {
		os.Unsetenv("JWT_SECRET")
	})
}

// TestGenerateJWT verifies basic JWT generation
func TestGenerateJWT(t *testing.T) {
	setupJWTSecret(t)

	token, err := GenerateJWT("user-123", "test@example.com")
	if err != nil {
		t.Fatalf("GenerateJWT error: %v", err)
	}
	if token == "" {
		t.Fatal("GenerateJWT returned empty token")
	}
}

// TestGenerateJWT_NoSecret verifies error when JWT_SECRET is missing
func TestGenerateJWT_NoSecret(t *testing.T) {
	os.Unsetenv("JWT_SECRET")

	_, err := GenerateJWT("user-123", "test@example.com")
	if err == nil {
		t.Fatal("Expected error when JWT_SECRET is not set")
	}
}

// TestValidateJWT_TableDriven tests JWT validation with various scenarios
func TestValidateJWT_TableDriven(t *testing.T) {
	setupJWTSecret(t)

	// Generate a valid token for testing
	validToken, err := GenerateJWT("user-456", "varun@example.com")
	if err != nil {
		t.Fatalf("Setup: GenerateJWT failed: %v", err)
	}

	tests := []struct {
		name        string
		token       string
		expectErr   bool
		expectUID   string
		expectEmail string
	}{
		{
			name:        "valid token parses correctly",
			token:       validToken,
			expectErr:   false,
			expectUID:   "user-456",
			expectEmail: "varun@example.com",
		},
		{
			name:      "empty token returns error",
			token:     "",
			expectErr: true,
		},
		{
			name:      "malformed token returns error",
			token:     "not.a.valid.jwt.token",
			expectErr: true,
		},
		{
			name:      "random string returns error",
			token:     "randomgarbage",
			expectErr: true,
		},
		{
			name:      "tampered token returns error",
			token:     validToken + "tampered",
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			claims, err := ValidateJWT(tt.token)
			if tt.expectErr {
				if err == nil {
					t.Error("expected error but got nil")
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if claims.UserID != tt.expectUID {
				t.Errorf("UserID = %q, want %q", claims.UserID, tt.expectUID)
			}
			if claims.Email != tt.expectEmail {
				t.Errorf("Email = %q, want %q", claims.Email, tt.expectEmail)
			}
		})
	}
}

// TestGenerateTokenPair verifies that both access and refresh tokens are generated
func TestGenerateTokenPair(t *testing.T) {
	setupJWTSecret(t)

	pair, err := GenerateTokenPair("user-789", "pair@example.com")
	if err != nil {
		t.Fatalf("GenerateTokenPair error: %v", err)
	}
	if pair.AccessToken == "" {
		t.Error("AccessToken is empty")
	}
	if pair.RefreshToken == "" {
		t.Error("RefreshToken is empty")
	}
	if pair.ExpiresIn != 900 {
		t.Errorf("ExpiresIn = %d, want 900", pair.ExpiresIn)
	}

	// Validate the access token
	claims, err := ValidateJWT(pair.AccessToken)
	if err != nil {
		t.Fatalf("Access token validation failed: %v", err)
	}
	if claims.UserID != "user-789" {
		t.Errorf("UserID = %q, want %q", claims.UserID, "user-789")
	}
}

// TestGenerateRefreshToken verifies refresh tokens are unique
func TestGenerateRefreshToken(t *testing.T) {
	token1, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("First GenerateRefreshToken error: %v", err)
	}
	token2, err := GenerateRefreshToken()
	if err != nil {
		t.Fatalf("Second GenerateRefreshToken error: %v", err)
	}

	if token1 == token2 {
		t.Error("Two refresh tokens should not be identical")
	}
	if len(token1) == 0 {
		t.Error("Refresh token should not be empty")
	}
}

// TestGetRefreshTokenExpiry verifies the expiry duration
func TestGetRefreshTokenExpiry(t *testing.T) {
	expiry := GetRefreshTokenExpiry()
	if expiry.IsZero() {
		t.Error("Expiry should not be zero")
	}
}
