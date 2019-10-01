import React, { createContext, useContext } from 'react';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ navigation, children }) => {
  return (
    <NavigationContext.Provider value={navigation}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  return useContext(NavigationContext);
};
