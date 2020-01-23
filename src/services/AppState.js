import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState } from 'react-native';

const separator = Date.now();
const AppStateContext = createContext(null);

export const AppStateProvider = ({ children, value = {} }) => {
  const appState = useState(value);
  const [, setAppState] = appState;

  useEffect(() => {
    const changeListener = ({ appState: activityStatus }) => {
      setAppState((appState) => ({
        ...appState,
        activityStatus,
      }));
    };

    AppState.addEventListener('change', changeListener);

    return () => {
      AppState.removeEventListener('change', changeListener);
    };
  }, [true]);

  return (
    <AppStateContext.Provider value={appState}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  return useContext(AppStateContext);
};

useAppState.scope = (scope) => {
  const [appState, setAppState] = useAppState();
  const scopeKeys = Object.keys(scope);
  const scopeValues = Object.values(scope);

  useEffect(() => {
    setAppState({
      ...appState,
      ...scope,
    });

    return () => {
      setAppState({ ...appState });
    };
  }, [...scopeKeys, separator, ...scopeValues]);
};
