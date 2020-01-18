import { useApolloClient } from '@apollo/react-hooks';
import React, { createContext, useContext, useCallback, useMemo } from 'react';

import * as mutations from '../graphql/mutations';
import { useCookie } from './Cookie';
import { useNotifications } from './Notifications';

const MyContext = createContext(null);

export const MyProvider = ({ myContract, me, children }) => {
  const value = useMemo(() => ({ myContract, me }), [myContract, me]);

  return (
    <MyContext.Provider value={value}>
      {children}
    </MyContext.Provider>
  );
};

const noop = () => {};

export const useMine = () => {
  return useContext(MyContext);
};

export const useRequestSignIn = (phone, { onCompleted = noop, ...options } = {}) => {
  const [findOrCreateContract] = mutations.findOrCreateContract.use(phone, {
    ...options,
    onCompleted: useCallback((data) => {
      onCompleted(data.findOrCreateContract);
    }, [onCompleted])
  });

  return useCallback((...args) => {
    return findOrCreateContract(...args).then((data) => {
      return data.findOrCreateContract;
    });
  }, [findOrCreateContract]);
};

export const useVerifySignIn = (contract, passcode, {
  onCompleted = noop,
  onError = noop,
  ...options
} = {}) => {
  const notifications = useNotifications();
  const [associateNotificationsToken] = mutations.associateNotificationsToken.use();
  const [verifyContract] = mutations.verifyContract.use(contract.id, passcode, {
    ...options,
    onCompleted: useCallback((data) => {
      onCompleted(data.verifyContract);
    }, [onCompleted]),
    onError,
  });

  return useCallback((...args) => {
    const registeringNotifications = !contract.signed
      ? Promise.resolve()
      : notifications.requestPermission().then(() => {
        return notifications.getToken();
      })
        .then((token) => {
          return associateNotificationsToken(token);
        })
        .catch((error) => {
          onError(error);

          return Promise.reject(error);
        });

    return registeringNotifications.then(() => {
      return verifyContract(...args);
    })
      .then((data) => {
        return data.verifyContract;
      });
  }, [associateNotificationsToken, verifyContract, contract, notifications, onError]);
};

export const useSignUp = (args, {
  onError = noop,
  onCompleted = noop,
  ...options
} = {}) => {
  const client = useApolloClient();
  const notifications = useNotifications();
  const [createUser] = mutations.createUser.use(args, {
    ...options,
    onCompleted: useCallback((data) => {
      const removeListener = client.subscription.onConnected(() => {
        removeListener();
        onCompleted(data.createUser);
      });

      client.subscription.connect();
    }, [client, onCompleted]),
    onError,
  });

  return useCallback((args) => {
    return notifications.requestPermission().then(() => {
      return notifications.getToken();
    })
      .then((token) => {
        return createUser({
          ...args,
          notificationsToken: token
        });
      }, (error) => {
        onError(error);

        return Promise.reject(error);
      })
      .then((data) => {
        return data.createUser;
      });
  }, [createUser, notifications, onError]);
};

export const useSignOut = ({ onCompleted = noop, onError = noop } = {}) => {
  const cookie = useCookie();
  const client = useApolloClient();
  const [dissociateNotificationsToken] = mutations.dissociateNotificationsToken.use();

  return useCallback(() => {
    return dissociateNotificationsToken().then(() => Promise.all([
      cookie.clear(),
      client.clearStore(),
      new Promise((resolve) => {
        const removeListener = client.subscription.onDisconnected(() => {
          removeListener();
          resolve();
        });

        client.subscription.close();
      }),
    ]))
      .then(onCompleted, onError);
  }, [client, cookie, onCompleted, onError]);
};
