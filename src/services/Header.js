import React, { createContext, useContext, useState, useMemo } from 'react';

const HeaderContext = createContext(null);

export const HeaderProvider = ({ HeaderComponent, defaultProps = {}, children }) => {
  const [headerProps, setHeaderProps] = useState({});

  const contextMemo = {
    headerProps,
    setHeaderProps,
  };
  const context = useMemo(() => contextMemo, Object.values(contextMemo));

  return (
    <HeaderContext.Provider value={context}>
      {children}
      <HeaderComponent {...defaultProps} {...headerProps} />
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  return useContext(HeaderContext);
};
