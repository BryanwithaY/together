import React from 'react';
import BottomTabBar from './components/BottomTabBar';

export default function Layout({ children, currentPageName }) {
  return (
    <div className="app-shell">
      {/* Safe-area top padding handled per-page in their headers */}
      <main className="main-content">
        {children}
      </main>
      <BottomTabBar currentPageName={currentPageName} />
    </div>
  );
}