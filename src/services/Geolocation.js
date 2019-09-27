import Geolocation from '@react-native-community/geolocation';
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

