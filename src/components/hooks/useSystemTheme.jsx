
import { useEffect } from 'react';

/**
 * Locks the app to light mode always — ensures consistent readability.
 */
export default function useSystemTheme() {
  useEffect(() => {
    // Always use light mode for consistent legible UI
    document.documentElement.classList.remove('dark');
  }, []);
}
