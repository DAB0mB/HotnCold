import React, { createContext, useContext, useMemo } from 'react';
import CONFIG from 'react-native-config';
import CookieManager from 'react-native-cookie';

const CookieContext = createContext(null);

export const CookieProvider = ({ cookieManager = CookieManager, children }) => {
  return (
    <CookieContext.Provider value={cookieManager}>
      {children}
    </CookieContext.Provider>
  );
};

export const useCookie = () => {
  const cookie = useContext(CookieContext);

  return useMemo(() => ({
    get(...args) {
      return cookie.get(CONFIG.SERVER_URI, ...args);
    },

    set(...args) {
      return cookie.set(CONFIG.SERVER_URI, ...args);
    },

    clear(...args) {
      return cookie.clear(CONFIG.SERVER_URI, ...args);
    },
  }), [cookie]);
};
