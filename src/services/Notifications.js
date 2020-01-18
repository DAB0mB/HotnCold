import React, { createContext, useContext, useMemo } from 'react';
import firebase from 'react-native-firebase';

const NotificationsContext = createContext(null);
const messaging = firebase.messaging();

export const NotificationsProvider = ({
  getToken = messaging.getToken.bind(messaging),
  onTokenRefresh = messaging.onTokenRefresh.bind(messaging),
  requestPermission = messaging.requestPermission.bind(messaging),
  children,
}) => {
  const value = useMemo(() => ({
    getToken,
    onTokenRefresh,
    requestPermission,
  }), [
    getToken,
    onTokenRefresh,
    requestPermission,
  ]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  return useContext(NotificationsContext);
};
