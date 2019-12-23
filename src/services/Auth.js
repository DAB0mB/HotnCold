import { useApolloClient } from '@apollo/react-hooks';
import React, { createContext, useContext, useCallback } from 'react';

import * as mutations from '../graphql/mutations';
import { useCookie } from './Cookie';

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

export const useRegister = (...args) => {
  return mutations.registerUser.use(...args);
};

export const useLogout = () => {
  const cookie = useCookie();
  const client = useApolloClient();

  return useCallback(async () => {
    await cookie.clear();
    await client.clearStore();
  }, [client, cookie]);
};
