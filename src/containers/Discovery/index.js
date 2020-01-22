import React, { useEffect, useState } from 'react';
import { StackActions, NavigationActions } from 'react-navigation';
import uuid from 'uuid';

import NativeGuard, { SERVICES } from '../../components/NativeGuard';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { MyProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useNavInHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import { useNotifications } from '../../services/Notifications';
import { useAsyncEffect } from '../../utils';
import Base from '../Base';
import Header from './Header';
import ServiceRequired from './ServiceRequired';

const $triggered = Symbol('triggered');

const Discovery = Base.create(({ navigation }) => {
  const { default: DiscoveryRouter } = require('../../routers/Discovery');

  const alertError = useAlertError();
  const notifications = useNotifications();
  const baseNav = useNavigation(Base);
  const myQuery = queries.mine.use({ onError: alertError });
  const [associateNotificationsToken] = mutations.associateNotificationsToken.use();
  const [requiredService, setRequiredService] = useState(null);
  const [nativeServicesReady, setNativeServicesReady] = useState(false);
  const [notificationTrigger, setNotificationTrigger] = useState(null);
  const [queryChats, chatsQuery] = queries.chats.use.lazy();
  const { me, myContract } = myQuery.data || {};

  useEffect(() => {
    if (!notificationTrigger) return;

    setNotificationTrigger(null);

    const chatId = notificationTrigger?.notification?.data?.chatId;

    if (!chatId) return;

    const chat = chatsQuery.data.chats.find(c => c.id === chatId);

    if (!chat) return;

    const baseRouter = baseNav.dangerouslyGetParent().state;
    const discoveryRouter = baseRouter.routes.find(r => r.routeName == 'Discovery');
    const socialRouter = baseRouter.routes.find(r => r.routeName == 'Social');
    const chatRoute = socialRouter?.router?.routes?.find?.(r => r.routeName == 'Chat');

    // We're already chatting with that person
    if (chatRoute?.params?.chat?.id === chatId) return;

    baseNav.dispatch(StackActions.reset({
      index: 1,
      actions: [
        NavigationActions.navigate({
          routeName: 'Discovery',
          key: discoveryRouter?.key || uuid(),
        }),
        NavigationActions.navigate({
          routeName: 'Social',
          key: uuid(),
          params: {
            $setState: {
              index: 1,
              routes: [
                {
                  routeName: 'Inbox',
                  key: uuid(),
                },
                {
                  routeName: 'Chat',
                  key: uuid(),
                  params: { chat },
                },
              ],
            },
          },
        }),
      ],
    }));
  }, [baseNav, notificationTrigger]);

  useAsyncEffect(function* () {
    if (!myQuery.called) return;
    if (myQuery.loading) return;
    if (myQuery.error) return;

    if (!myContract || !myContract.signed) {
      baseNav.replace('Auth');

      return;
    }

    // Start fetching and update cache
    queryChats();

    // Lastly, fetch token. Only associate it if component is still mounted
    const notificationsToken = yield notifications.getToken();

    associateNotificationsToken(notificationsToken);
  }, [myQuery]);

  useEffect(() => {
    const chats = chatsQuery?.data?.chats;

    if (!chats?.length) return;

    if (notifications.trigger && !notifications.trigger[$triggered]) {
      notifications.trigger[$triggered] = true;
      setNotificationTrigger(notifications.trigger);
    }

    // Listen in background
    const removeTokenRefreshListener = notifications.onTokenRefresh(associateNotificationsToken);
    const removeNotificationOpenedListener = notifications.onNotificationOpened(setNotificationTrigger);

    return () => {
      removeTokenRefreshListener();
      removeNotificationOpenedListener();
    };
  }, [chatsQuery]);

  if (myQuery.loading || myQuery.error) {
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
