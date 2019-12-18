import React, { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { BLE_STATES, useBluetoothLE } from '../services/BluetoothLE';
import { GPS_STATES, useGeolocation } from '../services/Geolocation';
import { useAsyncEffect } from '../utils';

const noop = () => {};

export const SERVICES = {
  GPS:       0b01,
  BLUETOOTH: 0b10,
};

const NativeGuard = ({
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
}) => {
  const [prevServices, setPrevServices] = useState(0);
  const [bluetoothState, setBluetoothState] = useState(null);
  const [gpsState, setGpsState] = useState(null);
  const [requiredService, setRequiredService] = useState(null);
  const [granted, setGranted] = useState(false);
  const [ready, setReady] = useState(false);
  const ble = useBluetoothLE();
  const gps = useGeolocation();

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

    if ((services & SERVICES.GPS) && gpsState === false) {
      setRequiredService(SERVICES.GPS);
      onRequireService(SERVICES.GPS);

      return;
    }

    if ((services & SERVICES.BLUETOOTH) && bluetoothState === false) {
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
      gettingStates.push(gps.state.getStatus());
    }
    else {
      gettingStates.push(null);
    }

    if (!(prevServices & SERVICES.BLUETOOTH) && (services & SERVICES.BLUETOOTH)) {
      gettingStates.push(ble.state.getState());
    }
    else {
      gettingStates.push(null);
    }

    Promise.all(gettingStates).then(([gpsState, bluetoothState]) => {
      if (!mounted) return;
      if (gpsState != null) setGpsState(gpsState === GPS_STATES.AUTHORIZED);
      if (bluetoothState != null) setBluetoothState(bluetoothState === BLE_STATES.POWRED_ON);

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
        if (state === GPS_STATES.AUTHORIZED) {
          setGpsState(true);
        }
        else {
          setGpsState(false);
        }
      };

      gps.state.addListener(gpsListener);
    }

    let bluetoothListener;
    if (services & SERVICES.BLUETOOTH) {
      bluetoothListener = ble.state.onStateChange((state) => {
        if (state === BLE_STATES.POWRED_ON) {
          setBluetoothState(true);
        }
        else {
          setBluetoothState(false);
        }
      });
    }

    return () => {
      if (gpsListener) {
        gps.state.removeListener(gpsListener);
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

  return (
    <>
      {children}
      {requiredService && ServiceRequiredComponent && <ServiceRequiredComponent service={requiredService} />}
    </>
  );
};

export default NativeGuard;
