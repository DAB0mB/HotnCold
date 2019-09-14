import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import { NavigationProvider } from '../Navigation';

const styles = StyleSheet.create({
  statusBar: {
    paddingTop: getStatusBarHeight(),
    backgroundColor: 'black',
  },
});

const Screen = ({ navigation, children }) => {
  return (
    <NavigationProvider navigation={navigation}>
      {children}
    </NavigationProvider>
  );
};

Screen.create = (Root) => ({ navigation }) => {
  return (
    <Screen navigation={navigation}>
      <View style={styles.statusBar} />
      <Root />
    </Screen>
  );
};

export default Screen;
