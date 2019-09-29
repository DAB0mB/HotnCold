import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Button, Image, View, Text, ScrollView } from 'react-native';
import CONFIG from 'react-native-config';

import AuthorizedView from '../../components/AuthorizedView';
import ViewLoadingIndicator from '../../components/ViewLoadingIndicator';
import * as queries from '../../graphql/queries';
import {
  useBluetoothLE,
  BluetoothLEProvider,
  BLE_PERMISSIONS,
  BLE_PROPERTIES,
} from '../../services/BluetoothLE';
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
  const ble = useBluetoothLE();
  const meQuery = queries.me.use();
  const [scanning, setScanning] = useState(false);
  const [serviceConfigured, setServiceConfigured] = useState(false);
  const [discoveredUsers, setDiscoveredUsers] = useState([
    {
      id: '1',
      firstName: 'Harry',
      pictures: ['https://avatarfiles.alphacoders.com/833/83315.png'],
    }
  ]);

  useEffect(() => {
    if (ble.loading) return;

    const onDiscoverPeripheral = (peripheral) => {
      const potentialUserIds = peripheral.advertising.serviceUUIDs.filter(id => id !== CONFIG.BLE_SERVICE_UUID);

      fetchUser(potentialUserIds).then((user) => {
        if (user) {
          setDiscoveredUsers([
            ...discoveredUsers,
            user,
          ]);
        }
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
  }, [ble.loading]);

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
    });
  }, [ble.central]);

  const { me } = meQuery.data || {};

  if (ble.loading || meQuery.loading) {
    return (
      <ViewLoadingIndicator />
    );
  } else if (!serviceConfigured) {
    ble.peripheral.addService(CONFIG.BLE_SERVICE_UUID, true);
    ble.peripheral.addService(me.id, false);
    setServiceConfigured(true);
  }

  return (
    <View style={styles.container}>
      <ScrollView>
        {discoveredUsers.map((user) =>
          <View key={user.id} style={styles.userItem}>
            <Image style={styles.userItemImage} source={{ uri: user.pictures[0] }} />
            <Text>{user.firstName}</Text>
          </View>
        )}
      </ScrollView>
      <Button disabled={scanning} title={scanning ? 'scanning...' : 'scan'} onPress={scan} />
    </View>
  );
};

export default Screen.create((...props) =>
  <AuthorizedView functions={['bluetooth']}>
    <BluetoothLEProvider>
      <Radar {...props} />
    </BluetoothLEProvider>
  </AuthorizedView>
);
