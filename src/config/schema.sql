-- ======================================
-- StatMind Sports Database Schema v1.0
-- ======================================

-- ==============================
-- TEAMS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS teams (
    id SERIAL PRIMARY KEY,
    team_id VARCHAR(50) UNIQUE NOT NULL,
    key VARCHAR(10) UNIQUE NOT NULL,
    city VARCHAR(100),
    name VARCHAR(100) NOT NULL,
    conference VARCHAR(10),
    division VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- GAMES TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS games (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(50) UNIQUE NOT NULL,
    season INTEGER NOT NULL,
    week INTEGER NOT NULL,
    game_date TIMESTAMP NOT NULL,
    home_team VARCHAR(10) REFERENCES teams(key),
    away_team VARCHAR(10) REFERENCES teams(key),
    home_score INTEGER,
    away_score INTEGER,
    status VARCHAR(50) DEFAULT 'scheduled',
    is_final BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_games_date ON games(game_date);
CREATE INDEX IF NOT EXISTS idx_games_week ON games(week, season);
CREATE INDEX IF NOT EXISTS idx_games_season ON games(season);

-- ==============================
-- TEAM STATISTICS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS team_statistics (
    id SERIAL PRIMARY KEY,
    team_key VARCHAR(10) UNIQUE NOT NULL REFERENCES teams(key),
    wins INTEGER DEFAULT 0,
    losses INTEGER DEFAULT 0,
    ties INTEGER DEFAULT 0,
    points_for INTEGER DEFAULT 0,
    points_against INTEGER DEFAULT 0,
    home_wins INTEGER DEFAULT 0,
    home_losses INTEGER DEFAULT 0,
    away_wins INTEGER DEFAULT 0,
    away_losses INTEGER DEFAULT 0,
    offensive_rating DECIMAL(5,2) DEFAULT 0,
    defensive_rating DECIMAL(5,2) DEFAULT 0,
    elo_rating DECIMAL(7,2) DEFAULT 1500,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- PREDICTIONS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS predictions (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(50) UNIQUE NOT NULL REFERENCES games(game_id),
    predicted_winner VARCHAR(10) NOT NULL,
    predicted_home_score DECIMAL(5,2),
    predicted_away_score DECIMAL(5,2),
    home_win_probability DECIMAL(5,3) NOT NULL,
    away_win_probability DECIMAL(5,3) NOT NULL,
    confidence VARCHAR(10) NOT NULL,
    reasoning TEXT,
    elo_score DECIMAL(5,2),
    power_score DECIMAL(5,2),
    situational_score DECIMAL(5,2),
    matchup_score DECIMAL(5,2),
    recent_form_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_predictions_game ON predictions(game_id);

-- ==============================
-- PREDICTION RESULTS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS prediction_results (
    id SERIAL PRIMARY KEY,
    game_id VARCHAR(50) UNIQUE NOT NULL REFERENCES games(game_id),
    predicted_winner VARCHAR(10),
    actual_winner VARCHAR(10),
    is_correct BOOLEAN,
    verified_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==============================
-- SEASON STATS TABLE
-- ==============================
CREATE TABLE IF NOT EXISTS season_stats (
    season INTEGER PRIMARY KEY,
    total_games INTEGER DEFAULT 0,
    completed_games INTEGER DEFAULT 0,
    predictions_generated INTEGER DEFAULT 0,
    correct_predictions INTEGER DEFAULT 0,
    accuracy_rate DECIMAL(5,2),
    best_week INTEGER,
    best_week_accuracy DECIMAL(5,2),
    worst_week INTEGER,
    worst_week_accuracy DECIMAL(5,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_current_season BOOLEAN DEFAULT FALSE
);

-- ==============================
-- VIEWS
-- ==============================
CREATE OR REPLACE VIEW prediction_accuracy_by_season AS
SELECT  
  g.season,
  COUNT(*) AS total_predictions,
  COUNT(CASE WHEN pr.is_correct = TRUE THEN 1 END) AS correct_predictions,
  ROUND((COUNT(CASE WHEN pr.is_correct = TRUE THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 2) AS accuracy_percentage
FROM predictions p
JOIN games g ON p.game_id = g.game_id
LEFT JOIN prediction_results pr ON p.game_id = pr.game_id
WHERE pr.is_correct IS NOT NULL
GROUP BY g.season
ORDER BY g.season DESC;

CREATE OR REPLACE VIEW prediction_accuracy_overall AS
SELECT  
  COUNT(*) AS total_predictions,
  COUNT(CASE WHEN pr.is_correct = TRUE THEN 1 END) AS correct_predictions,
  ROUND((COUNT(CASE WHEN pr.is_correct = TRUE THEN 1 END)::decimal / NULLIF(COUNT(*), 0)) * 100, 2) AS accuracy_percentage,
  MIN(g.season) AS first_season,
  MAX(g.season) AS latest_season,
  COUNT(DISTINCT g.season) AS total_seasons
FROM predictions p
JOIN games g O
