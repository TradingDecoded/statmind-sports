// frontend/src/utils/api.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';

/**
 * Fetch predictions for a specific week and season
 */
export async function fetchWeekPredictions(season, week) {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions/week/${season}/${week}`, {
      cache: 'no-store' // Always get fresh data
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error('Error fetching week predictions:', error);
    return [];
  }
}

/**
 * Fetch upcoming predictions
 */
export async function fetchUpcomingPredictions(limit = 10) {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions/upcoming?limit=${limit}`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    return data.predictions || [];
  } catch (error) {
    console.error('Error fetching upcoming predictions:', error);
    return [];
  }
}

/**
 * Check backend health status
 */
export async function checkBackendStatus() {
  try {
    const response = await fetch(`${API_BASE_URL}/status`, {
      cache: 'no-store'
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error checking backend status:', error);
    return null;
  }
}

/**
 * Get current NFL season and week
 * This is a helper function - you may want to create an API endpoint for this
 */
export function getCurrentSeasonWeek() {
  const now = new Date();
  const year = now.getFullYear();
  
  // NFL season typically starts in September
  // This is a simplified version - you may want to make this more sophisticated
  const season = now.getMonth() >= 8 ? year : year - 1;
  
  // Calculate approximate week (simplified)
  const seasonStart = new Date(season, 8, 1); // September 1st
  const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  const week = Math.min(Math.max(weeksDiff + 1, 1), 18);
  
  return { season, week };
}