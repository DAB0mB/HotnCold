import React from 'react';
import { View, StyleSheet } from 'react-native';
import MapView from 'react-native-maps';

import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
});

const Map = () => {
  return (
    <View style={styles.container}>
      <MapView />
    </View>
  );
};

export default Screen.create(Map);
