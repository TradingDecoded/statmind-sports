#!/bin/bash
# Quick fix for Results page issues - Fixed Authentication

echo "🔧 StatMind Sports - Quick Fix Script"
echo "======================================"
echo ""

# Use -h localhost to force TCP connection instead of peer authentication
psql -h localhost -U statmind_user -d statmind_db << 'EOF'

-- Show current status
\echo '📊 Current Database Status:'
\echo ''

\echo '1. Games by season (with completion status):'
SELECT 
    season, 
    COUNT(*) as total_games,
    COUNT(CASE WHEN home_score IS NOT NULL THEN 1 END) as completed_games
FROM games
GROUP BY season
ORDER BY season DESC;

\echo ''
\echo '2. Current confidence distribution:'
SELECT 
    confidence,
    COUNT(*) as count
FROM predictions
GROUP BY confidence
ORDER BY confidence;

\echo ''
\echo '======================================'
\echo '🔨 Applying fixes...'
\echo ''

-- FIX #1: Recalculate confidence levels based on win probabilities
\echo 'Fix #1: Updating confidence levels...'
UPDATE predictions
SET confidence = CASE 
    WHEN GREATEST(home_win_probability, away_win_probability) >= 0.65 THEN 'High'
    WHEN GREATEST(home_win_probability, away_win_probability) >= 0.55 THEN 'Medium'
    ELSE 'Low'
END;

\echo '✅ Confidence levels updated'
\echo ''

-- FIX #2: Populate missing prediction_results
\echo 'Fix #2: Populating prediction results for completed games...'
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
\echo ''

-- Show updated status
\echo '======================================'
\echo '📊 Updated Status:'
\echo ''

\echo '1. New confidence distribution:'
SELECT 
    confidence,
    COUNT(*) as count,
    ROUND(AVG(GREATEST(home_win_probability, away_win_probability) * 100), 1) as avg_probability
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
    COUNT(*) as total_games,
    SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct,
    ROUND(AVG(CASE WHEN pr.is_correct THEN 100.0 ELSE 0 END), 1) as accuracy_pct
FROM games g
INNER JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL
GROUP BY g.season
ORDER BY g.season DESC;

\echo ''
\echo '3. Sample results (latest games):'
SELECT 
    g.season,
    g.week,
    g.home_team || ' vs ' || g.away_team as matchup,
    g.home_score || '-' || g.away_score as score,
    p.predicted_winner,
    p.confidence,
    CASE WHEN pr.is_correct THEN '✅' ELSE '❌' END as result
FROM games g
JOIN predictions p ON g.game_id = p.game_id
JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL
ORDER BY g.game_date DESC
LIMIT 10;

\echo ''
\echo '======================================'
\echo '✅ All fixes complete!'
\echo ''

EOF

echo ""
echo "🎉 Database fixes applied successfully!"
echo ""
echo "🌐 Now test your Results page:"
echo "   https://statmindsports.com/results"
echo ""
echo "🔄 You may need to refresh the page (Ctrl+F5) to see changes"