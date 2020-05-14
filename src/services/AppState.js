import React, {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
} from 'react';
import { AppState, Keyboard } from 'react-native';

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

  useLayoutEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setAppState(appState => ({
          ...appState,
          keyboardVisible: true,
        }));
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setAppState(appState => ({
          ...appState,
          keyboardVisible: false,
        }));
      }
    );

    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
  });

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
