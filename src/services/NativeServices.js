import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View, Platform } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import GPSState from 'react-native-gps-state';

import { useAsyncEffect } from '../utils';

const noop = () => {};

export const SERVICES = {
  GPS:       0x01,
  BLUETOOTH: 0x10,
};

const NativeServices = forwardRef(({
  children,
  onReady = noop,
  onError = noop,
  onBluetoothActivated = noop,
  onBluetoothDeactivated = noop,
  onGpsActivated = noop,
  onGpsDeactivated = noop,
  onRequireService = noop,
  ServiceRequiredComponent,
  services,
}, ref) => {
  const [exceptionalServices, setExceptionalServices] = useState(0);
  const [prevServices, setPrevServices] = useState(0);
  const [bluetoothState, setBluetoothState] = useState(null);
  const [gpsState, setGpsState] = useState(null);
  const [requiredService, setRequiredService] = useState(null);
  const [granted, setGranted] = useState(false);
  const [ready, setReady] = useState(false);

  useAsyncEffect(function* () {
    // Scope is more clear this way
    const { check, request, PERMISSIONS, RESULTS } = require('react-native-permissions');

    setGranted(false);

    const grant = function* (permission) {
      let result;

      tryCatch:
      try {
        const curr = yield check(permission);

        if (curr === RESULTS.GRANTED) {
          result = true;
          break tryCatch;
        }

        if (curr === RESULTS.DENIED) {
          result = (yield request(permission)) === RESULTS.GRANTED;
          break tryCatch;
        }

        result = false;
      } catch (e) {
        onError(e);

        result = false;
      }

      if (!result) {
        setBluetoothState(false);
        setGpsState(false);
      }

      return result;
    };

    if (services & SERVICES.GPS) {
      if (Platform.OS === 'android') {
        if (!(yield* grant(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION))) return;
        if (!(yield* grant(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION))) return;
      }
      if (Platform.OS === 'ios') {
        if (!(yield* grant(PERMISSIONS.IOS.LOCATION_ALWAYS))) return;
      }
    }

    if (services & SERVICES.BLUETOOTH) {
      if (Platform.OS === 'ios') {
        if (!(yield* grant(PERMISSIONS.IOS.BLUETOOTH_PERIPHERAL))) return;
      }
    }

    setGranted(true);
  }, [services]);

  useEffect(() => {
    if (!granted) return;

    if ((services & SERVICES.GPS) && !(exceptionalServices & SERVICES.GPS) && gpsState === false) {
      setRequiredService(SERVICES.GPS);
      onRequireService(SERVICES.GPS);

      return;
    }

    if ((services & SERVICES.BLUETOOTH) && !(exceptionalServices & SERVICES.BLUETOOTH) && bluetoothState === false) {
      setRequiredService(SERVICES.BLUETOOTH);
      onRequireService(SERVICES.BLUETOOTH);

      return;
    }

    if (requiredService != null) {
      setRequiredService(null);
      onRequireService(null);

      return;
    }
  }, [granted, services, gpsState, bluetoothState]);

  useEffect(() => {
    if (!granted) return;

    let mounted = true;
    const gettingStates = [];

    if (!(prevServices & SERVICES.GPS) && (services & SERVICES.GPS)) {
      gettingStates.push(GPSState.getStatus());
    }
    else {
      gettingStates.push(null);
    }

    if (!(prevServices & SERVICES.BLUETOOTH) && (services & SERVICES.BLUETOOTH)) {
      gettingStates.push(BluetoothStateManager.getState());
    }
    else {
      gettingStates.push(null);
    }

    Promise.all(gettingStates).then(([gpsState, bluetoothState]) => {
      if (!mounted) return;
      if (gpsState != null) setGpsState(gpsState === GPSState.AUTHORIZED);
      if (bluetoothState != null) setBluetoothState(bluetoothState === 'PoweredOn');

      setPrevServices(services);
    });

    return () => {
      mounted = false;
    };
  }, [granted, services]);

  const [recentGpsState, setRecentGpsState] = useState(gpsState);
  useEffect(() => {
    if (!granted) return;
    if (recentGpsState === gpsState) return;
    if (!(services & SERVICES.GPS)) return;

    if (gpsState) {
      onGpsActivated();
    }
    else {
      onGpsDeactivated();
    }

    setRecentGpsState(gpsState);
  }, [granted, services, gpsState]);

  const [recentBluetoothState, setRecentBluetoothState] = useState(bluetoothState);
  useEffect(() => {
    if (!granted) return;
    if (recentBluetoothState === bluetoothState) return;
    if (!(services & SERVICES.BLUETOOTH)) return;

    if (bluetoothState) {
      onBluetoothActivated();
    }
    else {
      onBluetoothDeactivated();
    }

    setRecentBluetoothState(bluetoothState);
  }, [granted, services, bluetoothState]);

  useEffect(() => {
    if (!granted) return;

    let gpsListener;
    if (services & SERVICES.GPS) {
      gpsListener = (state) => {
        if (state === GPSState.AUTHORIZED) {
          setGpsState(true);
        }
        else {
          setGpsState(false);
        }
      };

      GPSState.addListener(gpsListener);
    }

    let bluetoothListener;
    if (services & SERVICES.BLUETOOTH) {
      bluetoothListener = BluetoothStateManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          setBluetoothState(true);
        }
        else {
          setBluetoothState(false);
        }
      });
    }

    return () => {
      if (gpsListener) {
        GPSState.removeListener(gpsListener);
      }

      if (bluetoothListener) {
        bluetoothListener.remove();
      }
    };
  }, [granted, services, setGpsState, setBluetoothState]);

  useEffect(() => {
    if (ready) return;
    if (!granted) return;
    if ((services & SERVICES.GPS) && gpsState == null) return;
    if ((services & SERVICES.BLUETOOTH) && bluetoothState == null) return;

    setReady(true);
    onReady(true);
  }, [granted, gpsState, bluetoothState]);

  const imperativeHandle = {
    exceptionalServices,
    setExceptionalServices,
  };
  useImperativeHandle(ref, () => imperativeHandle, Object.values(imperativeHandle));

  return (
    <>
      {children}
      {requiredService && ServiceRequiredComponent && <ServiceRequiredComponent service={requiredService} />}
    </>
  );
});

export default NativeServices;
