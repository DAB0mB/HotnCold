import React, { useEffect } from 'react';
import CONFIG from 'react-native-config';
import BlePeripheral from 'react-native-ble-peripheral';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';

import * as queries from '../../graphql/queries';
import { useAlertError } from '../../services/DropdownAlert';
import { HeaderProvider } from '../../services/Header';
import { useHeader } from '../../services/Header';
import { LoadingProvider, useLoading } from '../../services/Loading';
import { NativeServicesProvider } from '../../services/NativeServices';
import { useNativeServices, SERVICES } from '../../services/NativeServices';
import { useNavigation, NavigationProvider } from '../../services/Navigation';
import { useRenderer, useAsyncEffect } from '../../utils';
import Base from '../Base';
import Header from './Header';
import ServiceRequired from './ServiceRequired';

const Discovery = Base.create(() => {
  const { default: DiscoveryRouter } = require('../../routers/Discovery');
  const baseNavigation = useNavigation();

  return (
    <HeaderProvider HeaderComponent={Header} defaultProps={{ baseNavigation }}>
      <LoadingProvider>
        <NativeServicesProvider ServiceRequiredComponent={ServiceRequired}>
          <DiscoveryRouter />
        </NativeServicesProvider>
      </LoadingProvider>
    </HeaderProvider>
  );
});

Discovery.create = (Component) => {
  return ({ navigation: discoveryNavigation }) => {
    const alertError = useAlertError();
    const baseNavigation = useNavigation(Base);
    const meQuery = queries.me.use({ onError: alertError });
    const { me } = meQuery.data || {};
    const setLoading = useLoading();
    const [resettingBleState, updateBleResettingState, restoreBleResettingState] = useRenderer();

    const {
      gpsState,
      bluetoothState,
      services,
      exceptionalServices,
      setExceptionalServices,
      requiredService,
      useServices,
      useBluetoothActivatedCallback,
      useServicesResetCallback,
    } = useNativeServices();

    const [headerProps, setHeaderProps] = useHeader();

    useServices(services | SERVICES.BLUETOOTH | SERVICES.GPS);

    useBluetoothActivatedCallback(() => {
      // Bluetooth reset is finalized when event is emitted, not when promise resolves
      if (resettingBleState) {
        updateBleResettingState();
        setExceptionalServices(exceptionalServices ^ SERVICES.BLUETOOTH);
      }
      else {
        setExceptionalServices(exceptionalServices | SERVICES.BLUETOOTH);

        BlePeripheral.stop()

        BluetoothStateManager.disable().then(() => {
          return BluetoothStateManager.enable();
        }),

        updateBleResettingState();
      }
    }, [resettingBleState]);

    useAsyncEffect(function* () {
      if (resettingBleState !== 2) return;
      if (!me) return;

      updateBleResettingState();

      BlePeripheral.setName(CONFIG.BLUETOOTH_ADAPTER_NAME);
      BlePeripheral.addService(me.id, true);
      // Async, run in background
      yield BlePeripheral.start();

      restoreBleResettingState();
    }, [me && me.id, resettingBleState]);

    useEffect(() => {
      if (meQuery.called && !meQuery.loading && !meQuery.error && !me) {
        // Unauthorized
        baseNavigation.replace('Profile');
      }
    }, [meQuery.called, meQuery.loading, meQuery.error, me, baseNavigation]);

    useEffect(() => {
      if (meQuery.loading) {
        setHeaderProps({ ...headerProps, discoveryNavigation });
      }

      setHeaderProps({ ...headerProps, discoveryNavigation, me });

      return () => {
        setHeaderProps(headerProps);
      };
    }, [meQuery.loading]);

    if (
      gpsState == null ||
      bluetoothState == null ||
      requiredService
    ) {
      setLoading(false);

      return null;
    }

    if (meQuery.loading || resettingBleState) {
      setLoading(true);

      return null;
    }

    setLoading(false);

    return (
      <NavigationProvider navKey={Discovery} navigation={discoveryNavigation}>
        <Component />
      </NavigationProvider>
    );
  };
};

export default Discovery;
