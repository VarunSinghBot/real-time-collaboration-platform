package middlewares

import (
	"testing"
)

// ============================================================
// Testing — CSRF Middleware Tests
// Demonstrates: unit tests, table-driven tests
// ============================================================

// TestGenerateCSRFToken verifies token generation
func TestGenerateCSRFToken(t *testing.T) {
	token, err := GenerateCSRFToken()
	if err != nil {
		t.Fatalf("GenerateCSRFToken error: %v", err)
	}
	if token == "" {
		t.Fatal("Token should not be empty")
	}
}

// TestGenerateCSRFToken_Uniqueness verifies that each token is unique
func TestGenerateCSRFToken_Uniqueness(t *testing.T) {
	token1, err := GenerateCSRFToken()
	if err != nil {
		t.Fatalf("First token error: %v", err)
	}
	token2, err := GenerateCSRFToken()
	if err != nil {
		t.Fatalf("Second token error: %v", err)
	}

	if token1 == token2 {
		t.Error("Two generated CSRF tokens should not be identical")
	}
}

// TestValidateCSRFToken_TableDriven tests various validation scenarios
func TestValidateCSRFToken_TableDriven(t *testing.T) {
	// Generate a valid token for testing
	validToken, err := GenerateCSRFToken()
	if err != nil {
		t.Fatalf("Setup: GenerateCSRFToken failed: %v", err)
	}

	tests := []struct {
		name     string
		token    string
		expected bool
	}{
		{
			name:     "valid token is accepted",
			token:    validToken,
			expected: true,
		},
		{
			name:     "empty token is rejected",
			token:    "",
			expected: false,
		},
		{
			name:     "random string is rejected",
			token:    "not-a-valid-csrf-token",
			expected: false,
		},
		{
			name:     "similar but wrong token is rejected",
			token:    validToken + "x",
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := ValidateCSRFToken(tt.token)
			if result != tt.expected {
				t.Errorf("ValidateCSRFToken(%q) = %v, want %v", tt.token, result, tt.expected)
			}
		})
	}
}

// TestValidateCSRFToken_UsedOnce verifies that a valid token can be validated
// (CSRF tokens in this implementation are NOT single-use, they expire after 1 hour)
func TestValidateCSRFToken_ReusableBeforeExpiry(t *testing.T) {
	token, err := GenerateCSRFToken()
	if err != nil {
		t.Fatalf("GenerateCSRFToken error: %v", err)
	}

	// First validation
	if !ValidateCSRFToken(token) {
		t.Error("First validation should succeed")
	}

	// Second validation (should still work — not single-use)
	if !ValidateCSRFToken(token) {
		t.Error("Second validation should also succeed (token is time-based, not single-use)")
	}
}
