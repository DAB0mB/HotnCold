import { bytesToString } from 'convert-string';
import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Button, Image, View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import CONFIG from 'react-native-config';

import * as queries from '../graphql/queries';
import { useMe } from '../services/Auth';
import { useBluetoothLE, BluetoothLEProvider } from '../services/BluetoothLE';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import Base from './Base';
import Discovery from './Discovery';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'silver'
  },
  userItemImage: {
    width: 50,
    height: 50,
    marginRight: 10,
    borderRadius: 25,
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

  useEffect(() => {
    const backHandler = () => {
      discoveryNavigation.goBack();

      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', backHandler);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backHandler);
    };
  }, [true]);

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
      <ScrollView>
        {discoveredUsers.map((user) =>
          <TouchableOpacity key={user.id} style={styles.userItem} onPress={() => navToUserProfile(user)}>
            <Image style={styles.userItemImage} source={{ uri: user.pictures[0] }} />
            <Text>{user.firstName}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
      <Button disabled={scanning} title={scanning ? 'scanning...' : 'scan'} onPress={scan} />
    </View>
  );
};

export default Discovery(Radar);
