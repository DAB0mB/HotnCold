import React, { createContext, useContext, useState } from 'react';

const HeaderContext = createContext(null);

export const HeaderProvider = ({ HeaderComponent, defaultProps = {}, children }) => {
  const [headerProps, setHeaderProps] = useState({});

  return (
    <HeaderContext.Provider value={[headerProps, setHeaderProps]}>
      {children}
      <HeaderComponent {...defaultProps} {...headerProps} />
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  return useContext(HeaderContext);
};
