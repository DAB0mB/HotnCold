import { useApolloClient } from '@apollo/react-hooks';
import React, { createContext, useContext, useCallback } from 'react';

import * as mutations from '../graphql/mutations';
import { useCookie } from './Cookie';

const MyContext = createContext(null);

export const MyProvider = ({ myContract, me, children }) => {
  return (
    <MyContext.Provider value={{ myContract, me }}>
      {children}
    </MyContext.Provider>
  );
};

export const useMine = () => {
  return useContext(MyContext);
};

export const useSignUp = (args, { onCompleted = () => {}, ...options } = {}) => {
  const client = useApolloClient();

  return mutations.createUser.use(args, {
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

export const useSignOut = () => {
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
