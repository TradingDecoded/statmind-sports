'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for auto-refreshing data ONLY when there are live games
 * @param {Function} refreshFunction - Function to call for refresh
 * @param {Object} options - Configuration options
 * @returns {Object} - Control functions and state
 */
export function useAutoRefresh(refreshFunction, options = {}) {
  const {
    intervalMs = 60000, // Default 60 seconds
    stopWhenAllFinal = true,
    checkAllFinalFunction = null,
    predictions = [] // Pass predictions array to check for live games
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [secondsSinceUpdate, setSecondsSinceUpdate] = useState(0);
  const [isGameWindow, setIsGameWindow] = useState(false);
  const intervalRef = useRef(null);
  const tickIntervalRef = useRef(null);
  const isVisibleRef = useRef(true);

  // Check if there are any LIVE games (has scores but not final)
  const checkForLiveGames = () => {
    if (!predictions || predictions.length === 0) {
      return false;
    }

    // A game is LIVE if it has scores BUT is not final
    const hasLiveGames = predictions.some(pred => 
      pred.homeScore !== null && 
      pred.awayScore !== null && 
      !pred.isFinal
    );

    console.log(`🎮 Live Games Check: ${hasLiveGames ? 'YES' : 'NO'} (${predictions.length} predictions checked)`);
    return hasLiveGames;
  };

  // Update isGameWindow whenever predictions change
  useEffect(() => {
    const hasLive = checkForLiveGames();
    setIsGameWindow(hasLive);
    
    if (hasLive && !intervalRef.current && !isPaused) {
      console.log('🟢 Live games detected - starting auto-refresh');
      startAutoRefresh();
    } else if (!hasLive && intervalRef.current) {
      console.log('🔴 No live games - stopping auto-refresh');
      stopAutoRefresh();
    }
  }, [predictions]);

  // Handle visibility change (stop when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;

      if (document.hidden) {
        console.log('🔄 Page hidden - pausing auto-refresh');
      } else {
        console.log('🔄 Page visible - resuming auto-refresh');
        // Refresh immediately when coming back
        if (!isPaused && checkForLiveGames()) {
          performRefresh();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPaused, predictions]);

  // Perform the refresh
  const performRefresh = async () => {
    if (isPaused || !isVisibleRef.current) {
      console.log('⏸️ Refresh skipped - paused or not visible');
      return;
    }

    // Check if there are live games
    if (!checkForLiveGames()) {
      console.log('⏸️ No live games - stopping auto-refresh');
      stopAutoRefresh();
      return;
    }

    // Check if all games are final (if applicable)
    if (stopWhenAllFinal && checkAllFinalFunction) {
      try {
        const allFinal = await checkAllFinalFunction();
        if (allFinal) {
          console.log('✅ All games final - stopping auto-refresh');
          stopAutoRefresh();
          return;
        }
      } catch (error) {
        console.error('Error checking if all final:', error);
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

    if (!checkForLiveGames()) {
      console.log('⏸️ No live games - auto-refresh not started');
      return;
    }

    console.log(`🔴 Starting auto-refresh (${intervalMs / 1000}s intervals) - LIVE GAMES DETECTED`);

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
    setIsGameWindow(false);
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
    const hasLive = checkForLiveGames();
    if (hasLive) {
      startAutoRefresh();
    }

    // Cleanup on unmount
    return () => {
      stopAutoRefresh();
    };
  }, []);

  // Resume when unpause
  useEffect(() => {
    if (!isPaused && checkForLiveGames()) {
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
    isGameWindow,
    togglePause,
    manualRefresh,
    stopAutoRefresh
  };
}