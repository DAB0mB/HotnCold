import Geolocation from '@react-native-community/geolocation';
import React, { createContext, useContext } from 'react';

const GeolocationContext = createContext(null);

export const GeolocationProvider = ({ service = Geolocation, children }) => {
  return (
    <GeolocationContext.Provider value={service}>
      {children}
    </GeolocationContext.Provider>
  );
};

export const useGeolocation = () => {
  return useContext(GeolocationContext);
};

