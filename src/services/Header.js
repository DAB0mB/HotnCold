import React, { createContext, useContext, useState } from 'react';

const HeaderContext = createContext(null);

export const HeaderProvider = ({ HeaderComponent, children }) => {
  const [headerProps, setHeaderProps] = useState({});

  return (
    <HeaderContext.Provider value={[headerProps, setHeaderProps]}>
      {children}
      <HeaderComponent {...headerProps} />
    </HeaderContext.Provider>
  );
};

export const useHeaderState = () => {
  return useContext(HeaderContext);
};
