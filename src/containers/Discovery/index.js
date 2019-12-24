import React, { useEffect, useState, useLayoutEffect } from 'react';
import { NavigationActions } from 'react-navigation';

import NativeGuard, { SERVICES } from '../../components/NativeGuard';
import * as queries from '../../graphql/queries';
import { MeProvider } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import Base from '../Base';
import Header from './Header';
import ServiceRequired from './ServiceRequired';

const Discovery = Base.create(({ navigation }) => {
  const { default: DiscoveryRouter } = require('../../routers/Discovery');

  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const meQuery = queries.me.use({ onError: alertError });
  const [requiredService, setRequiredService] = useState(null);
  const [nativeServicesReady, setNativeServicesReady] = useState(false);
  const { me } = meQuery.data || {};
  // Prepare cache
  // TODO: Check if me exists, perform lazy
  queries.chats.use();

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && (meQuery.error || !me)) {
      // Unauthorized
      baseNav.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me, baseNav]);

  if (meQuery.loading) {
    return useLoading(true);
  }

  if (meQuery.error || !me) {
    return useLoading(false);
  }

  return useLoading(false,
    <MeProvider me={me}>
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
    </MeProvider>
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
