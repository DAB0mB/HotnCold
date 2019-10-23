import React, { createContext, useContext, useMemo } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BleCentralContext = createContext(null);
const BleEmitterContext = createContext(null);
const BleStateContext = createContext(null);
const BlePeripheralContext = createContext(null);

export const BLE_PERMISSIONS = {
  READ:               0b000000001,
  READ_ENCRYPT:       0b000000010,
  READ_ENCRYPT_MITM:  0b000000100,
  WRITE:              0b000010000,
  WRITE_ENCRYPT:      0b000100000,
  WRITE_ENCRUPT_MITM: 0b001000000,
  WRITE_SIGNED:       0b010000000,
  WRITE_SIGNED_MITM:  0b100000000,
};

export const BLE_PROPERTIES = {
  BROADCAST:    0b00000001,
  READ:         0b00000010,
  WRITE_NO_RES: 0b00000100,
  WRITE:        0b00001000,
  NOTIFY:       0b00010000,
  INDICATE:     0b00100000,
  SIGNED_WRITE: 0b01000000,
  EXTEND_PROPS: 0b10000000,
};

export const BluetoothLEProvider = ({
  peripheralService = BleManager,
  centralService = BlePeripheral,
  stateService = BluetoothStateManager,
  eventEmitter = bleManagerEmitter,
  children,
}) => {
  return (
    <BleCentralContext.Provider value={peripheralService}>
    <BlePeripheralContext.Provider value={centralService}>
    <BleStateContext.Provider value={stateService}>
    <BleEmitterContext.Provider value={eventEmitter}>
      {children}
    </BleEmitterContext.Provider>
    </BleStateContext.Provider>
    </BlePeripheralContext.Provider>
    </BleCentralContext.Provider>
  );
};

export const useBluetoothLE = () => {
  const peripheral = useContext(BlePeripheralContext);
  const central = useContext(BleCentralContext);
  const state = useContext(BleStateContext);
  const emitter = useContext(BleEmitterContext);

  return useMemo(() => ({
    peripheral,
    central,
    emitter,
    enable(...args) {
      return state.enable(...args);
    },
    disable(...args) {
      return state.disable(...args);
    },
  }), [
    peripheral,
    central,
    emitter,
    state,
  ]);
};
