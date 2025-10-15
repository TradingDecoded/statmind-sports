// frontend/src/utils/api.js

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://statmindsports.com/api';

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
 * Fetch historical accuracy data
 */
export async function fetchHistoricalAccuracy() {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions/accuracy/historical`, {
      cache: 'no-store' // Always get fresh data
    });
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Transform the data to match our component expectations
    return {
      overall: data.overall || {},
      bySeason: data.bySeason || [],
      byConfidence: data.byConfidence || [],
      weeklyBreakdown: data.weeklyBreakdown || []
    };
  } catch (error) {
    console.error('Error fetching historical accuracy:', error);
    return null;
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
  
  // Calculate approximate week
  const seasonStart = new Date(season, 8, 1); // September 1st
  const weeksDiff = Math.floor((now - seasonStart) / (7 * 24 * 60 * 60 * 1000));
  const week = Math.min(Math.max(weeksDiff + 1, 1), 18); // NFL has 18 weeks
  
  return { season, week };
}

// ============================================
// NEW FUNCTIONS FOR HISTORICAL RESULTS
// ============================================

/**
 * Fetch historical results with optional filters
 */
export async function fetchResults(filters = {}) {
  const params = new URLSearchParams();
  
  if (filters.season) params.append('season', filters.season);
  if (filters.week) params.append('week', filters.week);
  if (filters.confidence && filters.confidence !== 'ALL') {
    params.append('confidence', filters.confidence);
  }
  if (filters.sort) params.append('sort', filters.sort);

  const response = await fetch(`${API_BASE_URL}/predictions/results?${params}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch results');
  }

  return {
    results: data.results,
    stats: data.stats,
    count: data.count
  };
}

/**
 * Fetch available seasons and weeks for results
 */
export async function fetchAvailableResultsData() {
  const response = await fetch(`${API_BASE_URL}/predictions/results/available`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch available data');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch available data');
  }

  return {
    seasons: data.seasons,
    weeks: data.weeks
  };
}

/**
 * Fetch single game result details
 */
export async function fetchGameResult(gameId) {
  const response = await fetch(`${API_BASE_URL}/predictions/results/${gameId}`, {
    cache: 'no-store'
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch game result');
  }

  const data = await response.json();
  
  if (!data.success) {
    throw new Error(data.error || 'Failed to fetch game result');
  }

  return data.result;
}