package utils

import (
	"testing"
)

// ============================================================
// Testing & Benchmarking — Password Utility Tests
// Demonstrates: unit tests, table-driven tests, benchmarks
// ============================================================

// TestHashPassword verifies that HashPassword produces a valid hash
func TestHashPassword(t *testing.T) {
	hash, err := HashPassword("TestPassword123!")
	if err != nil {
		t.Fatalf("HashPassword returned error: %v", err)
	}
	if hash == "" {
		t.Fatal("HashPassword returned empty hash")
	}
	if hash == "TestPassword123!" {
		t.Fatal("Hash should not equal the plain text password")
	}
}

// TestComparePassword_TableDriven uses table-driven tests to verify
// password comparison across multiple scenarios
func TestComparePassword_TableDriven(t *testing.T) {
	// Pre-hash a known password for comparison tests
	knownHash, err := HashPassword("CorrectPassword")
	if err != nil {
		t.Fatalf("Setup: HashPassword failed: %v", err)
	}

	// Table-driven test cases
	tests := []struct {
		name      string
		hash      string
		password  string
		expectErr bool
	}{
		{
			name:      "correct password matches hash",
			hash:      knownHash,
			password:  "CorrectPassword",
			expectErr: false,
		},
		{
			name:      "wrong password does not match",
			hash:      knownHash,
			password:  "WrongPassword",
			expectErr: true,
		},
		{
			name:      "empty password does not match",
			hash:      knownHash,
			password:  "",
			expectErr: true,
		},
		{
			name:      "similar password does not match",
			hash:      knownHash,
			password:  "correctpassword", // different case
			expectErr: true,
		},
		{
			name:      "password with extra space does not match",
			hash:      knownHash,
			password:  "CorrectPassword ",
			expectErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			err := ComparePassword(tt.hash, tt.password)
			if tt.expectErr && err == nil {
				t.Errorf("expected error but got nil")
			}
			if !tt.expectErr && err != nil {
				t.Errorf("expected no error but got: %v", err)
			}
		})
	}
}

// TestHashPassword_Uniqueness verifies that hashing the same password
// twice produces different hashes (bcrypt uses random salt)
func TestHashPassword_Uniqueness(t *testing.T) {
	hash1, err := HashPassword("SamePassword")
	if err != nil {
		t.Fatalf("First hash failed: %v", err)
	}
	hash2, err := HashPassword("SamePassword")
	if err != nil {
		t.Fatalf("Second hash failed: %v", err)
	}

	if hash1 == hash2 {
		t.Error("Two hashes of the same password should not be identical (bcrypt uses random salt)")
	}

	// But both should still validate correctly
	if err := ComparePassword(hash1, "SamePassword"); err != nil {
		t.Error("First hash should match the password")
	}
	if err := ComparePassword(hash2, "SamePassword"); err != nil {
		t.Error("Second hash should match the password")
	}
}

// TestHashPassword_VariousLengths tests hashing with different password lengths
func TestHashPassword_VariousLengths(t *testing.T) {
	tests := []struct {
		name     string
		password string
	}{
		{"short password", "abc"},
		{"medium password", "MediumPass123"},
		{"long password", "ThisIsAVeryLongPasswordThatShouldStillWorkFine123!@#"},
		{"password with special chars", "p@$$w0rd!#%&*"},
		{"unicode password", "パスワード123"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			hash, err := HashPassword(tt.password)
			if err != nil {
				t.Fatalf("HashPassword failed: %v", err)
			}
			if err := ComparePassword(hash, tt.password); err != nil {
				t.Errorf("ComparePassword failed for %q: %v", tt.password, err)
			}
		})
	}
}

// ============================================================
// Benchmarks — measures bcrypt hashing performance
// Run with: go test -bench=. -benchmem
// ============================================================

// BenchmarkHashPassword measures the time to hash a password
// This is useful for determining if the bcrypt cost factor is appropriate
func BenchmarkHashPassword(b *testing.B) {
	for i := 0; i < b.N; i++ {
		HashPassword("BenchmarkPassword123!")
	}
}

// BenchmarkComparePassword measures the time to compare a password
func BenchmarkComparePassword(b *testing.B) {
	hash, _ := HashPassword("BenchmarkPassword123!")
	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		ComparePassword(hash, "BenchmarkPassword123!")
	}
}
