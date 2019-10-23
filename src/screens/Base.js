import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';
import CONFIG from 'react-native-config';
import { getStatusBarHeight } from 'react-native-status-bar-height';

import Loader from '../components/Loader';
import { useLoading, LoadingProvider } from '../services/Loading';
import { useNavigation, NavigationProvider } from '../services/Navigation';

const styles = StyleSheet.create({
  container: {
    paddingTop: getStatusBarHeight(),
    flex: 1,
  },
  loadingBuffer: {
    backgroundColor: 'white',
    position: 'absolute',
    height: '100%',
    width: '100%',
    top: getStatusBarHeight(),
    left: 0,
  },
});

const Base = (Component) => {
  return ({ navigation }) => {
    const [isLoading, _setLoading] = useState(null);
    const loadingRef = useRef(null);

    let setLoading;
    {
      const fadeAnimRef = useRef(null);
      const immediateRef = useRef(null);

      useEffect(() => {
        if (isLoading) return;
        if (!fadeAnimRef.current) return;

        Animated.timing(
          fadeAnimRef.current,
          {
            toValue: 0,
            duration: 333,
          }
        ).start();
      }, [isLoading]);

      setLoading = useCallback((value) => {
        if (value) {
          fadeAnimRef.current = new Animated.Value(1);

          loadingRef.current = (
            <Animated.View style={[styles.loadingBuffer, { opacity: fadeAnimRef.current }]}>
              <Loader />
            </Animated.View>
          );
        }
        else {
          loadingRef.current = (
            <Animated.View pointerEvents='none' style={[styles.loadingBuffer, { opacity: fadeAnimRef.current }]}>
              <Loader />
            </Animated.View>
          );
        }

        if (!!value === !!isLoading) {
          clearImmediate(immediateRef.current);
          immediateRef.current = null;

          if (isLoading == null) {
            loadingRef.current = null;
          }
        }
        else {
          immediateRef.current = setImmediate(() => {
            _setLoading(value);
          });
        }
      }, [isLoading]);
    }

    return (
      <NavigationProvider navKey={Base} navigation={navigation}>
        <LoadingProvider loadingState={[isLoading, setLoading]}>
          <StatusBar translucent barStyle="dark-content" backgroundColor='white' />
          <SafeAreaView style={styles.container}>
            <Component />
            {loadingRef.current}
          </SafeAreaView>
        </LoadingProvider>
      </NavigationProvider>
    );
  };
};

export default Base;
