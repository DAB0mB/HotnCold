import React, { createContext, useContext, useState } from 'react';

import { useNavigation } from './Navigation';

const HeaderContext = createContext(null);

export const HeaderProvider = ({ children }) => {
  const headerState = useState(null);

  return (
    <HeaderContext.Provider value={headerState}>
      {children}
    </HeaderContext.Provider>
  );
};

export const useHeaderState = () => {
  return useContext(HeaderContext);
};
