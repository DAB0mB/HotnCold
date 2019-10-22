import React, { createContext, useContext, useCallback, useRef } from 'react';

import { useNavigation } from './Navigation';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ loadingState, children }) => {
  return (
    <LoadingContext.Provider value={loadingState}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const [isLoading, _setLoading] = useContext(LoadingContext);
  const calledRef = useRef(false);

  const setLoading = useCallback((isLoading) => {
    if (calledRef.current) return;

    _setLoading(isLoading);
    calledRef.current = true;

    setImmediate(() => {
      // Immediately after the last immediate in setLoading queue
      // TODO: Try to connect to React lifecycle
      setImmediate(() => {
        calledRef.current = false;
      });
    });
  }, [isLoading]);

  return setLoading;
};
