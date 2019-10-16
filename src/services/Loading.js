import React, { createContext, useContext } from 'react';

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
  return useContext(LoadingContext);
};
