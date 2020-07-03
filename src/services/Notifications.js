import React, { createContext, useContext, useMemo } from 'react';
import { Platform } from 'react-native';
import firebase from 'react-native-firebase';

const NotificationsContext = createContext(null);
const messaging = firebase.messaging();
const notifications = firebase.notifications();

export const CHANNELS = {
  CHAT_MESSAGES: 'chat-messages'
};

export const NotificationsProvider = ({
  getToken = messaging.getToken.bind(messaging),
  onTokenRefresh = messaging.onTokenRefresh.bind(messaging),
  requestPermission = messaging.requestPermission.bind(messaging),
  onMessage = messaging.onMessage.bind(messaging),
  onNotification = notifications.onNotification.bind(notifications),
  onNotificationOpened = notifications.onNotificationOpened.bind(notifications),
  removeDeliveredNotification = notifications.removeDeliveredNotification.bind(notifications),
  cancelNotification = notifications.cancelNotification.bind(notifications),
  getTrigger = notifications.getInitialNotification.bind(notifications),
  children,
}) => {
  const value = useMemo(() => ({
    getToken,
    onNotification,
    onNotificationOpened,
    onTokenRefresh,
    removeDeliveredNotification,
    cancelNotification,
    requestPermission,
    getTrigger,

    onMessage(handler) {
      return onMessage(({ data }) => {
        if (!data.channelId) return;

        const payload = data.payload ? JSON.parse(data.payload) : {};

        handler({ ...data, payload });
      });
    },
  }), [
    getToken,
    onMessage,
    onNotification,
    onNotificationOpened,
    onTokenRefresh,
    removeDeliveredNotification,
    cancelNotification,
    requestPermission,
    getTrigger,
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

// Has to return a promise
export const handleMessage = async (message) => {
  if (!message.channelId) return;

  // TODO: Handle iOS
  const notification = new firebase.notifications.Notification()
    .setTitle(message.payload.title)
    .setBody(message.payload.body)
    .setData(message.payload.data)
    .setNotificationId(message.notificationId);

  if (Platform.OS == 'android') {
    notification
      .android.setChannelId(message.channelId)
      // Taken from Android's res/drawable/icon
      .android.setSmallIcon('notification')
      .android.setLargeIcon(message.payload.largeIcon || 'avatar');
  }

  if (Platform.OS == 'ios') {
    notification
      .ios.setThreadIdentifier(message.channelId)
      .ios.setLaunchImage(message.payload.largeIcon);
  }

  return notifications.displayNotification(notification);
};
