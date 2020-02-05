import React, { useCallback, useEffect, useState } from 'react';
import CONFIG from 'react-native-config';
import { NavigationActions } from 'react-navigation';
import UUID from 'uuid/v4';

import NativeGuard, { SERVICES } from '../../components/NativeGuard';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useAppState } from '../../services/AppState';
import { MyProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useNavInHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import { useNotifications, handleMessage, CHANNELS } from '../../services/Notifications';
import { useAsyncEffect } from '../../utils';
import Base from '../Base';
import Header, { $Header } from './Header';
import ServiceRequired from './ServiceRequired';

export const $Discovery = {
  Header: $Header,
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
  const [queryChats, chatsQuery] = queries.chats.use.lazy();
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

    const chatId = notification.data.chatId;

    if (!chatId) return;

    const chat = chatsQuery.data.chats.find(c => c.id === chatId);

    if (!chat) return;

    const { activeChat } = appState;

    // We're already chatting with that person
    if (activeChat?.id === chatId) return;

    baseNav.push('Social', {
      $setInitialRouteState: {
        routeName: 'Chat',
        params: { chat },
      }
    });
  }, [baseNav, chatsQuery, appState]);

  useAsyncEffect(function* () {
    if (!myQuery.called) return;
    if (myQuery.loading) return;
    if (myQuery.error) return;

    if (!myContract || !myContract.signed) {
      baseNav.terminalPush('Agreement', {}, [
        NavigationActions.navigate({
          key: UUID(),
          routeName: 'Auth',
        }),
      ]);

      return;
    }

    // Start fetching and update cache
    queryChats();

    yield notifications.requestPermission();
    // Lastly, fetch token. Only associate it if component is still mounted
    const notificationsToken = yield notifications.getToken();

    associateNotificationsToken(notificationsToken);
  }, [myQuery]);

  useAsyncEffect(function* (onCleanup) {
    if (!chatsQuery.called) return;
    if (chatsQuery.loading) return;

    const initialTrigger = yield notifications.getTrigger();

    if (initialTrigger) {
      onNotificationOpened(initialTrigger);
    }

    // Listen in background
    onCleanup(notifications.onTokenRefresh(associateNotificationsToken));
  }, [chatsQuery.called && !chatsQuery.loading]);

  useEffect(() => {
    if (!chatsQuery.called) return;
    if (chatsQuery.loading) return;

    const removeMessageListener = notifications.onMessage(onMessage);
    const removeNotificationOpenedListener = notifications.onNotificationOpened(onNotificationOpened);

    return () => {
      removeMessageListener();
      removeNotificationOpenedListener();
    };
  }, [
    chatsQuery.called && !chatsQuery.loading,
    onMessage,
    onNotificationOpened,
  ]);

  if (myQuery.loading || myQuery.error || !me) {
    return useLoading(true);
  }

  return useLoading(false,
    <MyProvider myContract={myContract} me={me}>
      <HeaderProvider HeaderComponent={Header} defaultProps={{ baseNav, me }}>
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
      </HeaderProvider>
    </MyProvider>
  );
});

Discovery.create = (Component) => {
  return function DiscoveryScreen({ navigation: discoveryNav }) {
    useNavInHeader(discoveryNav);

    return (
      <NavigationProvider navKey={Discovery} navigation={discoveryNav}>
        <Component navigation={discoveryNav} />
      </NavigationProvider>
    );
  };
};

export default Discovery;
