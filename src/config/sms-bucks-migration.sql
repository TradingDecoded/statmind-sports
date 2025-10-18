-- ============================================
-- SMS BUCKS COMPETITION SYSTEM - DATABASE MIGRATION
-- StatMind Sports - Phase 7
-- ============================================

-- ============================================
-- STEP 1: UPDATE USERS TABLE
-- Add SMS Bucks balance and membership tier
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS sms_bucks INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS membership_tier VARCHAR(20) DEFAULT 'free' CHECK (membership_tier IN ('free', 'premium', 'vip')),
ADD COLUMN IF NOT EXISTS subscription_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS subscription_end_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_login_bonus_date DATE;

-- Update existing account_tier column to match membership_tier
UPDATE users SET membership_tier = account_tier WHERE account_tier IN ('free', 'premium');

-- ============================================
-- STEP 2: CREATE SMS_BUCKS_TRANSACTIONS TABLE
-- Track every SMS Buck earned or spent
-- ============================================

CREATE TABLE IF NOT EXISTS sms_bucks_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL, -- positive = earned, negative = spent
  transaction_type VARCHAR(50) NOT NULL, -- 'monthly_allowance', 'daily_login', 'parlay_entry', 'parlay_win', 'share_bonus', 'admin_adjustment'
  balance_after INTEGER NOT NULL, -- SMS Bucks balance after this transaction
  description TEXT,
  related_parlay_id INTEGER REFERENCES user_parlays(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sms_bucks_user ON sms_bucks_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_sms_bucks_type ON sms_bucks_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_sms_bucks_created ON sms_bucks_transactions(created_at);

-- ============================================
-- STEP 3: CREATE WEEKLY_PARLAY_COUNTS TABLE
-- Enforce 10 parlay per week limit
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_parlay_counts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL, -- Week number in year (1-52)
  parlay_count INTEGER DEFAULT 0,
  last_parlay_date TIMESTAMP,
  UNIQUE(user_id, year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_parlays_user ON weekly_parlay_counts(user_id);
CREATE INDEX IF NOT EXISTS idx_weekly_parlays_week ON weekly_parlay_counts(year, week_number);

-- ============================================
-- STEP 4: CREATE WEEKLY_COMPETITIONS TABLE
-- Track winners, prizes, and rollovers
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_competitions (
  id SERIAL PRIMARY KEY,
  year INTEGER NOT NULL,
  week_number INTEGER NOT NULL, -- Week number in year (1-52)
  season INTEGER, -- NFL season (2024, 2025, etc)
  nfl_week INTEGER, -- NFL week (1-18)
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  prize_amount DECIMAL(10,2) DEFAULT 50.00, -- Base prize or rollover amount
  is_rollover BOOLEAN DEFAULT FALSE,
  minimum_entries_met BOOLEAN DEFAULT FALSE,
  total_participants INTEGER DEFAULT 0,
  total_parlays INTEGER DEFAULT 0,
  winner_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  winner_points INTEGER,
  winner_parlays INTEGER,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(year, week_number)
);

CREATE INDEX IF NOT EXISTS idx_weekly_comp_status ON weekly_competitions(status);
CREATE INDEX IF NOT EXISTS idx_weekly_comp_week ON weekly_competitions(year, week_number);

-- ============================================
-- STEP 5: CREATE WEEKLY_COMPETITION_STANDINGS TABLE
-- Track all participants in each weekly competition
-- ============================================

CREATE TABLE IF NOT EXISTS weekly_competition_standings (
  id SERIAL PRIMARY KEY,
  competition_id INTEGER NOT NULL REFERENCES weekly_competitions(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  parlays_entered INTEGER DEFAULT 0,
  parlays_won INTEGER DEFAULT 0,
  rank INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(competition_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_comp_standings_comp ON weekly_competition_standings(competition_id);
CREATE INDEX IF NOT EXISTS idx_comp_standings_user ON weekly_competition_standings(user_id);
CREATE INDEX IF NOT EXISTS idx_comp_standings_rank ON weekly_competition_standings(competition_id, rank);

-- ============================================
-- STEP 6: UPDATE USER_PARLAYS TABLE
-- Add SMS Bucks cost and competition tracking
-- ============================================

ALTER TABLE user_parlays 
ADD COLUMN IF NOT EXISTS sms_bucks_cost INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sms_bucks_reward INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS year INTEGER,
ADD COLUMN IF NOT EXISTS week_number INTEGER, -- Calendar week (1-52)
ADD COLUMN IF NOT EXISTS competition_id INTEGER REFERENCES weekly_competitions(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sport VARCHAR(20) DEFAULT 'nfl';

-- Update existing parlays with year and week_number based on created_at
UPDATE user_parlays 
SET year = EXTRACT(YEAR FROM created_at),
    week_number = EXTRACT(WEEK FROM created_at)
WHERE year IS NULL;

-- ============================================
-- STEP 7: CREATE FUNCTION TO CALCULATE SMS BUCKS COST
-- Based on number of legs in parlay
-- ============================================

CREATE OR REPLACE FUNCTION calculate_sms_bucks_cost(leg_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE 
    WHEN leg_count = 2 THEN 50
    WHEN leg_count = 3 THEN 75
    WHEN leg_count = 4 THEN 100
    WHEN leg_count = 5 THEN 125
    WHEN leg_count >= 6 THEN 150
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 8: CREATE FUNCTION TO CALCULATE POINTS EARNED
-- Based on number of legs won
-- ============================================

CREATE OR REPLACE FUNCTION calculate_points_earned(leg_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE 
    WHEN leg_count = 2 THEN 2
    WHEN leg_count = 3 THEN 5
    WHEN leg_count = 4 THEN 10
    WHEN leg_count = 5 THEN 20
    WHEN leg_count >= 6 THEN 40
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 9: CREATE VIEW FOR CURRENT WEEK LEADERBOARD
-- Easy way to see current competition standings
-- ============================================

CREATE OR REPLACE VIEW current_week_leaderboard AS
SELECT 
  wcs.rank,
  u.id as user_id,
  u.username,
  u.display_name,
  u.avatar_url,
  u.membership_tier,
  wcs.total_points,
  wcs.parlays_entered,
  wcs.parlays_won,
  wc.prize_amount,
  wc.is_rollover,
  wc.week_number,
  wc.year
FROM weekly_competition_standings wcs
JOIN weekly_competitions wc ON wcs.competition_id = wc.id
JOIN users u ON wcs.user_id = u.id
WHERE wc.status = 'active'
ORDER BY wcs.rank ASC;

-- ============================================
-- STEP 10: INSERT INITIAL DATA
-- Give existing Premium users their SMS Bucks
-- ============================================

-- Give Premium users 300 SMS Bucks
UPDATE users 
SET sms_bucks = 300,
    subscription_start_date = CURRENT_TIMESTAMP
WHERE membership_tier = 'premium' OR account_tier = 'premium';

-- Create transaction records for initial allocation
INSERT INTO sms_bucks_transactions (user_id, amount, transaction_type, balance_after, description)
SELECT 
  id as user_id,
  300 as amount,
  'monthly_allowance' as transaction_type,
  300 as balance_after,
  'Initial SMS Bucks allocation' as description
FROM users 
WHERE membership_tier = 'premium' OR account_tier = 'premium';

-- ============================================
-- STEP 11: CREATE CURRENT ACTIVE COMPETITION
-- For this week
-- ============================================

INSERT INTO weekly_competitions (
  year, 
  week_number, 
  season,
  nfl_week,
  start_date, 
  end_date, 
  prize_amount,
  status
)
VALUES (
  EXTRACT(YEAR FROM CURRENT_DATE),
  EXTRACT(WEEK FROM CURRENT_DATE),
  2024, -- Current NFL season
  7, -- Current NFL week (UPDATE THIS based on actual week)
  DATE_TRUNC('week', CURRENT_DATE), -- Start of current week (Sunday)
  DATE_TRUNC('week', CURRENT_DATE) + INTERVAL '6 days', -- End of week (Saturday)
  50.00,
  'active'
)
ON CONFLICT (year, week_number) DO NOTHING;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'SMS Bucks database migration completed successfully!' as status;
