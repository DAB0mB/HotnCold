import MapboxGL from '@react-native-mapbox-gl/maps';
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import CONFIG from 'react-native-config';

import Router from './Router';
import { DropdownAlertProvider } from './services/DropdownAlert';
import { useHeaderState, HeaderProvider } from './services/Header';
import NativeServicesWatcher from './components/NativeServicesWatcher';
import { useNativeServices, NativeServicesProvider } from './services/NativeServices';

const initializingModules = Promise.all([
  BleManager.start(),
  MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN),
]);

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});

const App = () => {
  const [header] = useHeaderState();
  const [nativeServices] = useNativeServices();
  const [modulesInitialized, setModulesInitialized] = useState(false);

  useEffect(() => {
    initializingModules.then(() => {
      setModulesInitialized(true);
    });
  }, [true]);

  if (!modulesInitialized) {
    return null;
  }

  return (
    <View style={styles.container}>
      <NativeServicesWatcher {...nativeServices}>
        <Router />
      </NativeServicesWatcher>
      {header}
    </View>
  );
};

export default () => {
  return (
    <HeaderProvider>
    <DropdownAlertProvider>
    <NativeServicesProvider>
      <App />
    </NativeServicesProvider>
    </DropdownAlertProvider>
    </HeaderProvider>
  );
};
