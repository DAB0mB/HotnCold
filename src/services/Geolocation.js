import React, { createContext, useContext, useMemo } from 'react';
// @react-native-community/geolocation has issues, don't use it
import Geolocation from 'react-native-geolocation-service';
import GPSState from 'react-native-gps-state';

import { fork } from '../utils';

const GeolocationContext = createContext(null);

export const GPS_STATES = {
  NOT_DETERMINED:       GPSState.NOT_DETERMINED,
  RESTRICTED:           GPSState.RESTRICTED,
  DENIED:               GPSState.DENIED,
  AUTHORIZED:           GPSState.AUTHORIZED,
  AUTHORIZED_ALWAYS:    GPSState.AUTHORIZED_ALWAYS,
  AUTHORIZED_WHENINUSE: GPSState.AUTHORIZED_WHENINUSE,
};

export const GeolocationProvider = ({
  resolver = Geolocation,
  stateManager = GPSState,
  children
}) => {
  const value = useMemo(() => ({
    resolver, stateManager
  }), [resolver, stateManager]);

  return (
    <GeolocationContext.Provider value={value}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = () => {
  const { resolver, stateManager } = useContext(GeolocationContext);

  return useMemo(() =>
    Object.assign(fork(resolver), { state: stateManager })
  , [resolver, stateManager]);
};
