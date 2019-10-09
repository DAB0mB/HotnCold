import MapboxGL from '@react-native-mapbox-gl/maps';
import { ApolloProvider } from '@apollo/react-hooks';
import React, { useEffect, useState } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import CONFIG from 'react-native-config';
import DropdownAlert from 'react-native-dropdownalert';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { TextEncoder } from 'text-encoding';

import ActivityIndicator from '../components/ActivityIndicator';
import PermissionRequestor from '../components/PermissionRequestor';
import graphqlClient from '../graphql/client';
import * as queries from '../graphql/queries';
import { MeProvider } from '../services/Auth';
import { BLE_PERMISSIONS, BLE_PROPERTIES, BluetoothLEProvider } from '../services/BluetoothLE';
import { useCookie, CookieProvider } from '../services/Cookie';
import { DateTimePickerProvider } from '../services/DateTimePicker';
import { useAlertError, DropdownAlertProvider } from '../services/DropdownAlert';
import { GeolocationProvider } from '../services/Geolocation';
import { ImagePickerProvider } from '../services/ImagePicker';
import { useNavigation, NavigationProvider } from '../services/Navigation';
import { once as Once, useRenderer, useSet, useAsyncEffect } from '../utils';

const once = Once.create();

const styles = StyleSheet.create({
  container: {
    paddingTop: getStatusBarHeight(),
    flex: 1,
  }
});

const Screen = ({ children }) => {
  if (__DEV__ && CONFIG.INITIAL_USER_TOKEN) {
    const cookie = useCookie();
    const alertError = useAlertError();
    const [cookieReady, setCookieReady] = useState(!!CONFIG.INITIAL_USER_TOKEN);

    useEffect(() => {
      once.try(() => {
        once(cookie, Promise.resolve());

        return cookie.set('authToken', CONFIG.INITIAL_USER_TOKEN);
      }).then(() => {
        setCookieReady(true);
      }).catch(alertError);
    }, [true]);

    if (!cookieReady) {
      return (
        <ActivityIndicator />
      );
    }
  }

  return (
    <MeProvider me={null}>
      <DateTimePickerProvider>
        <ImagePickerProvider>
          {children}
        </ImagePickerProvider>
      </DateTimePickerProvider>
    </MeProvider>
  );
};

Screen.Authorized = ({ children }) => {
  const alertError = useAlertError();
  const navigation = useNavigation();
  const meQuery = queries.me.use({ onError: alertError });
  const [readyState, updateReadyState] = useRenderer();
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
      once(BlePeripheral);

      BlePeripheral.addService(CONFIG.BLE_SERVICE_UUID, true);
      BlePeripheral.addCharacteristicToService(CONFIG.BLE_SERVICE_UUID, CONFIG.BLE_CHARACTERISTIC_UUID, BLE_PERMISSIONS.READ, BLE_PROPERTIES.READ);
    });

    BlePeripheral.isAdvertising().then((isAdvertising) => {
      if (!isAdvertising) {
        return BlePeripheral.start();
      }
    }).then(() => {
      const encoder = new TextEncoder();
      const value = encoder.encode(me.id);
      // Will set value, and set notifications if some devices are connected
      // Native code accepts Array and not Uint8Array, so we have to convert it
      BlePeripheral.sendNotificationToDevices(CONFIG.BLE_SERVICE_UUID, CONFIG.BLE_CHARACTERISTIC_UUID, Array.from(value));
      updateReadyState();
    }).catch(alertError);

    return () => {
      BlePeripheral.isAdvertising().then((isAdvertising) => {
        if (isAdvertising) {
          BlePeripheral.stop();
        }
      });
    };
  }, [me && me.id]);

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && !meQuery.error && !me) {
      // Unauthorized
      navigation.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me]);

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
    <CookieProvider>

      <StatusBar translucent backgroundColor='black' />
      <SafeAreaView style={styles.container}>
        <Screen>
          <Root />
        </Screen>
      </SafeAreaView>

    </CookieProvider>
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
