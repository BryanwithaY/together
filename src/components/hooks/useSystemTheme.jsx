import { useEffect } from 'react';

/**
 * Syncs the app's dark mode class with the OS 'prefers-color-scheme' setting.
 * Adds/removes the 'dark' class on <html> automatically.
 */
export default function useSystemTheme() {
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };

    // Apply immediately
    apply(mediaQuery);

    mediaQuery.addEventListener('change', apply);
    return () => mediaQuery.removeEventListener('change', apply);
  }, []);
}