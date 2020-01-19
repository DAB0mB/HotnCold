import React, { useCallback, useEffect, useState, useLayoutEffect } from 'react';
import { StackActions, NavigationActions } from 'react-navigation';
import uuid from 'uuid';

import NativeGuard, { SERVICES } from '../../components/NativeGuard';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { MyProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import { useNotifications } from '../../services/Notifications';
import { useAsyncEffect } from '../../utils';
import Base from '../Base';
import Header from './Header';
import ServiceRequired from './ServiceRequired';

const Discovery = Base.create(({ navigation }) => {
  const { default: DiscoveryRouter } = require('../../routers/Discovery');

  const alertError = useAlertError();
  const notifications = useNotifications();
  const baseNav = useNavigation(Base);
  const myQuery = queries.mine.use({ onError: alertError });
  const [associateNotificationsToken] = mutations.associateNotificationsToken.use();
  const [requiredService, setRequiredService] = useState(null);
  const [nativeServicesReady, setNativeServicesReady] = useState(false);
  const [queryChats] = queries.chats.use.lazy();
  const { me, myContract } = myQuery.data || {};

  const tryNavToChat = useCallback((trigger) => {
    if (!trigger) return;
    if (!trigger.notification) return;
    if (!trigger.notification.data) return;
    if (!trigger.notification.data.chatId) return;

    baseNav.dispatch(StackActions.reset({
      index: 1,
      actions: [
        NavigationActions.navigate({
          routeName: 'Discovery',
          key: uuid(),
        }),
        NavigationActions.navigate({
          routeName: 'Social',
          key: uuid(),
          params: {
            $childState: {
              index: 1,
              routes: [
                {
                  routeName: 'Inbox',
                  key: uuid(),
                },
                {
                  routeName: 'Chat',
                  key: uuid(),
                  params: {
                    chatId: trigger.notification.data.chatId,
                  },
                },
              ],
            },
          },
        }),
      ],
    }));
  }, [notifications, baseNav]);

  useAsyncEffect(function* () {
    if (!myQuery.called) return;
    if (myQuery.loading) return;
    if (myQuery.error) return;

    if (!myContract || !myContract.signed) {
      baseNav.replace('Auth');

      return;
    }

    // Try nav asap
    tryNavToChat(notifications.trigger);
    // Start fetching and update cache
    queryChats();

    // Listen in background
    yield notifications.onTokenRefresh(associateNotificationsToken);
    yield notifications.onNotificationOpened(tryNavToChat);

    // Lastly, fetch token. Only associate it if component is still mounted
    const notificationsToken = yield notifications.getToken();

    associateNotificationsToken(notificationsToken);
  }, [myQuery]);

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
            {nativeServicesReady && !requiredService && <DiscoveryRouter navigation={navigation} />}
          </LoadingProvider>
        </NativeGuard>
      </HeaderProvider>
    </MyProvider>
  );
});

Discovery.create = (Component) => {
  return function DiscoveryScreen({ navigation: discoveryNav }) {
    const { headerProps, setHeaderProps } = useHeader();

    useLayoutEffect(() => {
      const listener = discoveryNav.addListener('willBlur', ({ action }) => {
        if (action.type === NavigationActions.BACK) {
          setHeaderProps(headerProps);
        }
      });

      return () => {
        listener.remove();
      };
    }, [true]);

    useEffect(() => {
      setHeaderProps({ ...headerProps, discoveryNav });
    }, [true]);

    return (
      <NavigationProvider navKey={Discovery} navigation={discoveryNav}>
        <Component navigation={discoveryNav} />
      </NavigationProvider>
    );
  };
};

export default Discovery;
