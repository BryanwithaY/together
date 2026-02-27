import React from 'react';
import { useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import BottomTabBar from './components/BottomTabBar';
import useSystemTheme from './components/hooks/useSystemTheme';

const pageVariants = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit:    { opacity: 0, x: -24 },
};

const pageTransition = { duration: 0.22, ease: 'easeInOut' };

export default function Layout({ children, currentPageName }) {
  const location = useLocation();

  return (
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
  );
}