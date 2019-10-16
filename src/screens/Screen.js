import { ApolloProvider } from '@apollo/react-hooks';
import MapboxGL from '@react-native-mapbox-gl/maps';
import { stringToBytes } from 'convert-string';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import CONFIG from 'react-native-config';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import ActivityIndicator from '../components/ActivityIndicator';
import PermissionRequestor from '../components/PermissionRequestor';
import graphqlClient from '../graphql/client';
import * as queries from '../graphql/queries';
import Router from '../Router';
import { MeProvider } from '../services/Auth';
import { BluetoothLEProvider } from '../services/BluetoothLE';
import { useCookie, CookieProvider } from '../services/Cookie';
import { DateTimePickerProvider } from '../services/DateTimePicker';
import { useAlertError } from '../services/DropdownAlert';
import { GeolocationProvider } from '../services/Geolocation';
import { useHeaderState } from '../services/Header';
import { ImagePickerProvider } from '../services/ImagePicker';
import { useNavigation, NavigationProvider } from '../services/Navigation';
import { useLoading, LoadingProvider } from '../services/Loading';
import { once as Once, useRenderer, useSet, useAsyncEffect } from '../utils';

const once = Once.create();

const styles = StyleSheet.create({
  container: {
    paddingTop: getStatusBarHeight(),
    flex: 1,
  },
  loadingBuffer: {
    backgroundColor: 'white',
    position: 'absolute',
    height: '100%',
    width: '100%',
    top: getStatusBarHeight(),
    left: 0,
  },
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
  const [, setHeader] = useHeaderState();
  const setLoading = useLoading();
  const { Header } = Router.router.getComponentForRouteName(navigation.state.routeName).Component;

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

    BlePeripheral.isAdvertising().then((isAdvertising) => {
      if (!isAdvertising) {
        BlePeripheral.setName(CONFIG.BLUETOOTH_ADAPTER_NAME);
        BlePeripheral.addService(me.id, true);

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
  }, [me && me.id]);

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && !meQuery.error && !me) {
      // Unauthorized
      navigation.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me]);

  useEffect(() => {
    if (meQuery.loading || readyState != 2) return;
    if (!Header) return;

    setHeader(<Header navigation={navigation} me={me} />);

    const listener = navigation.addListener('didFocus', () => {
      setHeader(<Header navigation={navigation} me={me} />);
    });

    return () => {
      listener.remove();
    };
  }, [meQuery.loading, readyState]);

  if (meQuery.loading || readyState != 2) {
    setLoading(true);

    return null;
  }

  setLoading(false);

  return (
    <MeProvider me={me}>
      {children}
    </MeProvider>
  );
};

Screen.create = (Component) => {
  const ComponentScreen = ({ navigation }) => {
    // This one belongs to the root component which never unmounts
    const [, setHeader] = useHeaderState();
    const [isLoading, setLoadingState] = useState(false);
    const fadeAnimRef = useRef(null);
    const loadingRef = useRef(null);
    const immediateRef = useRef(null);

    useEffect(() => {
      if (isLoading) return;
      if (!fadeAnimRef.current) return;

      Animated.timing(
        fadeAnimRef.current,
        {
          toValue: 0,
          duration: 333,
        }
      ).start();
    }, [isLoading]);

    const setLoading = useCallback((value) => {
      if (value) {
        fadeAnimRef.current = new Animated.Value(1);

        loadingRef.current = (
          <Animated.View style={[styles.loadingBuffer, { opacity: fadeAnimRef.current }]}>
            <ActivityIndicator />
          </Animated.View>
        );
      } else {
        loadingRef.current = (
          <Animated.View pointerEvents='none' style={[styles.loadingBuffer, { opacity: fadeAnimRef.current }]}>
            <ActivityIndicator />
          </Animated.View>
        );
      }

      if (value === isLoading) {
        clearImmediate(immediateRef.current);
        immediateRef.current = null;
      } else {
        immediateRef.current = setImmediate(() => {
          immediateRef.current = null;
          setLoadingState(value);
        });
      }
    }, [loadingRef, immediateRef, isLoading, setLoadingState, fadeAnimRef]);

    useEffect(() => {
      navigation.addListener('willFocus', (e) => {
        const { Header } = Router.router.getComponentForRouteName(e.state.routeName).Component;

        setHeader(Header && <Header navigation={navigation} />);
      });

      navigation.addListener('willBlur', (e) => {
        if (!e.action.routeName) return;

        const { Header } = Router.router.getComponentForRouteName(e.action.routeName).Component;

        setHeader(Header && <Header navigation={navigation} />);
      });
    }, [true]);

    return (
      <ApolloProvider client={graphqlClient}>
      <NavigationProvider navigation={navigation}>
      <LoadingProvider setLoading={setLoading}>
      <CookieProvider>
        <StatusBar translucent barStyle="dark-content" backgroundColor='white' />
        <SafeAreaView style={styles.container}>
          <Screen>
            <Component />
            {loadingRef.current}
          </Screen>
        </SafeAreaView>
      </CookieProvider>
      </LoadingProvider>
      </NavigationProvider>
      </ApolloProvider>
    );
  };

  ComponentScreen.Component = Component;

  return ComponentScreen;
};

Screen.Authorized.create = (Component) => {
  const ComponentScreen = Screen.create(() => {
    return (
      <PermissionRequestor functions={['bluetooth', 'location']}>
        <BluetoothLEProvider>
        <GeolocationProvider>
          <Screen.Authorized>
            <Component />
          </Screen.Authorized>
        </GeolocationProvider>
        </BluetoothLEProvider>
      </PermissionRequestor>
    );
  });

  ComponentScreen.Component = Component;

  return ComponentScreen;
};

export default Screen;
