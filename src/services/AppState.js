import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
} from 'react';
import { AppState } from 'react-native';

import { useStatePromise } from '../utils';

const AppStateContext = createContext(null);

export const AppStateProvider = ({ children, init = {} }) => {
  const [appState, setAppState] = useStatePromise(init);

  useEffect(() => {
    const changeListener = (activityStatus) => {
      setAppState(appState => ({
        ...appState,
        activityStatus,
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
