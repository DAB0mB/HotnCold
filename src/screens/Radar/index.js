import React from 'react';
import { View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
});

const Profile = () => {
  return (
    <View style={styles.container}>
    </View>
  );
};

export default Screen.create(Profile);
