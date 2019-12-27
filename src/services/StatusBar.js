import React, { createContext, useContext } from 'react';
import { StatusBar } from 'react-native';

const StatusBarContext = createContext(null);

export const StatusBarProvider = ({ children, ...props }) => {
  return (
    <StatusBarContext.Provider value={props}>
      <StatusBar {...props} />
      {children}
    </StatusBarContext.Provider>
  );
};

export const useStatusBar = () => {
  return useContext(StatusBarContext);
};
