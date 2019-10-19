import React from 'react';
import { StyleSheet, View } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import CONFIG from 'react-native-config';

import NativeServicesWatcher from './components/NativeServicesWatcher';
import Router from './Router';
import { DropdownAlertProvider } from './services/DropdownAlert';
import { useHeaderState, HeaderProvider } from './services/Header';
import { useNativeServices, NativeServicesProvider, SERVICES } from './services/NativeServices';

let modulesInitialized;
Promise.all([
  BleManager.start(),
  MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN),
]).then(() => {
  modulesInitialized = true;
});

const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});

const App = () => {
  const [header] = useHeaderState();
  const [resettingBluetooth, setResettingBluetoothPromise] = useState(null);
  const [nativeServices] = useNativeServices();
  const watcherIgnored = !!resettingBluetooth;

  const onBluetoothActivated = useCallback(() => {
    const resettingBluetooth = BluetoothStateManager.disabled().then(() => {
      return BluetoothStateManager.enable();
    });

    setResettingBluetoothPromise(resettingBluetooth);
  }, [resettingBluetooth]);

  useEffect(() => {
    if (!resettingBluetooth) return;

    resettingBluetooth.then(() => {
      BlePeripheral.setName(CONFIG.BLUETOOTH_ADAPTER_NAME);
      BlePeripheral.addService(me.id, true);

      return BlePeripheral.start();
    }).then(() => {
      setResettingBluetoothPromise(null);
    }).catch(() => {
      setResettingBluetoothPromise(null);
    });
  }, [resettingBluetooth]);

  if (!modulesInitialized) {
    return null;
  }

  return (
    <View style={styles.container}>
      <NativeServicesWatcher
        services={resettingBluetooth ? nativeServices ^ SERVICES.BLUETOOTH : nativeServices}
        onBluetoothActivated={onBluetoothActivated}
        onBluetoothDeactivated={onBluetoothDeactivated}
      >
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
