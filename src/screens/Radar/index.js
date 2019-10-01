import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Button, Image, View, Text, ScrollView, TouchableOpacity, BackHandler } from 'react-native';
import CONFIG from 'react-native-config';

import * as queries from '../../graphql/queries';
import { useMe } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import {
  useBluetoothLE,
  BluetoothLEProvider,
  BLE_PERMISSIONS,
  BLE_PROPERTIES,
} from '../../services/BluetoothLE';
import { useNavigation } from '../../services/Navigation';
import Screen from '../Screen';

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
  const navigation = useNavigation();
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

  useEffect(() => {
    const onDiscoverPeripheral = (peripheral) => {
      const potentialUserIds = peripheral.advertising.serviceUUIDs.filter(id => id !== CONFIG.BLE_SERVICE_UUID);

      queryUser({
        variables: { userIds: potentialUserIds },
      });
    };

    const onStopScan = () => {
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
      navigation.goBack();

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
      return ble.central.scan([CONFIG.BLE_SERVICE_UUID], 5, false)
    }).then(() => {
      setScanning(true);
      setDiscoveredUsers([]);

      if (__DEV__) {
        queryUser({
          variables: { userId: '72533735-643f-4839-a623-0399e934e94f' },
        });
      }
    });
  }, [ble.central]);

  const navToUserProfile = useCallback((user) => {
    navigation.push('Profile', { user });
  }, [navigation]);

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

export default Screen.Authorized.create(Radar);
