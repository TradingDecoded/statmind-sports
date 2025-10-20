'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for auto-refreshing data during NFL game windows
 * @param {Function} refreshFunction - Function to call for refresh
 * @param {Object} options - Configuration options
 * @returns {Object} - Control functions and state
 */
export function useAutoRefresh(refreshFunction, options = {}) {
  const {
    intervalMs = 60000, // Default 60 seconds
    enabledDays = [0, 1, 4], // Sunday=0, Monday=1, Thursday=4
    enabledHours = { 0: [12, 23], 1: [18, 23], 4: [18, 23] }, // Game windows
    stopWhenAllFinal = true,
    checkAllFinalFunction = null
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const intervalRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const isVisibleRef = useRef(true);

  // Check if we're in a game window
  const isGameWindow = () => {
    const now = new Date();
    const day = now.getDay(); // 0=Sunday, 1=Monday, etc.
    const hour = now.getHours(); // 0-23

    // Check if today is a game day
    if (!enabledDays.includes(day)) {
      return false;
    }

    // Check if we're in the time window for this day
    const [startHour, endHour] = enabledHours[day] || [0, 0];
    return hour >= startHour && hour <= endHour;
  };

  // Handle visibility change (stop when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
      
      if (document.hidden) {
        console.log('🔄 Page hidden - pausing auto-refresh');
      } else {
        console.log('🔄 Page visible - resuming auto-refresh');
        // Refresh immediately when coming back
        if (!isPaused && isGameWindow()) {
          performRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused]);

  // Perform the refresh
  const performRefresh = async () => {
    if (isPaused || !isVisibleRef.current) {
      console.log('⏸️ Refresh skipped - paused or not visible');
      return;
    }

    // Check if all games are final (if applicable)
    if (stopWhenAllFinal && checkAllFinalFunction) {
      const allFinal = await checkAllFinalFunction();
      if (allFinal) {
        console.log('✅ All games final - stopping auto-refresh');
        stopAutoRefresh();
        return;
      }
    }

    console.log('🔄 Auto-refreshing data...');
    setIsRefreshing(true);
    
    try {
      await refreshFunction();
      setLastUpdated(new Date());
      setSecondsSinceUpdate(0);
    } catch (error) {
      console.error('❌ Auto-refresh error:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Start auto-refresh
  const startAutoRefresh = () => {
    if (intervalRef.current) {
      return; // Already running
    }

    if (!isGameWindow()) {
      console.log('⏸️ Not in game window - auto-refresh not started');
      return;
    }

    console.log(`🔴 Starting auto-refresh (${intervalMs / 1000}s intervals)`);
    
    // Perform initial refresh
    performRefresh();

    // Set up the refresh interval
    intervalRef.current = setInterval(() => {
      performRefresh();
    }, intervalMs);

    // Set up the ticker for "X seconds ago"
    tickIntervalRef.current = setInterval(() => {
      setSecondsSinceUpdate(prev => prev + 1);
    }, 1000);
  };

  // Stop auto-refresh
  const stopAutoRefresh = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      console.log('⏹️ Auto-refresh stopped');
    }
    if (tickIntervalRef.current) {
      clearInterval(tickIntervalRef.current);
      tickIntervalRef.current = null;
    }
  };

  // Toggle pause
  const togglePause = () => {
    setIsPaused(prev => !prev);
  };

  // Manual refresh
  const manualRefresh = () => {
    performRefresh();
  };

  // Initialize on mount
  useEffect(() => {
    startAutoRefresh();

    // Cleanup on unmount
    return () => {
      stopAutoRefresh();
    };
  }, []);

  // Resume when unpause
  useEffect(() => {
    if (!isPaused && isGameWindow()) {
      startAutoRefresh();
    } else if (isPaused) {
      stopAutoRefresh();
    }
  }, [isPaused]);

  return {
    isRefreshing,
    isPaused,
    lastUpdated,
    secondsSinceUpdate,
    isGameWindow: isGameWindow(),
    togglePause,
    manualRefresh,
    stopAutoRefresh
  };
}
