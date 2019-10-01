import React, { createContext, useContext } from 'react';
import { BluetoothStatus } from 'react-native-bluetooth-status';

const MeContext = createContext(null);

export const MeProvider = ({ me, children }) => {
  return (
    <MeContext.Provider value={me}>
      {children}
    </MeContext.Provider>
  );
};

export const useMe = () => {
  return useContext(MeContext);
};

// TODO: Implement
export const useSignIn = () => {
  const client = useApolloClient();

  return useCallback(() => {

  }, [client]);
};

// TODO: Implement
export const useSignOut = () => {
  const client = useApolloClient();

  return useCallback(() => {

  }, [client]);
};
