import React, { useMemo, useState } from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import BleManager from 'react-native-ble-manager';
import { BluetoothStatus } from 'react-native-bluetooth-status';
import Permissions from 'react-native-permissions';

import { useAlertError } from '../services/DropdownAlert';
import { useAsyncEffect } from '../utils';
import ActivityIndicator from './ActivityIndicator';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4264fb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  unauthorizedText: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});

const PermissionRequestor = ({ functions: funcs, children }) => {
  const [permissions, setPermissions] = useState(() =>
    funcs.reduce((permissions, func) =>
      Object.assign(permissions, {
        [func]: 'undetermined'
      })
    )
  );
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const alertError = useAlertError();

  useAsyncEffect(function* () {
    const checks = [];
    const permissions = {};

    for (let func of funcs) {
      switch (func) {
        case Platform.OS == 'android' && 'bluetooth':
          checks.push(BluetoothStatus.state().then(authorized => {
            permissions.bluetooth = authorized ? 'authorized' : 'undetermined';
          }));
          break;
        default:
          checks.push(Permissions.check(func).then((state) => {
            permissions[func] = state;
          }));
      }
    }

    yield Promise.all(checks);

    for (let [func, permission] of Object.entries(permissions)) {
      if (permission !== 'authorized') {
        switch (func) {
          // Bluetooth permission request not supported out of the box
          case Platform.OS == 'android' && 'bluetooth':
            try {
              yield BleManager.enableBluetooth();
              permission = 'authorized';
            } catch (e) {
              permission = 'denied';
            }
            break;
          default:
            permission = yield Permissions.request(func);
        }
      }

      if (permission !== 'authorized') {
        alertError(`${func} permission must be granted`);
        setLoading(false);

        return;
      }
    }

    setAuthorized(true);
    setLoading(false);
  }, [true]);

  if (Platform.OS === 'android' && !authorized) {
    if (loading) {
      return (
        <ActivityIndicator />
      );
    }

    return null;
  }

  return children;
};

export default PermissionRequestor;
