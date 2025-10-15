#!/bin/bash
# Complete database diagnostic for all seasons

cd /root/statmind-sports
source .env

echo "🔍 COMPLETE DATABASE DIAGNOSTIC"
echo "================================="
echo ""

PGPASSWORD=$DB_PASSWORD psql -h localhost -U $DB_USER -d $DB_NAME << 'EOF'

\echo '1️⃣  ALL SEASONS IN DATABASE:'
\echo '----------------------------'
SELECT 
    season,
    COUNT(*) as total_games,
    COUNT(CASE WHEN home_score IS NOT NULL THEN 1 END) as completed_games,
    COUNT(CASE WHEN home_score IS NULL THEN 1 END) as upcoming_games,
    MIN(game_date) as first_game,
    MAX(game_date) as last_game
FROM games
GROUP BY season
ORDER BY season DESC;

\echo ''
\echo '2️⃣  PREDICTIONS BY SEASON:'
\echo '----------------------------'
SELECT 
    g.season,
    COUNT(DISTINCT p.game_id) as games_with_predictions
FROM games g
LEFT JOIN predictions p ON g.game_id = p.game_id
GROUP BY g.season
ORDER BY g.season DESC;

\echo ''
\echo '3️⃣  PREDICTION_RESULTS BY SEASON:'
\echo '----------------------------'
SELECT 
    g.season,
    COUNT(DISTINCT pr.game_id) as games_with_results,
    SUM(CASE WHEN pr.is_correct THEN 1 ELSE 0 END) as correct,
    ROUND(AVG(CASE WHEN pr.is_correct THEN 100.0 ELSE 0 END), 1) as accuracy
FROM games g
LEFT JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL
GROUP BY g.season
ORDER BY g.season DESC;

\echo ''
\echo '4️⃣  MISSING PREDICTIONS (Completed games without predictions):'
\echo '----------------------------'
SELECT 
    g.season,
    COUNT(*) as completed_games_missing_predictions
FROM games g
LEFT JOIN predictions p ON g.game_id = p.game_id
WHERE g.home_score IS NOT NULL
    AND p.game_id IS NULL
GROUP BY g.season
ORDER BY g.season DESC;

\echo ''
\echo '5️⃣  MISSING PREDICTION_RESULTS (Completed games with predictions but no results):'
\echo '----------------------------'
SELECT 
    g.season,
    COUNT(*) as missing_results
FROM games g
JOIN predictions p ON g.game_id = p.game_id
LEFT JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL
    AND pr.game_id IS NULL
GROUP BY g.season
ORDER BY g.season DESC;

\echo ''
\echo '6️⃣  2025 SEASON DETAILS (Week by Week):'
\echo '----------------------------'
SELECT 
    week,
    COUNT(*) as total_games,
    COUNT(CASE WHEN home_score IS NOT NULL THEN 1 END) as completed,
    COUNT(CASE WHEN home_score IS NULL THEN 1 END) as upcoming
FROM games
WHERE season = 2025
GROUP BY week
ORDER BY week;

\echo ''
\echo '7️⃣  SAMPLE GAMES FROM EACH SEASON (to verify data exists):'
\echo '----------------------------'
SELECT 
    g.season,
    g.week,
    g.game_date,
    g.home_team,
    g.away_team,
    g.home_score,
    g.away_score,
    CASE WHEN p.game_id IS NOT NULL THEN '✅' ELSE '❌' END as has_prediction,
    CASE WHEN pr.game_id IS NOT NULL THEN '✅' ELSE '❌' END as has_result
FROM games g
LEFT JOIN predictions p ON g.game_id = p.game_id
LEFT JOIN prediction_results pr ON g.game_id = pr.game_id
WHERE g.home_score IS NOT NULL
    AND g.season IN (2020, 2021, 2022, 2023, 2024, 2025)
ORDER BY g.season DESC, g.week DESC
LIMIT 3;

\echo ''
\echo '================================='
\echo '✅ Diagnostic Complete'
\echo ''

EOF

echo ""
echo "📊 Analysis:"
echo "------------"
echo "Based on the results above:"
echo "1. Check if seasons 2020-2023 have COMPLETED games (home_score NOT NULL)"
echo "2. Check if those completed games have PREDICTIONS"
echo "3. Check if those games have PREDICTION_RESULTS"
echo ""
echo "The issue is likely:"
echo "  - Historical seasons (2020-2024) have games but NO PREDICTIONS generated yet"
echo "  - OR predictions exist but NO PREDICTION_RESULTS populated"
echo ""
