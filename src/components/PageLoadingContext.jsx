import React, { createContext, useContext, useRef, useCallback } from 'react';

const PageLoadingContext = createContext({ setPageReady: () => {} });

export function PageLoadingProvider({ children, onReady }) {
  // Use a ref so setPageReady never re-creates due to stale closure over `ready`
  const firedRef = useRef(false);

  const setPageReady = useCallback(() => {
    if (!firedRef.current) {
      firedRef.current = true;
      if (onReady) onReady();
    }
  }, [onReady]);

  return (
    <PageLoadingContext.Provider value={{ setPageReady }}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  return useContext(PageLoadingContext);
}