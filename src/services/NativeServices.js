import React, { createContext, useCallback, useContext, useState } from 'react';

const NativeServicesContext = createContext(null);

export const SERVICES = {
  GPS:       0x01,
  BLUETOOTH: 0x10,
};

export const NativeServicesProvider = ({ children }) => {
  const nativeServicesState = useState({});

  return (
    <NativeServicesContext.Provider value={nativeServicesState}>
      {children}
    </NativeServicesContext.Provider>
  );
};

export const useNativeServices = () => {
  const [nativeServices, _setNativeServices] = useContext(NativeServicesContext);

  const setNativeServices = useCallback((nativeServices) => {
    _setNativeServices(_nativeServices => ({ ..._nativeServices, ...nativeServices }));
  }, [true]);

  return [nativeServices, setNativeServices];
};
