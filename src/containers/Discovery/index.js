import React, { useCallback, useEffect, useRef } from 'react';
import CONFIG from 'react-native-config';

import * as queries from '../../graphql/queries';
import { MeProvider } from '../../services/Auth';
import { useBluetoothLE } from '../../services/BluetoothLE';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import NativeServices, { SERVICES } from '../../services/NativeServices';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import { useRenderer, useAsyncEffect } from '../../utils';
import Base from '../Base';
import Header from './Header';
import ServiceRequired from './ServiceRequired';

const Discovery = Base.create(() => {
  const { default: DiscoveryRouter } = require('../../routers/Discovery');

  const [resettingBleState, updateBleResettingState, restoreBleResettingState] = useRenderer();
  const alertError = useAlertError();
  const baseNavigation = useNavigation();
  const ble = useBluetoothLE();
  const meQuery = queries.me.use({ onError: alertError });
  const nativeServicesRef = useRef(null);
  const { me } = meQuery.data || {};

  const onBluetoothActivated = useCallback(() => {
    const {
      exceptionalServices,
      setExceptionalServices,
    } = nativeServicesRef.current;

    // Bluetooth reset is finalized when event is emitted, not when promise resolves
    if (resettingBleState) {
      setExceptionalServices(exceptionalServices ^ SERVICES.BLUETOOTH);
      updateBleResettingState();
    }
    else {
      setExceptionalServices(exceptionalServices | SERVICES.BLUETOOTH);

      ble.peripheral.stop()

      ble.disable().then(() => {
        return ble.enable();
      }),

      updateBleResettingState();
    }
  }, [resettingBleState]);

  useAsyncEffect(function* () {
    if (resettingBleState !== 2) return;

    updateBleResettingState();

    ble.peripheral.setName(CONFIG.BLUETOOTH_ADAPTER_NAME);
    ble.peripheral.addService(me.id, true);
    yield ble.peripheral.start();

    restoreBleResettingState();
  }, [resettingBleState]);

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && !meQuery.error && !me) {
      // Unauthorized
      baseNavigation.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me, baseNavigation]);

  if (meQuery.loading) {
    return useLoading(true);
  }

  const isReady = (
    nativeServicesRef.current &&
    nativeServicesRef.current.gpsState &&
    nativeServicesRef.current.bluetoothState &&
    !nativeServicesRef.current.requiredService &&
    !resettingBleState
  );

  return useLoading(false,
    <MeProvider me={me}>
    <HeaderProvider HeaderComponent={Header} defaultProps={{ baseNavigation, me }}>
      <NativeServices
        ServiceRequiredComponent={ServiceRequired}
        services={SERVICES.BLUETOOTH | SERVICES.GPS}
        onBluetoothActivated={onBluetoothActivated}
        ref={nativeServicesRef}
      >
        <LoadingProvider loading={!isReady}>
          {isReady && <DiscoveryRouter />}
        </LoadingProvider>
      </NativeServices>
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
