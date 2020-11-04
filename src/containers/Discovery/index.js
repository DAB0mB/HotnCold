import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import CONFIG from 'react-native-config';
import { NavigationActions } from 'react-navigation';
import UUID from 'uuid/v4';

import NativeGuard, { SERVICES } from '../../components/NativeGuard';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useAppState } from '../../services/AppState';
import { MyProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { FrameProvider } from '../../services/Frame';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import { useNotifications, handleMessage, CHANNELS } from '../../services/Notifications';
import { useAsyncEffect } from '../../utils';
import Base from '../Base';
import Frame, { $Frame } from './Frame';
import { $SideMenu } from './SideMenu';
import ServiceRequired from './ServiceRequired';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', justifyContent: 'flex-end' },
  body: { backgroundColor: 'white', flex: 1 },
});

export const $Discovery = {
  Frame: $Frame,
  SideMenu: $SideMenu,
};

const Discovery = Base.create(({ navigation }) => {
  const { default: DiscoveryRouter } = require('../../routers/Discovery');

  const alertError = useAlertError();
  const notifications = useNotifications();
  const baseNav = useNavigation(Base);
  const myQuery = queries.mine.use({ onError: alertError });
  const [associateNotificationsToken] = mutations.associateNotificationsToken.use();
  const [requiredService, setRequiredService] = useState(null);
  const [nativeServicesReady, setNativeServicesReady] = useState(false);
  const { me, myContract } = myQuery.data || {};
  const [appState] = useAppState();

  const onMessage = useCallback((message) => {
    switch (message.channelId) {
    case CHANNELS.CHAT_MESSAGES:
      if (!message.payload.data?.chatId) return;
      if (message.payload.data.chatId === appState.activeChat?.id) return;
      break;
    }

    handleMessage(message).catch(alertError);
  }, [appState, alertError]);

  const onNotificationOpened = useCallback(({ notification } = {}) => {
    if (!notification) return;

    if (!CONFIG.PERSIST_NOTIFICATIONS) {
      notifications.cancelNotification(notification.notificationId);
      notifications.removeDeliveredNotification(notification.notificationId);
    }

    const { statusId, chatId, isThread } = notification.data;

    if (!chatId) return;

    const { activeChat } = appState;

    // We're already chatting with that person
    if (activeChat?.id === chatId) return;

    if (isThread) {
      baseNav.push('StatusChat', { statusId });
    }
    else {
      baseNav.push('Social', {
        $setInitialRouteState: {
          routeName: 'Chat',
          params: { chatId },
        }
      });
    }
  }, [baseNav, appState]);

  useAsyncEffect(function* () {
    if (!myQuery.called) return;
    if (myQuery.loading) return;

    if (myQuery.error || !myContract || !myContract.signed) {
      yield myQuery.client.clearStore();

      baseNav.terminalPush('Agreement', {}, [
        NavigationActions.navigate({
          key: UUID(),
          routeName: 'Auth',
        }),
      ]);

      return;
    }

    yield notifications.requestPermission();
    // Lastly, fetch token. Only associate it if component is still mounted
    const notificationsToken = yield notifications.getToken();

    associateNotificationsToken(notificationsToken);
  }, [myQuery]);

  const isLoading = myQuery.loading || myQuery.error || !me;

  useAsyncEffect(function* (onCleanup) {
    if (isLoading) return;

    const initialTrigger = yield notifications.getTrigger();

    if (initialTrigger) {
      onNotificationOpened(initialTrigger);
    }

    // Listen in background
    onCleanup(notifications.onTokenRefresh(associateNotificationsToken));
  }, [isLoading]);

  useEffect(() => {
    if (isLoading) return;

    const removeMessageListener = notifications.onMessage(onMessage);
    const removeNotificationOpenedListener = notifications.onNotificationOpened(onNotificationOpened);

    return () => {
      removeMessageListener();
      removeNotificationOpenedListener();
    };
  }, [
    onMessage,
    onNotificationOpened,
    isLoading,
  ]);

  if (isLoading) {
    return useLoading(true);
  }

  return useLoading(false,
    <View style={styles.container}>
      <MyProvider myContract={myContract} me={me}>
        <FrameProvider FrameComponent={Frame}>
          <NativeGuard
            ServiceRequiredComponent={ServiceRequired}
            services={SERVICES.GPS}
            onRequireService={setRequiredService}
            onError={alertError}
            onReady={setNativeServicesReady}
          >
            <LoadingProvider>
              {nativeServicesReady && !requiredService && (
                <DiscoveryRouter navigation={navigation} />
              )}
            </LoadingProvider>
          </NativeGuard>
        </FrameProvider>
      </MyProvider>
    </View>
  );
});

Discovery.create = (Component) => {
  return function DiscoveryScreen({ navigation: discoveryNav }) {
    return (
      <View style={styles.body}>
        <NavigationProvider navKey={Discovery} navigation={discoveryNav}>
          <Component navigation={discoveryNav} />
        </NavigationProvider>
      </View>
    );
  };
};

export default Discovery;
