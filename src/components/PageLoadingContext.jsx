import React, { createContext, useContext, useState, useCallback } from 'react';

const PageLoadingContext = createContext({ setPageReady: () => {} });

export function PageLoadingProvider({ children, onReady }) {
  const [ready, setReady] = useState(false);

  const setPageReady = useCallback(() => {
    if (!ready) {
      setReady(true);
      if (onReady) onReady();
    }
  }, [ready, onReady]);

  return (
    <PageLoadingContext.Provider value={{ setPageReady }}>
      {children}
    </PageLoadingContext.Provider>
  );
}

export function usePageLoading() {
  return useContext(PageLoadingContext);
}