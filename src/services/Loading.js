
import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { StyleSheet, Animated } from 'react-native';

import Loader from '../components/Loader';
import { useRootLayoutEffect } from '../utils';

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

export const LoadingProvider = ({ loadingStyle = {}, children }) => {
  const [isLoading, _setLoading] = useState(false);
  const [loadingView, setLoadingView] = useState(null);
  const [fadeAnim, setFadeAnim] = useState(null);
  const indexRef = useRef(0);

  useEffect(() => {
    if (isLoading) return;
    if (!fadeAnim) return;

    const index = indexRef.current;

    Animated.timing(
      fadeAnim,
      {
        toValue: 0,
        duration: 333,
      }
    ).start(() => {
      if (index == indexRef.current) {
        setLoadingView(null);
      }
    });
  }, [isLoading]);

  const setLoading = useCallback((isLoading) => {
    if (isLoading) {
      const fadeAnim = new Animated.Value(1);
      setFadeAnim(fadeAnim);
      setLoadingView(
        <Animated.View style={[styles.loadingBuffer, loadingStyle, { opacity: fadeAnim }]}>
          <Loader />
        </Animated.View>
      );
    }
    else {
      setLoadingView(
        <Animated.View pointerEvents='none' style={[styles.loadingBuffer, loadingStyle, { opacity: fadeAnim }]}>
          <Loader />
        </Animated.View>
      );
    }

    indexRef.current++;
    _setLoading(isLoading);
  }, [isLoading]);

  return (
    <LoadingContext.Provider value={[isLoading, setLoading]}>
      {children}
      {loadingView}
    </LoadingContext.Provider>
  );
};

export const useLoading = (loadingParam, children = null) => {
  const [isLoading, setLoading] = useContext(LoadingContext);
  loadingParam = !!loadingParam;

  useRootLayoutEffect(() => {
    if (loadingParam !== isLoading) {
      setLoading(loadingParam);
    }
  });

  return children;
};
