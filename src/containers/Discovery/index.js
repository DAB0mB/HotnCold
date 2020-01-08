import React, { useEffect, useState, useLayoutEffect } from 'react';
import { NavigationActions } from 'react-navigation';

import NativeGuard, { SERVICES } from '../../components/NativeGuard';
import * as queries from '../../graphql/queries';
import { MyProvider } from '../../services/Auth';
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
  const myQuery = queries.mine.use({ onError: alertError });
  const [requiredService, setRequiredService] = useState(null);
  const [nativeServicesReady, setNativeServicesReady] = useState(false);
  const [queryChats] = queries.chats.use.lazy();
  const { me, myContract } = myQuery.data || {};

  useEffect(() => {
    if (!myQuery.called) return;
    if (myQuery.loading) return;
    if (myQuery.error) return;

    if (!myContract || !myContract.verified) {
      baseNav.replace('Auth');

      return;
    }

    if (!me) {
      baseNav.replace('Profile');

      return;
    }

    queryChats();
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
