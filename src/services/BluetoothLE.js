import React, { createContext, useContext, useEffect, useState } from 'react';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';

import { Once } from '../utils';

const once = Once.create();
const BleCentralContext = createContext(null);
const BlePeripheralContext = createContext(null);

const inits = {
  centrals: new Set(),
  peripherals: new Set(),
};

const instances = {
  centrals: new Map(),
  peripherals: new Map(),
};

export const PERMISSIONS = {
  READ: 1,
  READ_ENCRYPT: 2,
  READ_ENCRYPT_MITM: 4,
  WRITE: 16,
  WRITE_ENCRYPT: 32,
  WRITE_ENCRUPT_MITM: 64,
  WRITE_SIGNED: 128,
  WRITE_SIGNED_MITM: 256,
};

export const PROPERTIES = {
  BROADCAST: 1,
  READ: 2,
  WRITE_NO_RES: 4,
  WRITE: 8,
  NOTIFY: 16,
  INDICATE: 32,
  SIGNED_WRITE: 64,
  EXTEND_PROPS: 128,
};

export const useBluetoothLE = ({ configurePeripheral }) => {
  const peripheral = useContext(BlePeripheralContext);
  const central = useContext(BleCentralContext);
  const [ready, setReady] = useState(0);
  const [error, setError] = useState(null);
  const loading = ready < 2;

  useEffect(() => {
    if (inits.centrals.has(central)) {
      setReady(r => ++r);

      return;
    }

    // Init module internals
    central.start({ showAlert: true }).then(() => {
      inits.centrals.add(central);
      setReady(r => ++r);
    });
  }, [true]);

  useEffect(() => {
    if (typeof configurePeripheral == 'function') {
      once.try(configurePeripheral, [peripheral]);
    }

    const instanceNum = instances.peripherals.get(peripheral) || 0;

    // Advertise!
    peripheral.start()
      .then(() => {
        setReady(r => ++r);
        instances.peripherals.set(peripheral, instanceNum + 1);
      })
      .catch((e) => setError(e));

    return () => {
      // Root component in tree
      if (!instanceNum) {
        instances.peripherals.set(peripheral, instanceNum);
        peripheral.stop();
      }
    };
  }, [true]);

  return { peripheral, central, ready, loading };
};

export const BluetoothLEProvider = ({ peripheralService = BleManager, centralService = BlePeripheral, children }) => {
  return (
    <BleCentralContext.Provider value={peripheralService}>
      <BlePeripheralContext.Provider value={centralService}>
        {children}
      </BlePeripheralContext.Provider>
    </BleCentralContext.Provider>
  );
};
