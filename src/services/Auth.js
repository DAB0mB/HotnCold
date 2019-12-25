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

export const useRegister = (args, { onCompleted = () => {}, ...options } = {}) => {
  const client = useApolloClient();

  return mutations.registerUser.use(args, {
    ...options,
    onCompleted(data) {
      const removeListener = client.subscription.onConnected(() => {
        removeListener();
        onCompleted(data);
      });

      client.subscription.connect();
    },
  });
};

export const useLogout = () => {
  const cookie = useCookie();
  const client = useApolloClient();

  return useCallback(() => {
    return Promise.all([
      cookie.clear(),
      client.clearStore(),
      new Promise((resolve) => {
        const removeListener = client.subscription.onDisconnected(() => {
          removeListener();
          resolve();
        });

        client.subscription.close();
      }),
    ]);

  }, [client, cookie]);
};
