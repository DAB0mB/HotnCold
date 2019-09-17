import React, { createContext, useContext } from 'react';

const MapboxContext = createContext(null);

export const MapboxProvider = ({ client, children }) => {
  return (
    <MapboxContext.Provider value={client}>
      {children}
    </MapboxContext.Provider>
  );
};

export const useMapbox = () => {
  return useContext(MapboxContext);
};
