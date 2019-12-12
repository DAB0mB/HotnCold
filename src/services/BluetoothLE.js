import React, { createContext, useContext, useMemo, useState, useEffect, useCallback } from 'react';
import { NativeEventEmitter, NativeModules } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';

import { fork, useAsyncCallback } from '../utils';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const BleCentralContext = createContext(null);
const BleEmitterContext = createContext(null);
const BleStateContext = createContext(null);
const BlePeripheralContext = createContext(null);
const BleModesContext = createContext(null);

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

export const BLE_MODES = {
  CENTRAL:    0b01,
  PERIPHERAL: 0b10,
};

export const BLE_STATES = {
  UNKNOWN:      'Unknown',
  RESETTING:    'Resetting',
  UNSUPPORTED:  'Unsupported',
  UNAUTHORIZED: 'Unauthorized',
  POWERED_OFF:  'PoweredOff',
  POWERED_ON:   'PoweredOn',
};

export const BluetoothLEProvider = ({
  peripheralService = BleManager,
  centralService = BlePeripheral,
  stateService = BluetoothStateManager,
  eventEmitter = bleManagerEmitter,
  children,
}) => {
  const activeModesState = useState(0);

  return (
    <BleCentralContext.Provider value={peripheralService}>
    <BlePeripheralContext.Provider value={centralService}>
    <BleStateContext.Provider value={stateService}>
    <BleEmitterContext.Provider value={eventEmitter}>
    <BleModesContext.Provider value={activeModesState}>
      {children}
    </BleModesContext.Provider>
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
  const [activeModes, setActiveModes] = useContext(BleModesContext);
  const [enableCallbacks] = useState([]);
  const [disableCallbacks] = useState([]);

  useEffect(() => {
    const bluetoothListener = state.onStateChange((state) => {
      if (state === BLE_STATES.POWERED_ON) {
        setActiveModes(BLE_MODES.CENTRAL);

        enableCallbacks.splice(0).forEach(cb => cb());
      }
      else {
        setActiveModes(0);

        disableCallbacks.splice(0).forEach(cb => cb());
      }
    });

    return () => {
      bluetoothListener.remove();
    };
  }, [true]);

  const enable = useCallback((...args) => {
    return new Promise((resolve, reject) => {
      state.getState().then((s) => {
        if (s === BLE_STATES.POWERED_ON) {
          resolve();
        }
        else {
          state.enable(...args).catch(reject);
          enableCallbacks.push(resolve)
        }
      });
    });
  }, [state]);

  const disable = useCallback((...args) => {
    return new Promise((resolve, reject) => {
      state.getState().then((s) => {
        if (s === BLE_STATES.POWERED_ON) {
          state.disable(...args).catch(reject);
          disableCallbacks.push(resolve)
        }
        else {
          resolve();
        }
      });
    });
  }, [state]);

  const peripheralStart = useAsyncCallback(function* (...args) {
    const result = yield peripheral.start(...args);

    setActiveModes(m => m | BLE_MODES.PERIPHERAL);

    return result;
  }, [peripheral]);

  const peripheralStop = useAsyncCallback(function* (...args) {
    const result = yield peripheral.stop(...args);

    setActiveModes(m => m ^ BLE_MODES.PERIPHERAL);

    return result;
  }, [peripheral]);

  const peripheralFork = useMemo(() => {
    return Object.assign(fork(peripheral), {
      start: peripheralStart,
      stop: peripheralStop,
    });
  }, [peripheral]);

  return useMemo(() => ({
    central,
    emitter,
    activeModes,
    enable,
    disable,
    peripheral: peripheralFork,
  }), [
    peripheral,
    central,
    emitter,
    state,
    activeModes,
  ]);
};
