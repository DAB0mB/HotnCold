import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import GPSState from 'react-native-gps-state';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors } from '../theme';

export const SERVICES = {
  GPS:       0x01,
  BLUETOOTH: 0x10,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
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

const NativeServicesWatcher = ({
  services,
  children,
  ignored,
  onBluetoothActivated,
  onBluetoothDeactivated,
  onGPSActivated,
  onGPSDeactivated,
}) => {
  const [bluetoothState, setBluetoothState] = useState();
  const [gpsState, setGpsState] = useState();
  const [loading, setLoading] = useState(true);

  const getRequiredService = useCallback(() => {
    if ((services & SERVICES.GPS) && gpsState !== GPSState.AUTHORIZED) {
      return { name: 'GPS', icon: 'crosshairs-gps' };
    }

    if ((services & SERVICES.BLUETOOTH) && bluetoothState !== 'PoweredOn') {
      return { name: 'Bluetooth', icon: 'bluetooth' };
    }
  }, [gpsState, bluetoothState]);

  const initializeStates = useCallback(() => {
    Promise.all([
      (services & SERVICES.GPS) && GPSState.getStatus(),
      (services & SERVICES.BLUETOOTH) && BluetoothStateManager.getState(),
    ]).then(([gpsState, bluetoothState]) => {
      if (gpsState) setGpsState(gpsState);
      if (bluetoothState) setBluetoothState(bluetoothState);
      setLoading(false);
    });
  }, [setGpsState, setBluetoothState]);

  useEffect(() => {
    initializeStates();
  }, [true]);

  useEffect(() => {
    if (gpsState == null) return;

    if (gpsState === GPSState.AUTHORIZED) {
      onGPSActivated();
    } else {
      onGPSDeactivated();
    }
  }, [gpsState === GPSState.AUTHORIZED]);

  useEffect(() => {
    if (ignored) {
      setLoading(true);
    } else {
      initializeStates();
    }
  }, [ignored]);

  useEffect(() => {
    if (bluetoothState == null) return;

    if (bluetoothState === 'PoweredOn') {
      onBluetoothActivated();
    } else {
      onBluetoothDeactivated();
    }
  }, [bluetoothState === 'PoweredOn']);

  useEffect(() => {
    if (loading) return;
    if (ignored) return;

    let gpsListener;
    if (services & SERVICES.GPS) {
      gpsListener = (state) => {
        setGpsState(state);
      };

      GPSState.addListener(gpsListener);
    }

    let bluetoothListener;
    if (services & SERVICES.BLUETOOTH) {
      bluetoothListener = BluetoothStateManager.onStateChange((state) => {
        setBluetoothState(state);
      });
    }

    return () => {
      if (services & SERVICES.GPS) {
        GPSState.removeListener(gpsListener);
      }

      if (services & SERVICES.BLUETOOTH) {
        bluetoothListener.remove();
      }
    };
  }, [gpsState, bluetoothState, loading, ignored]);

  if (loading) {
    return null;
  }

  const requiredService = getRequiredService();

  if (requiredService) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>
          <Text style={{ color: colors.hot }}>Please turn on your</Text> <Text style={{ color: colors.cold }}>{requiredService.name}</Text><Text style={{ color: colors.hot }}>.</Text>
        </Text>
        <McIcon name={requiredService.icon} size={25} color={colors.ink} solid />
        {customMessage && (
          <Text style={styles.customMessage}>{customMessage}</Text>
        )}
      </View>
    );
  }

  return children;
};

export default NativeServicesWatcher;
