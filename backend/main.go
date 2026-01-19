package main

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	_ "github.com/lib/pq"
	"github.com/rs/cors"
)

var db *sql.DB

// User represents a leaderboard user
type User struct {
	Rank     int    `json:"rank"`
	Username string `json:"username"`
	Rating   int    `json:"rating"`
}

// LeaderboardResponse represents the leaderboard API response
type LeaderboardResponse struct {
	Users      []User `json:"users"`
	TotalCount int    `json:"total_count"`
	Limit      int    `json:"limit"`
	Offset     int    `json:"offset"`
}

// SearchResponse represents the search API response
type SearchResponse struct {
	Users []User `json:"users"`
	Query string `json:"query"`
}

func main() {
	// Load .env file
	loadEnv()

	// Initialize database connection
	initDB()
	defer db.Close()

	// Setup routes
	mux := http.NewServeMux()
	mux.HandleFunc("/leaderboard", leaderboardHandler)
	mux.HandleFunc("/search", searchHandler)
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/simulate", simulateHandler)

	// Setup CORS
	handler := cors.New(cors.Options{
		AllowedOrigins:   []string{"*"},
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"},
		AllowCredentials: true,
	}).Handler(mux)

	// Start server
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	log.Printf("Server starting on port %s...", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}

// Simple .env loader
func loadEnv() {
	// Don't overwrite if already set (e.g. in production)
	if os.Getenv("DATABASE_URL") != "" {
		return
	}

	data, err := os.ReadFile(".env")
	if err != nil {
		return
	}

	content := string(data)
	for _, line := range strings.Split(content, "\n") {
		line = strings.TrimSpace(line)
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			// Remove any quotes
			value = strings.Trim(value, `"'`)
			os.Setenv(key, value)
		}
	}
}

func initDB() {
	var err error

	// Get database URL from environment variable
	dbURL := os.Getenv("DATABASE_URL")
	if dbURL == "" {
		log.Fatal("DATABASE_URL environment variable is required")
	}

	db, err = sql.Open("postgres", dbURL)
	if err != nil {
		log.Fatal("Failed to connect to database:", err)
	}

	// Test connection
	err = db.Ping()
	if err != nil {
		log.Fatal("Failed to ping database:", err)
	}

	// Set connection pool settings
	// Reduced mainly to prevent "unnamed prepared statement" errors with some PG configs
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	log.Println("Database connected successfully")
}

// leaderboardHandler handles GET /leaderboard?limit=50&offset=0
func leaderboardHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Parse query parameters
	limitStr := r.URL.Query().Get("limit")
	offsetStr := r.URL.Query().Get("offset")

	limit := 50 // default
	offset := 0 // default

	if limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 {
			limit = l
		}
	}

	if offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Query with DENSE_RANK for tie-aware ranking
	query := `
		WITH ranked_users AS (
			SELECT 
				DENSE_RANK() OVER (ORDER BY rating DESC) as rank,
				username,
				rating
			FROM users
		)
		SELECT rank, username, rating
		FROM ranked_users
		ORDER BY rank
		LIMIT $1 OFFSET $2
	`

	rows, err := db.Query(query, limit, offset)
	if err != nil {
		log.Printf("Error querying leaderboard: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var user User
		err := rows.Scan(&user.Rank, &user.Username, &user.Rating)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		users = append(users, user)
	}

	// Get total count
	var totalCount int
	err = db.QueryRow("SELECT COUNT(*) FROM users").Scan(&totalCount)
	if err != nil {
		log.Printf("Error getting total count: %v", err)
		totalCount = 0
	}

	response := LeaderboardResponse{
		Users:      users,
		TotalCount: totalCount,
		Limit:      limit,
		Offset:     offset,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// searchHandler handles GET /search?query=username
func searchHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodGet {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	query := r.URL.Query().Get("query")
	if query == "" {
		http.Error(w, "Query parameter is required", http.StatusBadRequest)
		return
	}

	// Search with live global rank calculation using DENSE_RANK
	sqlQuery := `
		WITH ranked_users AS (
			SELECT 
				DENSE_RANK() OVER (ORDER BY rating DESC) as rank,
				username,
				rating
			FROM users
		)
		SELECT rank, username, rating
		FROM ranked_users
		WHERE LOWER(username) LIKE LOWER($1)
		ORDER BY rank
		LIMIT 100
	`

	rows, err := db.Query(sqlQuery, "%"+query+"%")
	if err != nil {
		log.Printf("Error searching users: %v", err)
		http.Error(w, "Internal server error", http.StatusInternalServerError)
		return
	}
	defer rows.Close()

	users := []User{}
	for rows.Next() {
		var user User
		err := rows.Scan(&user.Rank, &user.Username, &user.Rating)
		if err != nil {
			log.Printf("Error scanning row: %v", err)
			continue
		}
		users = append(users, user)
	}

	response := SearchResponse{
		Users: users,
		Query: query,
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

// healthHandler handles GET /health
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status": "healthy",
		"time":   time.Now().Format(time.RFC3339),
	})
}

// ratingUpdater simulates random rating updates
func ratingUpdater() {
	ticker := time.NewTicker(5 * time.Second)
	defer ticker.Stop()

	log.Println("Rating updater started")

	for range ticker.C {
		// Update 10 random users' ratings
		updateCount := 10

		for i := 0; i < updateCount; i++ {
			// Get a random user
			var userID int
			err := db.QueryRow("SELECT id FROM users ORDER BY RANDOM() LIMIT 1").Scan(&userID)
			if err != nil {
				log.Printf("Error getting random user: %v", err)
				continue
			}

			// Generate new random rating between 100 and 5000
			// Use 4901 to get 0-4900, then +100 to get 100-5000
			newRating := rand.Intn(4901) + 100

			// Double check constraints just in case
			if newRating < 100 {
				newRating = 100
			}
			if newRating > 5000 {
				newRating = 5000
			}

			// Update the user's rating
			_, err = db.Exec("UPDATE users SET rating = $1 WHERE id = $2", newRating, userID)
			if err != nil {
				log.Printf("Error updating rating: %v", err)
			}
		}

		log.Printf("Updated %d users' ratings", updateCount)
	}
}

// simulateHandler handles POST /simulate to manually update ratings
// This allows for better demoing of the leaderboard dynamics
func simulateHandler(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	// Update 50 random users
	updateCount := 50
	highScoreCount := 5 // These will definitely show up on top

	for i := 0; i < updateCount; i++ {
		// Get a random user
		var userID int
		err := db.QueryRow("SELECT id FROM users ORDER BY RANDOM() LIMIT 1").Scan(&userID)
		if err != nil {
			log.Printf("Error getting random user: %v", err)
			continue
		}

		var newRating int

		// "Smart" Logic:
		// Make the first few updates SUPER high so they appear on the leaderboard
		if i < highScoreCount {
			// Generate rating between 4800 and 5000
			newRating = rand.Intn(201) + 4800
		} else {
			// standard random rating 100-5000
			newRating = rand.Intn(4901) + 100
		}

		// Constraint checks
		if newRating < 100 {
			newRating = 100
		}
		if newRating > 5000 {
			newRating = 5000
		}

		// Update the user's rating
		_, err = db.Exec("UPDATE users SET rating = $1 WHERE id = $2", newRating, userID)
		if err != nil {
			log.Printf("Error updating rating: %v", err)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{
		"status":  "success",
		"message": fmt.Sprintf("Updated %d users (%d with high scores)", updateCount, highScoreCount),
	})
}
