-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    rating INTEGER NOT NULL CHECK (rating >= 100 AND rating <= 5000),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_rating ON users(rating DESC);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- Function to generate random usernames
CREATE OR REPLACE FUNCTION generate_username(n INTEGER) RETURNS VARCHAR AS $$
BEGIN
    RETURN 'user_' || LPAD(n::TEXT, 6, '0');
END;
$$ LANGUAGE plpgsql;

-- Seed database with 10,000 users
DO $$
DECLARE
    i INTEGER;
    random_rating INTEGER;
BEGIN
    FOR i IN 1..10000 LOOP
        random_rating := FLOOR(RANDOM() * 4901 + 100)::INTEGER;
        INSERT INTO users (username, rating)
        VALUES (generate_username(i), random_rating)
        ON CONFLICT (username) DO NOTHING;
    END LOOP;
END $$;

-- Verify data
SELECT COUNT(*) as total_users FROM users;
SELECT MIN(rating) as min_rating, MAX(rating) as max_rating FROM users;

-- Test DENSE_RANK query
SELECT 
    DENSE_RANK() OVER (ORDER BY rating DESC) as rank,
    username,
    rating
FROM users
ORDER BY rank
LIMIT 10;
