-- ============================================
-- WEEKLY COMPETITION OPT-IN SYSTEM - PHASE 1
-- Database Schema Updates
-- StatMind Sports - October 2025
-- ============================================

-- ============================================
-- STEP 1: ADD OPT-IN TRACKING TO USERS TABLE
-- ============================================

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS competition_opted_in BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS competition_opt_in_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS competition_opt_out_date TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_users_opted_in ON users(competition_opted_in) WHERE competition_opted_in = TRUE;

COMMENT ON COLUMN users.competition_opted_in IS 'Whether user is currently opted into this weeks competition';
COMMENT ON COLUMN users.competition_opt_in_date IS 'When user last opted into competition';
COMMENT ON COLUMN users.competition_opt_out_date IS 'When user last opted out of competition';

-- ============================================
-- STEP 2: ADD PRACTICE PARLAY TRACKING TO USER_PARLAYS
-- ============================================

ALTER TABLE user_parlays
ADD COLUMN IF NOT EXISTS is_practice_parlay BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_parlays_practice ON user_parlays(is_practice_parlay);
CREATE INDEX IF NOT EXISTS idx_parlays_user_practice ON user_parlays(user_id, is_practice_parlay);

COMMENT ON COLUMN user_parlays.is_practice_parlay IS 'TRUE = free practice parlay, FALSE = paid competition parlay';

-- ============================================
-- STEP 3: ADD PRECISE TIMING TO WEEKLY_COMPETITIONS
-- ============================================

ALTER TABLE weekly_competitions
ADD COLUMN IF NOT EXISTS start_datetime TIMESTAMP,
ADD COLUMN IF NOT EXISTS end_datetime TIMESTAMP;

COMMENT ON COLUMN weekly_competitions.start_datetime IS 'Exact competition start time (Tuesday 2:00 AM ET)';
COMMENT ON COLUMN weekly_competitions.end_datetime IS 'Exact competition end time (Sunday 3:50 PM ET)';

-- ============================================
-- STEP 4: UPDATE EXISTING DATA
-- Set all existing parlays as competition parlays (not practice)
-- ============================================

UPDATE user_parlays 
SET is_practice_parlay = FALSE 
WHERE is_practice_parlay IS NULL;

-- Reset all users opt-in status for fresh start
UPDATE users 
SET competition_opted_in = FALSE,
    competition_opt_in_date = NULL,
    competition_opt_out_date = NULL;

-- ============================================
-- STEP 5: UPDATE SMS BUCKS COST FUNCTION
-- Change to flat 100 SMS Bucks for all parlays
-- ============================================

CREATE OR REPLACE FUNCTION calculate_sms_bucks_cost(leg_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- NEW RULE: All competition parlays cost 100 SMS Bucks
  RETURN 100;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- STEP 6: UPDATE POINTS CALCULATION FUNCTION
-- Change to new point values: 2, 6, 12, 25, 50
-- ============================================

CREATE OR REPLACE FUNCTION calculate_points_earned(leg_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  RETURN CASE 
    WHEN leg_count = 2 THEN 2
    WHEN leg_count = 3 THEN 6
    WHEN leg_count = 4 THEN 12
    WHEN leg_count = 5 THEN 25
    WHEN leg_count >= 6 THEN 50
    ELSE 0
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- MIGRATION COMPLETE
-- ============================================

SELECT 'Phase 1 - Opt-in system database migration completed successfully!' as status;