import React, { createContext, useContext } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BleCentralContext = createContext(null);
const BleEmitterContext = createContext(null);
const BlePeripheralContext = createContext(null);

export const BLE_PERMISSIONS = {
  READ: 1,
  READ_ENCRYPT: 2,
  READ_ENCRYPT_MITM: 4,
  WRITE: 16,
  WRITE_ENCRYPT: 32,
  WRITE_ENCRUPT_MITM: 64,
  WRITE_SIGNED: 128,
  WRITE_SIGNED_MITM: 256,
};

export const BLE_PROPERTIES = {
  BROADCAST: 1,
  READ: 2,
  WRITE_NO_RES: 4,
  WRITE: 8,
  NOTIFY: 16,
  INDICATE: 32,
  SIGNED_WRITE: 64,
  EXTEND_PROPS: 128,
};

export const useBluetoothLE = ({ configurePeripheral } = {}) => {
  const peripheral = useContext(BlePeripheralContext);
  const central = useContext(BleCentralContext);
  const emitter = useContext(BleEmitterContext);

  return { peripheral, central, emitter, ready, loading };
};

export const BluetoothLEProvider = ({
  peripheralService = BleManager,
  centralService = BlePeripheral,
  eventEmitter = bleManagerEmitter,
  children,
}) => {
  return (
    <BleCentralContext.Provider value={peripheralService}>
      <BlePeripheralContext.Provider value={centralService}>
        <BleEmitterContext.Provider value={eventEmitter}>
          {children}
        </BleEmitterContext.Provider>
      </BlePeripheralContext.Provider>
    </BleCentralContext.Provider>
  );
};
