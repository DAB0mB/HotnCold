import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import React, { createContext, useContext, useMemo } from 'react';
// @react-native-community/geolocation has issues, don't use it
import Geolocation from 'react-native-geolocation-service';
import GPSState from 'react-native-gps-state';

import { useAsyncEffect, fork } from '../utils';
import { useCookie } from './Cookie';

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
  fgService = Geolocation,
  bgService = BackgroundGeolocation,
  stateManager = GPSState,
  children
}) => {
  return (
    <GeolocationContext.Provider value={{ fgService, bgService, stateManager }}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = () => {
  const { fgService, stateManager } = useContext(GeolocationContext);

  return useMemo(() =>
    Object.assign(fork(fgService), { state: stateManager })
  , [fgService, stateManager]);
};

export const useGeoBackgroundTelemetry = (config = {}) => {
  const { bgService } = useContext(GeolocationContext);
  const cookie = useCookie();

  useAsyncEffect(function* () {
    const authToken = yield cookie.get('authToken');

    yield new Promise((resolve, reject) => {
      bgService.configure({
        ...config,
        httpHeaders: {
          Cookie: `authToken=${authToken}`,
        },
      }, resolve, reject);
    });

    const bgEvent = bgService.on('background', () => bgService.start());
    const fgEvent = bgService.on('foreground', () => bgService.stop());

    return () => {
      bgEvent.remove();
      fgEvent.remove();
    };
  }, [bgService, cookie]);
};
