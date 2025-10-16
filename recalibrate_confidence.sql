-- Recalibrate confidence levels for all existing predictions
-- Option A: 70/60 thresholds

UPDATE predictions
SET confidence = CASE
  WHEN GREATEST(
    CAST(home_win_probability AS DECIMAL),
    CAST(away_win_probability AS DECIMAL)
  ) >= 0.70 THEN 'High'
  
  WHEN GREATEST(
    CAST(home_win_probability AS DECIMAL),
    CAST(away_win_probability AS DECIMAL)
  ) >= 0.60 THEN 'Medium'
  
  ELSE 'Low'
END;

-- Verify the changes
SELECT 
  confidence,
  COUNT(*) as total_predictions,
  ROUND(AVG(CASE WHEN is_correct THEN 100 ELSE 0 END), 1) as accuracy
FROM predictions
WHERE is_correct IS NOT NULL
GROUP BY confidence
ORDER BY confidence DESC;
