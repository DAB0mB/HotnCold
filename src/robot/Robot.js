import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';

import { useAsyncEffect } from '../utils';
import { run } from './runner';
import useScopes from './scopes';

const DONE_ROUTE = '__DONE__';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const Robot = ({ children }) => {
  const [route, setRoute] = useState('');

  useScopes();

  const running = useMemo(() => run({
    onPass({ route, date, payload }) {
      console.log([`[PASS] (${date.toISOString()}) ${route.join(' -> ')}`, payload?.message].filter(Boolean).join(' • '));
    },

    onFail({ route, date, payload }) {
      console.error([`[FAIL] (${date.toISOString()}) ${route.join(' -> ')}`, payload?.message].filter(Boolean).join(' • '));
    },
  }), [true]);

  useEffect(() => {
    // Prevent Robo from moving back
    const backListener = () => true;

    BackHandler.addEventListener('hardwareBackPress', backListener);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', backListener);
    };
  }, [true]);

  useAsyncEffect(function* () {
    if (route === DONE_ROUTE) return;

    const { value, done } = yield running.next();

    setRoute(done ? DONE_ROUTE : value);
  }, [route]);

  if (!route) {
    return null;
  }

  return (
    <View style={styles.container} key={route} pointerEvents='none'>
      {children}
    </View>
  );
};

export default Robot;
