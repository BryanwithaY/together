import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from './components/BottomTabBar';
import useSystemTheme from './components/hooks/useSystemTheme';
import { RelationshipProvider } from './components/relationship/RelationshipContext.jsx';
import AppLoadingScreen from './components/AppLoadingScreen';

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
  const [showSplash, setShowSplash] = useState(!alreadyLoaded.current);

  useEffect(() => {
    if (alreadyLoaded.current) return;
    // Minimum display time: 3 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
      sessionStorage.setItem(SESSION_KEY, '1');
    }, 3000);
    return () => clearTimeout(timer);
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