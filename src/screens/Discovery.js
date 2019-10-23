import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';
import CONFIG from 'react-native-config';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import BlePeripheral from 'react-native-ble-peripheral';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';

import * as queries from '../graphql/queries';
import { useAlertError } from '../services/DropdownAlert';
import { useHeader } from '../services/Header';
import { useLoading } from '../services/Loading';
import { useNativeServices, SERVICES } from '../services/NativeServices';
import { useNavigation, NavigationProvider } from '../services/Navigation';
import { useRenderer, useAsyncEffect } from '../utils';

const Discovery = Symbol('Discovery');

Discovery.create = (Component) => Base.create(() => {
  return ({ navigation: discoveryNavigation }) => {
    const alertError = useAlertError();
    const baseNavigation = useNavigation();
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

    const [, setHeaderProps] = useHeader();

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
      if (meQuery.loading) return;

      setHeaderProps({ me, baseNavigation, discoveryNavigation });
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
      <NavigationProvider key={Discovery} navigation={navigation}>
        <Component />
      </NavigationProvider>
    );
  };
});

export default Discovery;
