import React from 'react';
import { StyleSheet, View } from 'react-native';

import Router from './Router';
import { DropdownAlertProvider } from './services/DropdownAlert';
import { useHeaderState, HeaderProvider } from './services/Header';


const styles = StyleSheet.create({
  container: {
    flex: 1
  },
});

let modulesInitialized;
Promise.all([
  BleManager.start(),
  Mapbox.setAccessToken(),
]).then(() => {
  modulesInitialized = true;
});

const App = () => {
  const [header] = useHeaderState();
  const [resettingBluetooth, setResettingBluetoothPromise] = useState(null);
  const nativeServices = useNativeServices();
  const watcherIgnored = !!resettingBluetooth;

  const onBluetoothActivated = useCallback(() => {
    let resettingBluetooth = Promise.resolve();
    if (nativeServices.active & SERVICES.BLUETOOTH) {
      resettingBluetooth = BluetoothStateManager.disabled().then(() => {
        return BluetoothStateManager.enable();
      });
    }
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
        services={nativeServices.required}
        onBluetoothActivated={onServiceActivated}
        onServiceDeactivated={onServiceDeactivated}
        ignored={watcherIgnored}
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
