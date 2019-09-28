import React, { createContext, useContext, useEffect, useMemo } from 'react';
import { BleManager } from 'react-native-ble-plx';

const BleManagerContext = createContext(null);
const instancesMap = new Map();

export const BleManagerProvider = ({ service = BleManager, children }) => {
  return (
    <BleManagerContext.Provider value={service}>
      {children}
    </BleManagerContext.Provider>
  );
};

// Will create and re-use the same instance everywhere. Quote:
// "Only one instance of BleManager is allowed". Ref:
// polidea.github.io/react-native-ble-plx
export const useBleManager = () => {
  const BleManager = useContext(BleManagerContext);

  const bleManager = useMemo(() => {
    let { instanceNum = 0, bleManager } = instancesMap.get(BleManager) || {};

    if (!instanceNum++) {
      bleManager = new BleManager();
    }

    instancesMap.set({
      instanceNum,
      bleManager,
    });

    return bleManager;
  }, [true]);

  useEffect(() => () => {
    let { instanceNum, bleManager } = instancesMap.get(BleManager);

    if (!--instanceNum && typeof bleManager.destroy == 'function') {
      bleManager.destroy();
      instancesMap.delete(BleManager);
    }

    instanceMap.set({
      instanceNum,
      bleManager,
    });
  }, [true]);

  return bleManager;
};

