import React, { createContext, useContext, useCallback, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import GPSState from 'react-native-gps-state';

import { colors } from '../theme';
import { useCbQueue } from '../utils';

const NativeServicesContext = createContext(null);

export const SERVICES = {
  GPS:       0x01,
  BLUETOOTH: 0x10,
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    top: 0,
    left: 0,
    paddingLeft: 20,
    paddingRight: 20,
  },
  text: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: 10,
  },
  customMessage: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 10,
    color: colors.cold,
  }
});

export const NativeServicesProvider = ({ children }) => {
  const [services, setServices] = useState(0);
  const [exceptionalServices, setExceptionalServices] = useState(0);
  const [prevServices, setPrevServices] = useState(0);
  const [bluetoothState, setBluetoothState] = useState(null);
  const [gpsState, setGpsState] = useState(null);
  const [requiredService, setRequiredService] = useState(null);
  const [renderServiceRequired, setServiceRequiredRenderFn] = useState(() => () => null);
  const [onBluetoothActivated, useBluetoothActivatedCallback] = useCbQueue([services]);
  const [onBluetoothDeactivated, useBluetoothDeactivatedCallback] = useCbQueue([services]);
  const [onGpsActivated, useGpsActivatedCallback] = useCbQueue([services]);
  const [onGpsDeactivated, useGpsDeactivatedCallback] = useCbQueue([services]);
  const [onServicesReset, useServicesResetCallback] = useCbQueue([services]);

  useEffect(() => {
    if ((services & SERVICES.GPS) && !(exceptionalServices & SERVICES.GPS) && gpsState === false) {
      setRequiredService({ name: 'GPS', icon: 'crosshairs-gps' });

      return;
    }

    if ((services & SERVICES.BLUETOOTH) && !(exceptionalServices & SERVICES.BLUETOOTH) && bluetoothState === false) {
      setRequiredService({ name: 'Bluetooth', icon: 'bluetooth' });

      return;
    }

    setRequiredService(null);
  }, [services, gpsState, bluetoothState]);

  useEffect(() => {
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
  }, [services]);

  const [recentGpsState, setRecentGpsState] = useState(gpsState);
  useEffect(() => {
    if (recentGpsState === gpsState) return;
    if (!(services & SERVICES.GPS)) return;

    if (gpsState) {
      onGpsActivated();
    }
    else {
      onGpsDeactivated();
    }

    setRecentGpsState(gpsState);
  }, [services, gpsState]);

  const [recentBluetoothState, setRecentBluetoothState] = useState(bluetoothState);
  useEffect(() => {
    if (recentBluetoothState === bluetoothState) return;
    if (!(services & SERVICES.BLUETOOTH)) return;

    if (bluetoothState) {
      onBluetoothActivated();
    }
    else {
      onBluetoothDeactivated();
    }

    setRecentBluetoothState(bluetoothState);
  }, [services, bluetoothState]);

  useEffect(() => {
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

    onServicesReset();

    return () => {
      if (gpsListener) {
        GPSState.removeListener(gpsListener);
      }

      if (bluetoothListener) {
        bluetoothListener.remove();
      }
    };
  }, [services, setGpsState, setBluetoothState]);

  const useServices = useCallback((newServices) => {
    useEffect(() => {
      setServices(newServices);

      return () => {
        setServices(services);
      };
    }, [true]);
  }, [services]);

  const contextMemo = {
    gpsState,
    bluetoothState,
    services,
    setServices,
    exceptionalServices,
    setExceptionalServices,
    useServices,
    requiredService,
    renderServiceRequired,
    setServiceRequiredRenderFn,
    useBluetoothActivatedCallback,
    useBluetoothDeactivatedCallback,
    useGpsActivatedCallback,
    useGpsDeactivatedCallback,
    useServicesResetCallback,
  };
  const context = useMemo(() => contextMemo, Object.values(contextMemo));

  return (
    <NativeServicesContext.Provider value={context}>
      {children}
      {renderServiceRequired(context)}
    </NativeServicesContext.Provider>
  );
};

export const useNativeServices = () => {
  return useContext(NativeServicesContext);
};
