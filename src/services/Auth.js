import { useApolloClient } from '@apollo/react-hooks';
import React, { createContext, useContext, useCallback, useMemo } from 'react';

import * as mutations from '../graphql/mutations';
import { noop } from '../utils';
import { useAppState } from './AppState';
import { useCookie } from './Cookie';

const MyContext = createContext(null);

export const MyProvider = ({ myContract, me, children }) => {
  const value = useMemo(() => ({ myContract, me }), [myContract, me]);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};

export const useMine = () => {
  return useContext(MyContext);
};

export const useRequestSignIn = (phone, { onCompleted = noop, ...options } = {}) => {
  const [findOrCreateContract] = mutations.findOrCreateContract.use(phone, {
    ...options,
    onCompleted: useCallback((data) => {
      onCompleted(data?.findOrCreateContract);
    }, [onCompleted])
  });

  return useCallback((...args) => {
    return findOrCreateContract(...args).then((data) => {
      return data?.findOrCreateContract;
    });
  }, [findOrCreateContract]);
};

export const useVerifySignIn = (contract, passcode, {
  onCompleted = noop,
  ...options
} = {}) => {
  const [verifyContract] = mutations.verifyContract.use(contract.id, passcode, {
    ...options,
    onCompleted: useCallback((data) => {
      onCompleted(data?.verifyContract);
    }, [onCompleted]),
  });

  return useCallback((...args) => {
    return verifyContract(...args).then((data) => {
      return data?.verifyContract;
    });
  }, [verifyContract]);
};

export const useSignUp = (args, {
  onCompleted = noop,
  ...options
} = {}) => {
  const client = useApolloClient();
  const [createUser] = mutations.createUser.use(args, {
    ...options,
    onCompleted: useCallback((data) => {
      // Note: subscription.onConnected() listener isn't fired consistently
      client.subscription.connect();
      onCompleted(data?.createUser);
    }, [client, onCompleted]),
  });

  return useCallback((...args) => {
    return createUser(...args).then((data) => {
      return data?.createUser;
    });
  }, [createUser]);
};

export const useSignOut = ({ onCompleted = noop, onError = noop } = {}) => {
  const [, setAppState] = useAppState();
  const cookie = useCookie();
  const client = useApolloClient();
  const [dissociateNotificationsToken] = mutations.dissociateNotificationsToken.use();

  return useCallback(() => {
    return dissociateNotificationsToken().then(() => Promise.all([
      cookie.clear(),
      client.clearStore(),
      // Note: subscription.onDisconnected() listener isn't fired consistently
      client.subscription.close(),
    ]))
      .then(() => {
        setAppState({});
      })
      .then(onCompleted, onError);
  }, [client, cookie, onCompleted, onError]);
};
