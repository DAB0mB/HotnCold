import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import GPSState from 'react-native-gps-state';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { SERVICES } from '../services/NativeServices';
import { colors } from '../theme';

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
  children,
  services = 0,
  onBluetoothActivated = () => {},
  onBluetoothDeactivated = () => {},
  onGPSActivated = () => {},
  onGPSDeactivated = () => {},
}) => {
  const [recentServices, setRecentServices] = useState(0);
  const [bluetoothState, setBluetoothState] = useState(null);
  const [gpsState, setGpsState] = useState(null);

  const getRequiredService = useCallback(() => {
    if ((services & SERVICES.GPS) && gpsState !== GPSState.AUTHORIZED) {
      return { name: 'GPS', icon: 'crosshairs-gps' };
    }

    if ((services & SERVICES.BLUETOOTH) && bluetoothState !== 'PoweredOn') {
      return { name: 'Bluetooth', icon: 'bluetooth' };
    }
  }, [gpsState, bluetoothState]);

  useEffect(() => {
    let mounted = true;
    const gettingStates = [];

    if (!(recentServices & SERVICES.GPS) && (services & SERVICES.GPS)) {
      gettingStates.push(GPSState.getStatus());
    }

    if (!(recentServices & SERVICES.BLUETOOTH) && (services & SERVICES.BLUETOOTH)) {
      gettingStates.push(BluetoothStateManager.getState());
    }

    Promise.all(gettingStates).then(([gpsState, bluetoothState]) => {
      if (!mounted) return;
      if (gpsState != null) setGpsState(gpsState);
      if (bluetoothState != null) setBluetoothState(bluetoothState);

      setRecentServices(services);
    });

    return () => {
      mounted = false;
    };
  }, [services]);

  useEffect(() => {
    if (gpsState == null) return;

    if (gpsState === GPSState.AUTHORIZED) {
      onGPSActivated();
    } else {
      onGPSDeactivated();
    }
  }, [gpsState === GPSState.AUTHORIZED]);

  useEffect(() => {
    if (bluetoothState == null) return;

    if (bluetoothState === 'PoweredOn') {
      onBluetoothActivated();
    } else {
      onBluetoothDeactivated();
    }
  }, [bluetoothState === 'PoweredOn']);

  useEffect(() => {
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
      if (gpsListener) {
        GPSState.removeListener(gpsListener);
      }

      if (bluetoothListener) {
        bluetoothListener.remove();
      }
    };
  }, [setGpsState, setBluetoothState]);

  if (
    ((services & SERVICES.BLUETOOTH) && bluetoothState == null) ||
    ((services & SERVICES.GPS) && gpsState == null)
  ) {
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
