import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform, Dimensions } from 'react-native'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const size = Platform.OS == 'android' ? Dimensions.get('window').width / 4 : 'large';

const ViewLoadingIndicator = () => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size={size} color="#0000ff" />
    </View>
  );
};

export default ViewLoadingIndicator;
