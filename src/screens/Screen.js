import { ApolloProvider } from '@apollo/react-hooks';
import React, { useEffect, useState } from 'react';
import { View, StatusBar, SafeAreaView, StyleSheet } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import CONFIG from 'react-native-config';
import DropdownAlert from 'react-native-dropdownalert';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import ActivityIndicator from '../components/ActivityIndicator';
import PermissionRequestor from '../components/PermissionRequestor';
import graphqlClient from '../graphql/client';
import * as queries from '../graphql/queries';
import { AuthProvider } from '../services/Auth';
import { useBluetoothLE, BluetoothLEProvider } from '../services/BluetoothLE';
import { useAlertError, DropdownAlertProvider } from '../services/DropdownAlert';
import { useGeolocation, GeolocationProvider } from '../services/Geolocation';
import { NavigationProvider } from '../services/Navigation';
import { useSet } from '../utils';

const styles = StyleSheet.create({
  container: {
    paddingTop: getStatusBarHeight(),
    flex: 1,
  }
});

const Screen = ({ children }) => {
  return children;
};

Screen.Authorized = ({ children }) => {
  const alertError = useAlertError();
  const ble = useBluetoothLE();
  const meQuery = queries.me.use({ onError: alertError });
  const startedServices = useSet([]);
  const { me } = meQuery.data || {};

  useEffect(() => {
    if (!me) return;

    BlePeripheral.start().then(() => {
      ble.peripheral.addService(CONFIG.BLE_SERVICE_UUID, true);
      ble.peripheral.addService(me.id, false);
      startedServices.add(BlePeripheral);
    }).catch(alertError);

    BleManager.start().then(() => {
      startedServices.add(BleManager);
    }).catch(alertError);

    return () => {
      if (startedServices.has(BlePeripheral)) {
        BlePeripheral.stop();
      }
    };
  }, [me]);

  if (meQuery.loading || startedServices.size != 2) {
    return (
      <ActivityIndicator />
    );
  }

  return (
    <AuthProvider me={me}>
      {children}
    </AuthProvider>
  );
};

Screen.create = (Root, ScreenType = Screen) => ({ navigation }) => {
  return (
    <ApolloProvider client={graphqlClient}>
      <NavigationProvider navigation={navigation}>
        <DropdownAlertProvider>
          <ScreenType>
            <StatusBar translucent backgroundColor='black' />
            <SafeAreaView style={styles.container}>
              <Root />
            </SafeAreaView>
          </ScreenType>
        </DropdownAlertProvider>
      </NavigationProvider>
    </ApolloProvider>
  );
};

Screen.Authorized.create = (Root) => Screen.create(Root, (props) =>
  <PermissionRequestor functions={['bluetooth', 'location']}>
    <BluetoothLEProvider>
      <GeolocationProvider>
        <Screen.Authorized {...props} />
      </GeolocationProvider>
    </BluetoothLEProvider>
  </PermissionRequestor>
);

export default Screen;
