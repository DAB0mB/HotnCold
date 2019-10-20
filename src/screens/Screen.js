import { ApolloProvider } from '@apollo/react-hooks';
import { stringToBytes } from 'convert-string';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';
import BlePeripheral from 'react-native-ble-peripheral';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import CONFIG from 'react-native-config';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import ActivityIndicator from '../components/ActivityIndicator';
import graphqlClient from '../graphql/client';
import * as queries from '../graphql/queries';
import { MeProvider } from '../services/Auth';
import { BluetoothLEProvider } from '../services/BluetoothLE';
import { useCookie, CookieProvider } from '../services/Cookie';
import { DateTimePickerProvider } from '../services/DateTimePicker';
import { useAlertError } from '../services/DropdownAlert';
import { GeolocationProvider } from '../services/Geolocation';
import { useHeaderState } from '../services/Header';
import { ImagePickerProvider } from '../services/ImagePicker';
import { useNativeServices, SERVICES } from '../services/NativeServices';
import { useNavigation, NavigationProvider } from '../services/Navigation';
import { useLoading, LoadingProvider } from '../services/Loading';
import { once as Once, useRenderer, useAsyncEffect } from '../utils';

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
  const { me } = meQuery.data || {};
  const [, setHeader] = useHeaderState();
  const setLoading = useLoading();
  const [resettingBluetooth, setBluetoothResettingPromise] = useState();
  const awaitingBluetoothReset = useRef(false);

  const {
    services,
    setServices,
    useServices,
    useBluetoothActivatedCallback,
    useServicesResetCallback,
  } = useNativeServices();

  // Avoid circular dependencies
  const Router = require('../Router').default;
  const { Header } = Router.router.getComponentForRouteName(navigation.state.routeName).Component;

  useServices(services | SERVICES.BLUETOOTH | SERVICES.GPS);

  useBluetoothActivatedCallback(() => {
    setServices(services ^ SERVICES.BLUETOOTH);

    awaitingBluetoothReset.current = true;
  });

  useServicesResetCallback(() => {
    if (!awaitingBluetoothReset.current) return;

    awaitingBluetoothReset.current = false;

    const resettingBluetooth = BluetoothStateManager.disable().then(() => {
      return BluetoothStateManager.enable();
    });

    setBluetoothResettingPromise(resettingBluetooth);
  });

  useAsyncEffect(function* () {
    if (!resettingBluetooth) return;
    if (!me) return;

    try {
      yield resettingBluetooth;

      BlePeripheral.setName(CONFIG.BLUETOOTH_ADAPTER_NAME);
      BlePeripheral.addService(me.id, true);

      yield BlePeripheral.start();
    }
    finally {
      setBluetoothResettingPromise(null);
      setNativeServices({ services: nativeServices.services | SERVICES.BLUETOOTH });
    }
  }, [me && me.id, resettingBluetooth]);

  useEffect(() => {
    if (meQuery.called && !meQuery.loading && !meQuery.error && !me) {
      // Unauthorized
      navigation.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me]);

  useEffect(() => {
    if (meQuery.loading) return;
    if (!Header) return;

    setHeader(<Header navigation={navigation} me={me} />);

    const listener = navigation.addListener('didFocus', () => {
      setHeader(<Header navigation={navigation} me={me} />);
    });

    return () => {
      listener.remove();
    };
  }, [meQuery.loading]);

  if (meQuery.loading && resettingBluetooth) {
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
    const mountedRef = useRef(false);

    // Avoid circular dependencies
    const Router = require('../Router').default;

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
          if (!mountedRef.current) return;

          immediateRef.current = null;
          setLoadingState(value);
        });
      }
    }, [loadingRef, immediateRef, isLoading, setLoadingState, fadeAnimRef, mountedRef]);

    useEffect(() => {
      mountedRef.current = true;

      return () => {
        mountedRef.current = false;
      };
    }, [true]);

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
      <BluetoothLEProvider>
      <GeolocationProvider>
        <Screen.Authorized>
          <Component />
        </Screen.Authorized>
      </GeolocationProvider>
      </BluetoothLEProvider>
    );
  });

  ComponentScreen.Component = Component;

  return ComponentScreen;
};

export default Screen;
