import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';
import CONFIG from 'react-native-config';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import { LoadingProvider } from '../services/Loading';
import { NavigationProvider } from '../services/Navigation';

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
  return ({ navigation }) => {
    return (
      <NavigationProvider navKey={Base} navigation={navigation}>
        <StatusBar translucent barStyle='dark-content' backgroundColor='white' />
        <SafeAreaView style={styles.container}>
          <LoadingProvider>
            <Component navigation={navigation} />
          </LoadingProvider>
        </SafeAreaView>
      </NavigationProvider>
    );
  };
};

export default Base;
