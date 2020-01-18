import React, { createContext, useContext, useMemo } from 'react';
import firebase from 'react-native-firebase';

const NotificationsContext = createContext(null);
const messaging = firebase.messaging();
const notifications = firebase.notifications();

export const NotificationsProvider = ({
  getToken = messaging.getToken.bind(messaging),
  onTokenRefresh = messaging.onTokenRefresh.bind(messaging),
  requestPermission = messaging.requestPermission.bind(messaging),
  onNotificationOpened = notifications.onNotificationOpened.bind(notifications),
  initial,
  children,
}) => {
  const value = useMemo(() => ({
    getToken,
    onNotificationOpened,
    onTokenRefresh,
    requestPermission,
    initial,
  }), [
    getToken,
    onNotificationOpened,
    onTokenRefresh,
    requestPermission,
    initial,
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
