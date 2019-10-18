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
  services,
  children,
  watcherIgnored,
  onBluetoothActivated,
  onBluetoothDeactivated,
  onGPSActivated,
  onGPSDeactivated,
}) => {
  const [bluetoothState, setBluetoothState] = useState();
  const [gpsState, setGpsState] = useState();

  const getRequiredService = useCallback(() => {
    if ((services & SERVICES.GPS) && gpsState !== GPSState.AUTHORIZED) {
      return { name: 'GPS', icon: 'crosshairs-gps' };
    }

    if ((services & SERVICES.BLUETOOTH) && bluetoothState !== 'PoweredOn') {
      return { name: 'Bluetooth', icon: 'bluetooth' };
    }
  }, [gpsState, bluetoothState]);

  useEffect(() => {
    if (watcherIgnored) return;

    let mounted = true;
    Promise.all([
      (services & SERVICES.GPS) && GPSState.getStatus(),
      (services & SERVICES.BLUETOOTH) && BluetoothStateManager.getState(),
    ]).then(([gpsState, bluetoothState]) => {
      if (!mounted) return;
      if (gpsState != null) setGpsState(gpsState);
      if (bluetoothState != null) setBluetoothState(bluetoothState);
    });

    return () => {
      mounted = false;
    };
  }, [watcherIgnored]);

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
    if (watcherIgnored) return;

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
  }, [setGpsState, setBluetoothState, watcherIgnored]);

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
