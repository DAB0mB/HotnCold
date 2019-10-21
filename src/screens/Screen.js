import { ApolloProvider } from '@apollo/react-hooks';
import { stringToBytes } from 'convert-string';
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';
import BlePeripheral from 'react-native-ble-peripheral';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import CONFIG from 'react-native-config';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import ActivityIndicator from '../components/ActivityIndicator';
import ServiceRequired from '../components/ServiceRequired';
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

  // Avoid circular dependencies
  const Router = require('../Router').default;
  const { Header } = Router.router.getComponentForRouteName(navigation.state.routeName).Component;

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
      navigation.replace('Profile');
    }
  }, [meQuery.called, meQuery.loading, meQuery.error, me]);

  useEffect(() => {
    if (meQuery.loading) return;
    if (!Header) return;

    setHeader(Header && <Header navigation={navigation} me={me} />);

    const willFocusListener = navigation.addListener('willFocus', () => {
      setHeader(Header && <Header navigation={navigation} me={me} />);
    });

    return () => {
      willFocusListener.remove();
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
    <MeProvider me={me}>
      {children}
    </MeProvider>
  );
};

Screen.create = (Component) => {
  const ComponentScreen = ({ navigation }) => {
    // This one belongs to the root component which never unmounts
    const [, setHeader] = useHeaderState();
    const { setServiceRequiredComponent } = useNativeServices();
    const [isLoading, setLoadingState] = useState(null);
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
      }
      else {
        loadingRef.current = (
          <Animated.View pointerEvents='none' style={[styles.loadingBuffer, { opacity: fadeAnimRef.current }]}>
            <ActivityIndicator />
          </Animated.View>
        );
      }

      if (!!value === !!isLoading) {
        clearImmediate(immediateRef.current);
        immediateRef.current = null;

        if (isLoading == null) {
          loadingRef.current = null;
        }
      }
      else {
        immediateRef.current = setImmediate(() => {
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

    const Route = Router.router.getComponentForRouteName(navigation.state.routeName);
    const { Header } = Route.Component;
    const { ScreenComponent } = Route;

    useEffect(() => {
      setHeader(Header && <Header navigation={navigation} />);

      const willFocusListener = navigation.addListener('willFocus', () => {
        setHeader(Header && <Header navigation={navigation} />);
      });

      return () => {
        willFocusListener.remove();
      };
    }, [true]);

    if (Route.ScreenComponent === Screen) {
      useEffect(() => {
        setServiceRequiredComponent(null);

        const willFocusListener = navigation.addListener('willFocus', () => {
          setServiceRequiredComponent(null);
        });

        return () => {
          willFocusListener.remove();
        };
      }, [true]);
    }

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

  ComponentScreen.ScreenComponent = Screen;
  ComponentScreen.Component = Component;

  return ComponentScreen;
};

Screen.Authorized.create = (Component) => {
  const ComponentScreen = Screen.create(() => {
    const { setServiceRequiredComponent } = useNativeServices();
    const navigation = useNavigation();

    useEffect(() => {
      setServiceRequiredComponent(ServiceRequired);

      const willFocusListener = navigation.addListener('willFocus', () => {
        setServiceRequiredComponent(ServiceRequired);
      });

      return () => {
        willFocusListener.remove();
      };
    }, [true]);

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

  ComponentScreen.ScreenComponent = Screen.Authorized;
  ComponentScreen.Component = Component;

  return ComponentScreen;
};

export default Screen;
