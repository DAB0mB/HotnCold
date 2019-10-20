import React, { createContext, useCallback, useContext, useState } from 'react';

const NativeServicesContext = createContext(null);

export const SERVICES = {
  GPS:       0x01,
  BLUETOOTH: 0x10,
};

export const NativeServicesProvider = ({ children }) => {
  const nativeServicesState = useState({
    state: null,
    services: 0,
    onBluetoothActivated: useCallback(() => {}, [true]),
    onBluetoothDeactivated: useCallback(() => {}, [true]),
    onGPSActivated: useCallback(() => {}, [true]),
    onGPSDeactivated: useCallback(() => {}, [true]),
  });

  return (
    <NativeServicesContext.Provider value={nativeServicesState}>
      {children}
    </NativeServicesContext.Provider>
  );
};

export const useNativeServices = () => {
  const [_nativeServices, _setNativeServices] = useContext(NativeServicesContext);

  const setNativeServices = useCallback((nativeServicesArg) => {
    let shouldReset = false;
    const nativeServices = {};

    Object.keys(_nativeServices).forEach((prop) => {
      nativeServices[prop] = nativeServicesArg[prop] != null
        ? nativeServicesArg[prop]
        : _nativeServices[prop];

      if (nativeServices[prop] !== _nativeServices[prop]) {
        shouldReset = true;
      }
    });

    if (shouldReset) {
      _setNativeServices(nativeServices);
    }
  }, [_nativeServices, _setNativeServices]);

  return [_nativeServices, setNativeServices];
};
