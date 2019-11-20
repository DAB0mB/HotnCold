import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
// @react-native-community/geolocation has issues, don't use it
import Geolocation from 'react-native-geolocation-service';
import React, { createContext, useContext } from 'react';

import { useAsyncEffect } from '../utils';
import { useCookie } from './Cookie';

const GeolocationContext = createContext(null);

export const GeolocationProvider = ({ fgService = Geolocation, bgService = BackgroundGeolocation, children }) => {
  return (
    <GeolocationContext.Provider value={{ fgService, bgService }}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = () => {
  const { fgService } = useContext(GeolocationContext);

  return fgService;
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
