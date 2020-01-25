import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from 'react';
import { AppState } from 'react-native';

import { useStatePromise } from '../utils';

const separator = Date.now();
const AppStateContext = createContext(null);

export const AppStateProvider = ({ children, init = {} }) => {
  const [baseState, setBaseState] = useState(init);
  const [appState, superSetAppState] = useStatePromise();

  const setAppState = useCallback((appState) => {
    return superSetAppState({
      ...appState,
      ...baseState,
    });
  }, [baseState]);

  useEffect(() => {
    const changeListener = ({ appState: activityStatus }) => {
      const baseState = {
        activityStatus,
      };

      setBaseState(baseState);

      setAppState((appState = {}) => ({
        ...appState,
        ...baseState,
      }));
    };

    AppState.addEventListener('change', changeListener);

    return () => {
      AppState.removeEventListener('change', changeListener);
    };
  }, [true]);

  const value = useMemo(() => [appState, setAppState], [appState, setAppState]);

  return (
    <AppStateContext.Provider value={value}>
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
