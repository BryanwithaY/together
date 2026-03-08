import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from './components/BottomTabBar';
import useSystemTheme from './components/hooks/useSystemTheme';
import { RelationshipProvider } from './components/relationship/RelationshipContext.jsx';
import AppLoadingScreen from './components/AppLoadingScreen';
import { PageLoadingProvider } from './components/PageLoadingContext.jsx';

function PageLoadingOverlay({ visible }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="page-loader"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[9998] bg-stone-50 flex flex-col items-center justify-center gap-4"
        >
          <div className="w-10 h-10 rounded-2xl bg-stone-800 flex items-center justify-center">
            <span className="text-white text-lg">✦</span>
          </div>
          <div className="flex gap-1.5">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-stone-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.18 }}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
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
  const [pageLoading, setPageLoading] = useState(false);
  const pageLoadingRef = useRef(false);

  const handleSplashReady = () => {
    setShowSplash(false);
    sessionStorage.setItem(SESSION_KEY, '1');
  };

  // When route changes, show the overlay and wait for page to signal ready
  useEffect(() => {
    setPageLoading(true);
    pageLoadingRef.current = true;

    // Safety fallback: hide after 8s — generous but prevents permanent freeze
    const fallback = setTimeout(() => {
      setPageLoading(false);
      pageLoadingRef.current = false;
    }, 8000);

    return () => clearTimeout(fallback);
  }, [location.key]);

  const handlePageReady = useCallback(() => {
    setPageLoading(false);
    pageLoadingRef.current = false;
  }, []);

  useEffect(() => {
    if (alreadyLoaded.current) return;

    let splashShown = false;
    const showTimer = setTimeout(() => {
      splashShown = true;
      setShowSplash(true);
    }, 250);

    return () => {
      clearTimeout(showTimer);
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
            <AppLoadingScreen onReady={handleSplashReady} />
          </motion.div>
        )}
      </AnimatePresence>

      <PageLoadingOverlay visible={pageLoading && !showSplash} />
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
              <PageLoadingProvider onReady={handlePageReady}>
                {children}
              </PageLoadingProvider>
            </motion.div>
          </AnimatePresence>
        </main>
        <BottomTabBar currentPageName={currentPageName} />
      </div>
    </RelationshipProvider>
  );
}