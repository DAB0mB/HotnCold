import React, { createContext, useContext, useCallback, useRef } from 'react';

import { useNavigation } from './Navigation';

const LoadingContext = createContext(null);

export const LoadingProvider = ({ setLoading, children }) => {
  return (
    <LoadingContext.Provider value={setLoading}>
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const _setLoading = useContext(LoadingContext);
  const calledRef = useRef(false);

  const setLoading = useCallback((loading) => {
    if (calledRef.current) return;

    _setLoading(loading);
    calledRef.current = true;

    setImmediate(() => {
      calledRef.current = false;
    });
  }, [_setLoading]);

  return setLoading;
};
