#!/bin/bash
# Complete fix for all Results page issues

cd /root/statmind-sports
source .env

echo "🔧 Fixing all Results page issues..."
echo ""

PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME << 'EOF'

-- ============================================
-- DIAGNOSTIC: Check current state
-- ============================================
\echo '📊 CURRENT STATE:'
\echo ''

\echo '1. Win probability samples (checking decimal format):'
SELECT 
    home_team || ' vs ' || away_team as game,
    home_win_probability,
    away_win_probability,
    confidence
FROM predictions p
JOIN games g ON p.game_id = g.game_id
LIMIT 5;

\echo ''
\echo '2. Seasons with completed games:'
SELECT 
    season,
    COUNT(*) as completed_games
FROM games
WHERE home_score IS NOT NULL
GROUP BY season
ORDER BY season DESC;

\echo ''
\echo '======================================'
\echo '🔨 APPLYING FIXES...'
\echo ''

-- ============================================
-- FIX #1: Probabilities are stored as decimals (0.65) 
-- but showing as 0.65% - they should display as 65%
-- This is actually a display issue, but let's verify data
-- ============================================

\echo 'Fix #1: Checking probability format...'
SELECT 
    'Probability Range Check' as check_name,
    MIN(GREATEST(home_win_probability, away_win_probability)) as min_prob,
    MAX(GREATEST(home_win_probability, away_win_probability)) as max_prob,
    AVG(GREATEST(home_win_probability, away_win_probability)) as avg_prob
FROM predictions;

-- ============================================
-- FIX #2: Recalculate confidence with correct thresholds
-- Probabilities are 0.0-1.0 format (e.g., 0.65 = 65%)
-- ============================================

\echo ''
\echo 'Fix #2: Updating confidence levels with correct thresholds...'

UPDATE predictions
SET confidence = CASE 
    WHEN GREATEST(home_win_probability, away_win_probability) >= 0.65 THEN 'High'
    WHEN GREATEST(home_win_probability, away_win_probability) >= 0.55 THEN 'Medium'
    ELSE 'Low'
END;

\echo '✅ Confidence levels recalculated'

-- ============================================
-- FIX #3: Ensure prediction_results exist for ALL completed games
-- ============================================

\echo ''
\echo 'Fix #3: Populating prediction_results for all completed games...'

INSERT INTO prediction_results (game_id, predicted_winner, actual_winner, is_correct)
SELECT 
    g.game_id,
    p.predicted_winner,
    CASE 
        WHEN g.home_score > g.away_score THEN g.home_team
        WHEN g.away_score > g.home_score THEN g.away_team
        ELSE NULL
    END as actual_winner,
    CASE 
        WHEN g.home_score > g.away_score AND p.predicted_winner = g.home_team THEN TRUE
        WHEN g.away_score > g.home_score AND p.predicted_winner = g.away_team THEN TRUE
        ELSE FALSE
    END as is_correct
FROM games g
JOIN predictions p ON g.game_id = p.game_id
LEFT JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL 
    AND g.away_score IS NOT NULL
    AND pr.game_id IS NULL
    AND g.home_score != g.away_score
ON CONFLICT (game_id) DO NOTHING;

\echo '✅ Prediction results populated'

-- ============================================
-- RESULTS: Show updated statistics
-- ============================================

\echo ''
\echo '======================================'
\echo '📊 UPDATED RESULTS:'
\echo ''

\echo '1. Confidence distribution (with probability ranges):'
SELECT 
    confidence,
    COUNT(*) as count,
    ROUND(MIN(GREATEST(home_win_probability, away_win_probability))::numeric * 100, 1) as min_prob_pct,
    ROUND(MAX(GREATEST(home_win_probability, away_win_probability))::numeric * 100, 1) as max_prob_pct,
    ROUND(AVG(GREATEST(home_win_probability, away_win_probability))::numeric * 100, 1) as avg_prob_pct
FROM predictions
GROUP BY confidence
ORDER BY 
    CASE confidence 
        WHEN 'High' THEN 1 
        WHEN 'Medium' THEN 2 
        WHEN 'Low' THEN 3 
    END;

\echo ''
\echo '2. Results by season:'
SELECT 
    g.season,
    COUNT(DISTINCT g.game_id) as total_games,
    SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct,
    COUNT(DISTINCT g.game_id) - SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as incorrect,
    ROUND(AVG(CASE WHEN pr.is_correct THEN 100.0 ELSE 0 END), 1) || '%' as accuracy
FROM games g
INNER JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL
GROUP BY g.season
ORDER BY g.season DESC;

\echo ''
\echo '3. Sample of High confidence predictions:'
SELECT 
    g.season,
    g.week,
    g.home_team || ' vs ' || g.away_team as matchup,
    p.confidence,
    ROUND(GREATEST(p.home_win_probability, p.away_win_probability)::numeric * 100, 1) || '%' as win_prob,
    CASE WHEN pr.is_correct THEN '✅ Correct' ELSE '❌ Wrong' END as result
FROM games g
JOIN predictions p ON g.game_id = p.game_id
JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL
    AND p.confidence = 'High'
ORDER BY g.game_date DESC
LIMIT 5;

\echo ''
\echo '4. Checking 2025 season data:'
SELECT 
    season,
    COUNT(*) as total_games,
    COUNT(CASE WHEN home_score IS NOT NULL THEN 1 END) as completed_games,
    COUNT(CASE WHEN home_score IS NULL THEN 1 END) as upcoming_games
FROM games
WHERE season = 2025
GROUP BY season;

\echo ''
\echo '======================================'
\echo '✅ DATABASE FIXES COMPLETE!'
\echo ''

EOF

echo ""
echo "✅ All database fixes applied!"
echo ""
echo "🎯 Next Steps:"
echo "1. The probabilities displaying as 0.518% is a FRONTEND display issue"
echo "2. We need to update the ResultCard component to multiply by 100"
echo "3. Checking if 2025 games exist and are completed..."
echo ""
echo "🌐 Refresh your Results page and check if you see:"
echo "   - High/Medium/Low confidence variety"
echo "   - Multiple seasons (if 2025 games are completed)"
echo ""
