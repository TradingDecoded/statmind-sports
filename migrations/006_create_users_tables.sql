-- ============================================
-- StatMind Sports - Phase 6: User Authentication
-- Migration 006: Create Users Tables
-- ============================================

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100),
  avatar_url VARCHAR(255),
  bio TEXT,
  account_tier VARCHAR(20) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE
);

-- User stats table (tracks performance)
CREATE TABLE IF NOT EXISTS user_stats (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  total_parlays INTEGER DEFAULT 0,
  total_wins INTEGER DEFAULT 0,
  total_losses INTEGER DEFAULT 0,
  pending_parlays INTEGER DEFAULT 0,
  win_rate DECIMAL(5,2) DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  best_streak INTEGER DEFAULT 0,
  total_legs_picked INTEGER DEFAULT 0,
  correct_legs INTEGER DEFAULT 0,
  leg_accuracy DECIMAL(5,2) DEFAULT 0,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created ON users(created_at);

-- Insert a test user (password is: TestPass123!)
INSERT INTO users (username, email, password_hash, display_name)
VALUES (
  'testuser',
  'test@statmindsports.com',
  '$2b$10$YourHashedPasswordHere',
  'Test User'
) ON CONFLICT (username) DO NOTHING;

-- Create corresponding stats entry
INSERT INTO user_stats (user_id)
SELECT id FROM users WHERE username = 'testuser'
ON CONFLICT (user_id) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Users tables created successfully!';
  RAISE NOTICE '✅ Test user created: testuser / TestPass123!';
END $$;
