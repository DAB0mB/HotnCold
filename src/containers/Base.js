import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import { LoadingProvider } from '../services/Loading';
import { NavigationProvider } from '../services/Navigation';
import { StatusBarProvider } from '../services/StatusBar';

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    paddingTop: getStatusBarHeight(),
    flex: 1,
  },
});

const Base = ({ navigation }) => {
  const { default: BaseRouter } = require('../routers/Base');

  return (
    <BaseRouter navigation={navigation} />
  );
};

Base.create = (Component) => {
  return function BaseScreen({ navigation }) {
    return (
      <NavigationProvider navKey={Base} navigation={navigation}>
        <StatusBarProvider translucent barStyle='dark-content' backgroundColor='white'>
          <SafeAreaView style={styles.container}>
            <LoadingProvider>
              <Component navigation={navigation} />
            </LoadingProvider>
          </SafeAreaView>
        </StatusBarProvider>
      </NavigationProvider>
    );
  };
};

export default Base;
