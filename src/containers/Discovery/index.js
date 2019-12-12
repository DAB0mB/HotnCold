import React, { useCallback, useEffect, useRef, useState } from 'react';
import CONFIG from 'react-native-config';

import NativeGuard, { SERVICES } from '../../components/NativeGuard';
import * as mutations from '../../graphql/mutations';
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

const Discovery = Base.create(() => {
  const { default: DiscoveryRouter } = require('../../routers/Discovery');

  const alertError = useAlertError();
  const baseNavigation = useNavigation(Base);
  const meQuery = queries.me.use({ onError: alertError });
  const [requiredService, setRequiredService] = useState(null);
  const [nativeServicesReady, setNativeGuardReady] = useState(false);
  const { me } = meQuery.data || {};

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && (meQuery.error || !me)) {
      // Unauthorized
      baseNavigation.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me, baseNavigation]);

  if (meQuery.loading) {
    return useLoading(true);
  }

  if (meQuery.error || !me) {
    return useLoading(false);
  }

  const isReady = nativeServicesReady && !requiredService;

  return useLoading(false,
    <MeProvider me={me}>
    <HeaderProvider HeaderComponent={Header} defaultProps={{ baseNavigation, me }}>
      <NativeGuard
        ServiceRequiredComponent={ServiceRequired}
        services={SERVICES.GPS}
        onRequireService={setRequiredService}
        onError={alertError}
        onReady={setNativeGuardReady}
      >
        <LoadingProvider loading={!isReady}>
          {isReady && <DiscoveryRouter />}
        </LoadingProvider>
      </NativeGuard>
    </HeaderProvider>
    </MeProvider>
  );
});

Discovery.create = (Component) => {
  return ({ navigation: discoveryNavigation }) => {
    const { headerProps, setHeaderProps } = useHeader();

    useEffect(() => {
      setHeaderProps({ ...headerProps, discoveryNavigation });

      return () => {
        setHeaderProps(headerProps);
      };
    }, [true]);

    return (
      <NavigationProvider navKey={Discovery} navigation={discoveryNavigation}>
        <Component />
      </NavigationProvider>
    );
  };
};

export default Discovery;
