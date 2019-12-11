import React, { createContext, useContext } from 'react';

const DeviceInfoContext = createContext(null);

export const DeviceInfoProvider = ({ children, info }) => {
  return (
    <DeviceInfoContext.Provider value={info}>
      {children}
    </DeviceInfoContext.Provider>
  );
};

export const useDeviceInfo = () => {
  return useContext(DeviceInfoContext);
};
