package api

import (
	"collab-platform/api/internal/api/models"
	"fmt"
	"log"
	"os"
	"time"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// DB is the global GORM database instance
var DB *gorm.DB

func ConnectDB() {
	databaseURL := os.Getenv("DATABASE_URL")
	if databaseURL == "" {
		log.Fatal("DATABASE_URL not set in environment")
	}

	// Configure GORM logger
	gormLogger := logger.Default.LogMode(logger.Info)
	if os.Getenv("GO_ENV") == "production" {
		gormLogger = logger.Default.LogMode(logger.Error)
	}

	// GORM configuration
	config := &gorm.Config{
		Logger: gormLogger,
		NowFunc: func() time.Time {
			return time.Now().UTC()
		},
		QueryFields: true,
	}

	var err error
	DB, err = gorm.Open(postgres.Open(databaseURL), config)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Configure connection pool
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}

	sqlDB.SetMaxIdleConns(10)
	sqlDB.SetMaxOpenConns(100)
	sqlDB.SetConnMaxLifetime(time.Hour)

	// Auto-migrate the schema
	log.Println("Running database migrations...")
	err = DB.AutoMigrate(&models.User{})
	if err != nil {
		log.Fatal("Failed to migrate database:", err)
	}

	log.Println("✅ Connected to database and ran migrations successfully")

	// Print database info
	var result struct {
		Version string
	}
	DB.Raw("SELECT version()").Scan(&result)
	fmt.Printf("📊 Database: PostgreSQL\n")
	fmt.Printf("📦 Tables: users\n")
}

func DisconnectDB() {
	sqlDB, err := DB.DB()
	if err != nil {
		log.Fatal("Failed to get database instance:", err)
	}
	if err := sqlDB.Close(); err != nil {
		log.Fatal("Failed to disconnect database:", err)
	}
}
