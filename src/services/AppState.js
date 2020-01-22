import React, { createContext, useContext, useEffect, useState } from 'react';

const AppStateContext = createContext(null);

export const AppStateProvider = ({ children, state = {} }) => {
  const appState = useState(state);

  return (
    <AppStateContext.Provider value={appState}>
      {children}
    </AppStateContext.Provider>
  );
};

export const useAppState = () => {
  return useContext(AppStateContext);
};

useAppState.modelEffect = (modelName, modelValue) => {
  const [appState, setAppState] = useAppState();

  useEffect(() => {
    const hadValue = modelName in appState;
    const prevValue = appState[modelName];

    setAppState({
      ...appState,
      [modelName]: modelValue,
    });

    return () => {
      setAppState(appState => {
        appState = { ...appState };

        if (hadValue) {
          appState[modelName] = prevValue;
        }
        else {
          delete appState[modelName];
        }

        return appState;
      });
    };
  }, [modelName, modelValue]);
};
