
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { View, StatusBar, Text, SafeAreaView, StyleSheet, Animated } from 'react-native';

import Loader from '../components/Loader';
import { useImmediate, useRenderer } from '../utils';

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

export const LoadingProvider = ({ children, initialLoading }) => {
  const [isLoading, _setLoading] = useState(null);
  const [setImmediate, clearImmediate] = useImmediate();
  const [key, render] = useRenderer();
  const loadingRef = useRef(null);
  const fadeAnimRef = useRef(null);

  useEffect(() => {
    if (isLoading) return;
    if (!fadeAnimRef.current) return;

    const loadingEl = loadingRef.current;

    Animated.timing(
      fadeAnimRef.current,
      {
        toValue: 0,
        duration: 333,
      }
    ).start(() => {
      if (loadingEl !== loadingRef.current) {
        // Dispose
        loadingRef.current = null;
      }

      render();
    });
  }, [isLoading]);

  const setLoading = useCallback((value) => {
    if (value) {
      fadeAnimRef.current = new Animated.Value(1);

      loadingRef.current = (
        <Animated.View key={key} style={[styles.loadingBuffer, { opacity: fadeAnimRef.current }]}>
          <Loader />
        </Animated.View>
      );
    }
    else {
      loadingRef.current = (
        <Animated.View key={key} pointerEvents='none' style={[styles.loadingBuffer, { opacity: fadeAnimRef.current }]}>
          <Loader />
        </Animated.View>
      );
    }

    if (!!value === !!isLoading) {
      clearImmediate();

      if (isLoading == null) {
        loadingRef.current = null;
      }
    }
    else {
      setImmediate(() => {
        // TODO: Fix immediate runs after component unmounts.
        // If you see a memory leak error - ignore it for now. There's no leak.
        _setLoading(value);
      });
    }
  }, [isLoading]);

  useEffect(() => {
    if (initialLoading) {
      setLoading(!!initialLoading);
    }
  }, [initialLoading]);

  return (
    <LoadingContext.Provider value={[isLoading, setLoading]}>
      {children}
      {loadingRef.current}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => {
  const [isLoading, _setLoading] = useContext(LoadingContext);
  const [setImmediate] = useImmediate();
  const calledRef = useRef(false);

  const setLoading = useCallback((isLoading) => {
    if (calledRef.current) return;

    _setLoading(isLoading);
    calledRef.current = true;

    setImmediate(() => {
      setImmediate(() => {
        calledRef.current = false;
      });
    });
  }, [isLoading]);

  return setLoading;
};