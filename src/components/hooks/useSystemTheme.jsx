import { useEffect } from 'react';

/**
 * Syncs the app's dark mode class with the OS 'prefers-color-scheme' setting.
 * Adds/removes the 'dark' class on <html> automatically.
 */
export default function useSystemTheme() {
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');

    const apply = (dark) => {
      document.documentElement.classList.toggle('dark', dark);
    };

    apply(mq.matches);
    mq.addEventListener('change', (e) => apply(e.matches));
    return () => mq.removeEventListener('change', (e) => apply(e.matches));
  }, []);
}