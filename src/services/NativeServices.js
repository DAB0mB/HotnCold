import React, { createContext, useContext, useState } from 'react';

const NativeServicesContext = createContext(null);

export const SERVICES = {
  GPS:       0x01,
  BLUETOOTH: 0x10,
};

export const NativeServicesProvider = ({ children }) => {
  const [nativeServices, setNativeServices] = useState(0x00);

  return (
    <NativeServicesContext.Provider value={[nativeServices, setNativeServices]}>
      {children}
    </NativeServicesContext.Provider>
  );
};

export const useNativeServicesState = () => {
  return useContext(NativeServicesContext);
};
