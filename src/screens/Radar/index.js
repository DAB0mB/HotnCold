import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import CONFIG from 'react-native-config';

import AuthorizedView from '../../components/AuthorizedView';
import ViewLoadingIndicator from '../../components/ViewLoadingIndicator';
import { useBluetoothLE, BluetoothLEProvider, PERMISSIONS, PROPERTIES } from '../../services/BluetoothLE';
import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
});

const Radar = () => {
  const ble = useBluetoothLE({
    configurePeripheral(peripheral, once) {
      once(Radar);
      peripheral.addService(CONFIG.BLE_SERVICE_UUID, true);
      peripheral.addCharacteristicToService(CONFIG.BLE_SERVICE_UUID, CONFIG.BLE_CHARACTERISTICS_UUID, PERMISSIONS.READ, PROPERTIES.READ);
    },
  });

  if (ble.loading) {
    return (
      <ViewLoadingIndicator />
    );
  }

  return (
    <View style={styles.container}>
      <Text>{ble.error}</Text>
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
