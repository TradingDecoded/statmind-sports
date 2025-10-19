// frontend/src/utils/dateTimeUtils.js

/**
 * Format game date and time for display
 * @param {string|Date} dateInput - Date string or Date object
 * @param {boolean} includeYear - Whether to include the year (default: false)
 * @returns {string} Formatted date with time (e.g., "Thu, Oct 16, 2025 • 8:20 PM ET")
 */
export function formatGameDateTime(dateInput, includeYear = false) {
  const date = new Date(dateInput);
  
  // Format date part
  const dateOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(includeYear && { year: 'numeric' })
  };
  
  const datePart = date.toLocaleDateString('en-US', dateOptions);
  
  // Format time part (12-hour format with ET timezone)
  const timeOptions = {
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'America/New_York',
    hour12: true
  };
  
  const timePart = date.toLocaleTimeString('en-US', timeOptions);
  
  // Combine with bullet separator
  return `${datePart} • ${timePart} ET`;
}

/**
 * Format just the date (no time) - for backwards compatibility
 * @param {string|Date} dateInput - Date string or Date object
 * @param {boolean} includeYear - Whether to include the year
 * @returns {string} Formatted date (e.g., "Thu, Oct 16, 2025")
 */
export function formatGameDate(dateInput, includeYear = false) {
  const date = new Date(dateInput);
  
  const dateOptions = {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(includeYear && { year: 'numeric' })
  };
  
  return date.toLocaleDateString('en-US', dateOptions);
}

/**
 * Format short date with time for compact displays
 * @param {string|Date} dateInput - Date string or Date object
 * @returns {string} Formatted short date with time (e.g., "Sun, Oct 19 • 1:00 PM ET")
 */
export function formatShortGameDateTime(dateInput) {
  return formatGameDateTime(dateInput, false);
}