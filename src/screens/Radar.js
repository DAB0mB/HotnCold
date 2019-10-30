import { bytesToString } from 'convert-string';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Image, View, TouchableWithoutFeedback, Dimensions, Text } from 'react-native';
import CONFIG from 'react-native-config';

import Base from '../containers/Base';
import Discovery from '../containers/Discovery';
import * as queries from '../graphql/queries';
import { useMe } from '../services/Auth';
import { useBluetoothLE, BluetoothLEProvider } from '../services/BluetoothLE';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { colors } from '../theme';
import { pick } from '../utils';

const noop = () => {};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  profilePicture: {
    width: 115,
    height: 115,
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: colors.hot,
    borderWidth: 5,
    borderRadius: 999,
    resizeMode: 'contain',
    overflow: 'hidden',
  },
});

const Radar = () => {
  const me = useMe();
  const ble = useBluetoothLE();
  const discoveryNavigation = useNavigation(Discovery);
  const baseNavigation = useNavigation(Base);
  const alertError = useAlertError();
  const [discoveredUsers, setDiscoveredUsers] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [queryUser] = queries.user.use.lazy({
    onError: alertError,
    onCompleted: useCallback((data) => {
      const user = data.user;

      if (user && !discoveredUsers.some(u => u.id == user.id)) {
        setDiscoveredUsers([
          ...discoveredUsers,
          user,
        ]);
      }
    }, [setDiscoveredUsers, discoveredUsers]),
  });

  // TODO: Send a couple of query batches, after 2 seconds and after 3 seconds of scanning
  useEffect(() => {
    let discoveredUsersIds = [];

    const onDiscoverPeripheral = (peripheral) => {
      if (peripheral.name !== CONFIG.BLUETOOTH_ADAPTER_NAME) return;

      const userId = peripheral.serviceUUIDs[0];

      if (discoveredUsersIds.includes(userId)) return;

      discoveredUsersIds.push(userId);

      queryUser({
        variables: { userId },
      });
    };

    const onStopScan = () => {
      discoveredUsersIds = [];
      setScanning(false);
    };

    ble.emitter.addListener('BleManagerDiscoverPeripheral', onDiscoverPeripheral);
    ble.emitter.addListener('BleManagerStopScan', onStopScan);

    return () => {
      ble.emitter.removeListener('BleManagerDiscoverPeripheral', onDiscoverPeripheral);
      ble.emitter.removeListener('BleManagerStopScan', onStopScan);

      if (scanning) {
        ble.central.stopScan();
      }
    };
  }, [true]);

  discoveryNavigation.useBackListener();

  const scan = useCallback(() => {
    let stoppingScan;

    if (scanning) {
      stoppingScan = ble.central.stopScan();
    } else {
      stoppingScan = Promise.resolve();
    }

    stoppingScan.then(() => {
      return ble.central.scan([], 5, false)
    }).then(() => {
      setScanning(true);
      setDiscoveredUsers([]);

      if (__DEV__ && CONFIG.RADAR_TEST_USER_ID) {
        queryUser({
          variables: { userId: CONFIG.RADAR_TEST_USER_ID },
        });
      }
    });
  }, [ble.central]);

  const navToUserProfile = useCallback((user) => {
    baseNavigation.push('Profile', { user });
  }, [baseNavigation]);

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <TouchableWithoutFeedback onPress={scanning ? scan : noop}>
          <View style={[styles.profilePicture, { borderColor: scanning ? colors.hot : colors.cold }]}>
            <Image source={{ uri: me.pictures[0] }} resizeMode={styles.profilePicture.resizeMode} style={pick(styles.profilePicture, ['width', 'height'])} />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <Text style={{ fontSize: 26, fontWeight: '900', color: colors.ink, textAlign: 'center', margin: 30, position: 'absolute', bottom: 0 }}>{scanning ? 'Looking for people in the venue' : 'Tap on yourself to discover people'}</Text>
    </View>
  );
};

export default Discovery.create(Radar);
