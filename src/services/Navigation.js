import React, { createContext, useContext } from 'react';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ service, children }) => {
  return (
    <NavigationContext.Provider value={service}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  return useContext(NavigationContext);
};
