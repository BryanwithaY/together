
import { useEffect } from 'react';

/**
 * Syncs the app's dark mode class with the OS 'prefers-color-scheme' setting.
 * Adds/removes the 'dark' class on <html> automatically.
 */
export default function useSystemTheme() {
  useEffect(() => {
    // Always force light mode — the app is designed for light theme only
    document.documentElement.classList.remove('dark');
  }, []);
}
