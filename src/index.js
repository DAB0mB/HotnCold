import { ApolloProvider } from '@apollo/react-hooks';
import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import MapboxGL from '@react-native-mapbox-gl/maps';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import CONFIG from 'react-native-config';
import Cookie from 'react-native-cookie';

import BaseContainer from './containers/Base';
import graphqlClient from './graphql/client';
import { BluetoothLEProvider } from './services/BluetoothLE';
import { CookieProvider } from './services/Cookie';
import { DateTimePickerProvider } from './services/DateTimePicker';
import { DeviceInfoProvider } from './services/DeviceInfo';
import { DropdownAlertProvider } from './services/DropdownAlert';
import { GeolocationProvider } from './services/Geolocation';
import { ImagePickerProvider } from './services/ImagePicker';

const initializingNative = Promise.all([
  MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN),
  __DEV__ && CONFIG.INITIAL_USER_TOKEN && Cookie.set(CONFIG.SERVER_URI, 'authToken', CONFIG.INITIAL_USER_TOKEN),

  BluetoothStateManager.getState().then((state) => {
    if (state === 'Unsupported') {
      return false;
    }

    return BleManager.start();
  }).then(() => {
    return true;
  }),

  new Promise((resolve, reject) => {
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      stationaryRadius: 50,
      distanceFilter: 50,
      notificationTitle: 'Hot&Cold location tracking',
      notificationText: 'enabled',
      debug: __DEV__,
      startOnBoot: false,
      stopOnTerminate: true,
      locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
      interval: 10000,
      fastestInterval: 5000,
      activitiesInterval: 10000,
      stopOnStillActivity: false,
      url: `${CONFIG.SERVER_URI}/location`,
    }, resolve, reject);
  }),
]).then((results) => {
  return {
    supportsBluetooth: results[2]
  };
});

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});

const App = () => {
  const [nativeInitialized, setNativeInitialized] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState({});

  useEffect(() => {
    initializingNative.then((deviceInfo) => {
      setNativeInitialized(true);
      setDeviceInfo(deviceInfo);
    });
  }, [true]);

  if (!nativeInitialized) {
    return null;
  }

  return (
    <View style={styles.container}>
      <DeviceInfoProvider info={deviceInfo}>
      <ApolloProvider client={graphqlClient}>
      <CookieProvider>
      <DropdownAlertProvider>
      <DateTimePickerProvider>
      <ImagePickerProvider>
      <BluetoothLEProvider>
      <GeolocationProvider>
        <BaseContainer />
      </GeolocationProvider>
      </BluetoothLEProvider>
      </ImagePickerProvider>
      </DateTimePickerProvider>
      </DropdownAlertProvider>
      </CookieProvider>
      </ApolloProvider>
      </DeviceInfoProvider>
    </View>
  );
};

export default App;
