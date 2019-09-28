import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { BleManager } from 'react-native-ble-plx';

import AuthorizedView from '../../components/AuthorizedView';
import { useBleManager } from '../../services/BleManager';
import Screen from '../Screen';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
});

const Radar = () => {
  const bleManager = useBleManager();
  const [bleReady, setBleReady] = useState(false);
  const [bleError, setBleError] = useState(null);

  useEffect(() => {
    const subscription = bleManager.onStateChange((state) => {
      if (state === 'PoweredOn') {
        setBleReady(true);
        subscription.remove();
      }
    }, true);
  }, [true]);

  useEffect(() => {
    if (!bleReady) return;

    bleManager.startDeviceScan(null, { scanMode: 'LowLatency' }, (err, device) => {
      if (err) {
        setBleError(err);

        return;
      }

      // TODO: Handle
    });
  }, [bleReady]);

  return (
    <AuthorizedView style={styles.container} functions={['bluetooth']} />
  );
};

export default Screen.create(Radar);
