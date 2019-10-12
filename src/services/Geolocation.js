// @react-native-community/geolocation has issues, don't use it
import Geolocation from 'react-native-geolocation-service';
import React, { createContext, useContext } from 'react';

const GeolocationContext = createContext(null);

export const GeolocationProvider = ({ geolocation = Geolocation, children }) => {
  return (
    <GeolocationContext.Provider value={geolocation}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = () => {
  return useContext(GeolocationContext);
};

