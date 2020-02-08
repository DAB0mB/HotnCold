import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, BackHandler } from 'react-native';

import { useAsyncEffect } from '../../utils';
import { useRobot, RobotProvider } from '../context';
import useScopes from './scopes';

const DONE_ROUTE = '__DONE__';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const _RobotRunner = ({ children }) => {
  const { run } = useRobot();
  const [route, setRoute] = useState('');

  useScopes();

  const running = useMemo(() => run({
    onPass({ route, date, payload }) {
      console.log([`[PASS] (${date.toISOString()}) ${route.join(' -> ')}`, payload?.message].filter(Boolean).join('\n'));
    },

    onFail({ route, date, payload }) {
      console.error([`[FAIL] (${date.toISOString()}) ${route.join(' -> ')}`, payload?.message].filter(Boolean).join('\n'));
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

const RobotRunner = (props) => {
  return (
    <RobotProvider>
      <_RobotRunner {...props} />
    </RobotProvider>
  );
};

export default RobotRunner;
