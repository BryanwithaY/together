/**
 * Detect user's timezone from browser/device settings
 * Uses Intl API which respects OS timezone settings
 */
export function detectTimezone() {
  try {
    // Intl.DateTimeFormat().resolvedOptions() respects browser timezone
    // which is synced with OS timezone on mobile (iOS/Android)
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return timeZone || 'UTC';
  } catch (error) {
    console.error('Failed to detect timezone:', error);
    return 'UTC';
  }
}