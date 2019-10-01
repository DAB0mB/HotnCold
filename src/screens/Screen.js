import MapboxGL from '@react-native-mapbox-gl/maps';
import { ApolloProvider } from '@apollo/react-hooks';
import React, { useEffect, useState } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import CONFIG from 'react-native-config';
import DropdownAlert from 'react-native-dropdownalert';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import ActivityIndicator from '../components/ActivityIndicator';
import PermissionRequestor from '../components/PermissionRequestor';
import graphqlClient from '../graphql/client';
import * as queries from '../graphql/queries';
import { MeProvider } from '../services/Auth';
import { BluetoothLEProvider } from '../services/BluetoothLE';
import { useAlertError, DropdownAlertProvider } from '../services/DropdownAlert';
import { useGeolocation, GeolocationProvider } from '../services/Geolocation';
import { NavigationProvider } from '../services/Navigation';
import { once as Once, useCounter, useSet } from '../utils';

const once = Once.create();

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
  const meQuery = queries.me.use({ onError: alertError });
  const [readyState, updateReadyState] = useCounter();
  const { me } = meQuery.data || {};

  useEffect(() => {
    if (!me) return;

    once.try(() => {
      once(MapboxGL);

      MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN);
    });

    once.try(() => {
      once(BleManager, Promise.resolve());

      return BleManager.start();
    }).then(() => {
      updateReadyState();
    }).catch(alertError);

    once.try(() => {
      once(CONFIG.BLE_SERVICE_UUID);

      BlePeripheral.addService(CONFIG.BLE_SERVICE_UUID, true);
    });

    // once.try(() => {
    //   once(me.id);

    //   BlePeripheral.addService(me.id, false);
    // });

    BlePeripheral.isAdvertising().then((isAdvertising) => {
      if (!isAdvertising) {
        return BlePeripheral.start();
      }
    }).then(() => {
      updateReadyState();
    }).catch(alertError);

    return () => {
      BlePeripheral.isAdvertising().then((isAdvertising) => {
        if (isAdvertising) {
          BlePeripheral.stop();
        }
      });
    };
  }, [me]);

  if (meQuery.loading || readyState != 2) {
    return (
      <ActivityIndicator />
    );
  }

  return (
    <MeProvider me={me}>
      {children}
    </MeProvider>
  );
};

Screen.create = (Root) => ({ navigation }) => {
  return (
    <ApolloProvider client={graphqlClient}>
      <NavigationProvider navigation={navigation}>
        <DropdownAlertProvider>
          <StatusBar translucent backgroundColor='black' />
          <SafeAreaView style={styles.container}>
            <Screen>
              <Root />
            </Screen>
          </SafeAreaView>
        </DropdownAlertProvider>
      </NavigationProvider>
    </ApolloProvider>
  );
};

Screen.Authorized.create = (Root) => Screen.create(() => {
  return (
    <PermissionRequestor functions={['bluetooth', 'location']}>
      <BluetoothLEProvider>
        <GeolocationProvider>
          <Screen.Authorized>
            <Root />
          </Screen.Authorized>
        </GeolocationProvider>
      </BluetoothLEProvider>
    </PermissionRequestor>
  );
});

export default Screen;
