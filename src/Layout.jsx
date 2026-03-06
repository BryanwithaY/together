import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from './components/BottomTabBar';
import useSystemTheme from './components/hooks/useSystemTheme';
import { RelationshipProvider } from './components/relationship/RelationshipContext.jsx';
import AppLoadingScreen from './components/AppLoadingScreen';

function PageLoadingBar({ locationKey }) {
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef(null);
  const showTimerRef = useRef(null);

  useEffect(() => {
    setProgress(0);
    setVisible(false);
    clearTimeout(timerRef.current);
    clearTimeout(showTimerRef.current);

    // Only show the bar if loading takes >250ms
    showTimerRef.current = setTimeout(() => {
      setVisible(true);
      setProgress(70);
      timerRef.current = setTimeout(() => {
        setProgress(100);
        setTimeout(() => setVisible(false), 300);
      }, 600);
    }, 250);

    return () => {
      clearTimeout(timerRef.current);
      clearTimeout(showTimerRef.current);
    };
  }, [locationKey]);

  if (!visible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[9998] h-0.5 bg-stone-100">
      <motion.div
        className="h-full bg-stone-600"
        initial={{ width: '0%' }}
        animate={{ width: `${progress}%` }}
        transition={{ duration: progress === 70 ? 0.4 : 0.3, ease: 'easeOut' }}
      />
    </div>
  );
}

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};

const pageTransition = { duration: 0.22, ease: 'easeInOut' };

// Show the loading screen exactly once per session
const SESSION_KEY = 'together_loaded';

export default function Layout({ children, currentPageName }) {
  useSystemTheme();
  const location = useLocation();
  const alreadyLoaded = useRef(sessionStorage.getItem(SESSION_KEY) === '1');
  const [showSplash, setShowSplash] = useState(false);

  useEffect(() => {
    if (alreadyLoaded.current) return;

    // Show splash only if the app takes >250ms to be "ready"
    // We schedule the splash to appear after 250ms; if the page loads faster,
    // we cancel it and skip the splash entirely.
    let splashShown = false;
    const showTimer = setTimeout(() => {
      splashShown = true;
      setShowSplash(true);
    }, 250);

    // After 3s total (from mount), hide it
    const hideTimer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 3000);

    // If the component unmounts before 250ms (i.e. page loaded fast), cancel both
    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
      if (!splashShown) sessionStorage.setItem(SESSION_KEY, '1');
    };
  }, []);

  return (
    <RelationshipProvider>
      <AnimatePresence>
        {showSplash && (
          <motion.div
            key="splash"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'fixed', inset: 0, zIndex: 9999 }}
          >
            <AppLoadingScreen />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="app-shell">
        <main className="main-content relative overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={pageTransition}
              className="w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomTabBar currentPageName={currentPageName} />
      </div>
    </RelationshipProvider>
  );
}