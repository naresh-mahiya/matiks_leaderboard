# 🏆 Matiks Leaderboard System

A production-ready, scalable leaderboard system built to handle millions of users with real-time ranking logic.

---

Live web app: https://matiks-leaderboard-blond.vercel.app
video link: https://drive.google.com/file/d/1NrKzhSSn-TnJxmyhhnOkmkaLj9fwCjIp/view?usp=drive_link

## 📖 Evaluation Guide & Approach

This project implements a **"Rank-on-Read"** architecture designed for high-frequency updates and absolute correctness.

### 1. The Ranking Problem & Solution
**Challenge:** How to rank users fairly when many have the same score, without "gaps" in the ranking numbers?
**Approach:** We allow the database to handle the heavy lifting using **Window Functions** (`DENSE_RANK`).
*   **Why?** Storing a fixed "rank" in the database is unscalable because one user's score update would force us to re-write thousands of other users' ranks.
*   **Our Solution:** We calculate ranks *dynamically* at the moment of the request. This ensures the leaderboard is **always live** and **never stale**.

### 2. Handling Scale (10,000+ Users)
**Challenge:** Loading thousands of users crashes mobile apps and slows down servers.
**Approach:** We implemented **Offset-based Pagination** and **Infinite Scrolling**.
*   The server only fetches 50 users at a time.
*   The mobile app loads more content automatically as you scroll down.
*   skeleton screens provide immediate visual feedback while data loads.

### 3. Live Global Search
**Challenge:** Finding a specific user's rank among millions requires scanning the entire dataset.
**Approach:** We use database indexing on the `username` and `rating` columns. When you search for a user, the system instantly computes their global standing relative to everyone else, even if they aren't in the top 50.

---

## ✨ Key Features

*   **⚡ Real-Time Dynamics:** Click the **"Simulate" button** to test the system! It instantly updates scores for 50 random users so you can watch the leaderboard change live.
*   **📊 Tie-Aware Ranking:** Users with identical scores share the exact same rank (e.g., three users can be Rank #1).
*   **🔍 Instant Search:** Find any user by name and see their live rank immediately.

---

## 🚀 How to Run

### Prerequisites
*   Node.js & npm
*   Go (Golang)
*   PostgreSQL Database (we recommend Neon DB)

### 1. Database Setup
1.  Create a PostgreSQL database.
2.  Run the provided `schema.sql` file in your database query tool to create the table and seed 10,000 users.

### 2. Backend (Go)
```bash
cd backend
# Create a .env file with your DATABASE_URL
go run main.go
```
*Server runs on port 8080.*

### 3. Frontend (React Native / Expo)
```bash
cd frontend
npm install
npx expo start
or npm run web
```
*Scan the QR code with your phone or press 'w' to run in the browser.*

---

## 🛠️ Architecture Stack

*   **Frontend:** React Native (Expo) - Works on Android, iOS, and Web.
*   **Backend:** Golang - High-performance, stateless REST API.
*   **Database:** PostgreSQL - Chosen for robustness and window function support.
