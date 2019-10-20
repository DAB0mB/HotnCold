import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import GPSState from 'react-native-gps-state';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { SERVICES } from '../services/NativeServices';
import { colors } from '../theme';

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

const NativeServicesWatcher = ({
  children,
  services,
  onBluetoothActivated,
  onBluetoothDeactivated,
  onGPSActivated,
  onGPSDeactivated,
}) => {
  const [recentServices, setRecentServices] = useState(0);
  const [bluetoothState, setBluetoothState] = useState(null);
  const [gpsState, setGpsState] = useState(null);

  const getRequiredService = useCallback(() => {
    if ((services & SERVICES.GPS) && gpsState === false) {
      return { name: 'GPS', icon: 'crosshairs-gps' };
    }

    if ((services & SERVICES.BLUETOOTH) && bluetoothState === false) {
      return { name: 'Bluetooth', icon: 'bluetooth' };
    }
  }, [services, gpsState, bluetoothState]);

  useEffect(() => {
    let mounted = true;
    const gettingStates = [];

    if (!(recentServices & SERVICES.GPS) && (services & SERVICES.GPS)) {
      gettingStates.push(GPSState.getStatus());
    } else {
      gettingStates.push(null);
    }

    if (!(recentServices & SERVICES.BLUETOOTH) && (services & SERVICES.BLUETOOTH)) {
      gettingStates.push(BluetoothStateManager.getState());
    } else {
      gettingStates.push(null);
    }

    Promise.all(gettingStates).then(([gpsState, bluetoothState]) => {
      if (!mounted) return;
      if (gpsState != null) setGpsState(gpsState === GPSState.AUTHORIZED);
      if (bluetoothState != null) setBluetoothState(bluetoothState === 'PoweredOn');

      setRecentServices(services);
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
      onGPSActivated();
    } else {
      onGPSDeactivated();
    }

    setRecentGpsState(gpsState);
  }, [services, gpsState]);

  const [recentBluetoothState, setRecentBluetoothState] = useState(bluetoothState);
  useEffect(() => {
    if (recentBluetoothState === bluetoothState) return;
    if (!(services & SERVICES.BLUETOOTH)) return;

    if (bluetoothState) {
      onBluetoothActivated();
    } else {
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
        } else {
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
        } else {
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
  }, [services, setGpsState, setBluetoothState]);

  const requiredService = getRequiredService();

  if (requiredService) {
    return (
      <>
        {children}
        <View style={styles.container}>
          <Text style={styles.text}>
            <Text style={{ color: colors.hot }}>Please turn on your</Text> <Text style={{ color: colors.cold }}>{requiredService.name}</Text><Text style={{ color: colors.hot }}>.</Text>
          </Text>
          <McIcon name={requiredService.icon} size={25} color={colors.ink} solid />
          {requiredService.customMessage && (
            <Text style={styles.customMessage}>{requiredService.customMessage}</Text>
          )}
        </View>
      </>
    );
  }

  return children;
};

export default NativeServicesWatcher;
