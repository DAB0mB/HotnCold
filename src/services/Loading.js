import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';

import Loader from '../components/Loader';

const styles = StyleSheet.create({
  loadingBuffer: {
    backgroundColor: 'white',
    position: 'absolute',
    bottom: 0,
    right: 0,
    top: 0,
    left: 0,
  },
});

const LoadingContext = createContext(null);

export const LoadingProvider = ({ children }) => {
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
    <LoadingContext.Provider value={[isLoading, setLoading]}>
      {children}
      {loadingRef.current}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const [isLoading, _setLoading] = useContext(LoadingContext);
  const calledRef = useRef(false);

  const setLoading = useCallback((isLoading) => {
    if (calledRef.current) return;

    _setLoading(isLoading);
    calledRef.current = true;

    setImmediate(() => {
      // Immediately after the immediate queue. See screens/Base.js
      // TODO: Try to connect to React lifecycle
      setImmediate(() => {
        calledRef.current = false;
      });
    });
  }, [isLoading]);

  return setLoading;
};
