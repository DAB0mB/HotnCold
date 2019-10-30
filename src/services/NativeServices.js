import React, {
  useCallback,
  useEffect,
  useState,
  useMemo,
  useImperativeHandle,
  forwardRef,
} from 'react';
import { View } from 'react-native';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import GPSState from 'react-native-gps-state';

const noop = () => {};

export const SERVICES = {
  GPS:       0x01,
  BLUETOOTH: 0x10,
};

const NativeServices = forwardRef(({
  children,
  onReady = noop,
  onBluetoothActivated = noop,
  onBluetoothDeactivated = noop,
  onGpsActivated = noop,
  onGpsDeactivated = noop,
  onRequireService = noop,
  ServiceRequiredComponent,
  services,
}, ref) => {
  const [exceptionalServices, setExceptionalServices] = useState(0);
  const [prevServices, setPrevServices] = useState(0);
  const [bluetoothState, setBluetoothState] = useState(null);
  const [gpsState, setGpsState] = useState(null);
  const [requiredService, setRequiredService] = useState(null);

  useEffect(() => {
    if ((services & SERVICES.GPS) && !(exceptionalServices & SERVICES.GPS) && gpsState === false) {
      setRequiredService(SERVICES.GPS);
      onRequireService(SERVICES.GPS);

      return;
    }

    if ((services & SERVICES.BLUETOOTH) && !(exceptionalServices & SERVICES.BLUETOOTH) && bluetoothState === false) {
      setRequiredService(SERVICES.BLUETOOTH);
      onRequireService(SERVICES.BLUETOOTH);

      return;
    }

    if (requiredService != null) {
      setRequiredService(null);
      onRequireService(null);

      return;
    }
  }, [services, gpsState, bluetoothState]);

  useEffect(() => {
    let mounted = true;
    const gettingStates = [];

    if (!(prevServices & SERVICES.GPS) && (services & SERVICES.GPS)) {
      gettingStates.push(GPSState.getStatus());
    }
    else {
      gettingStates.push(null);
    }

    if (!(prevServices & SERVICES.BLUETOOTH) && (services & SERVICES.BLUETOOTH)) {
      gettingStates.push(BluetoothStateManager.getState());
    }
    else {
      gettingStates.push(null);
    }

    Promise.all(gettingStates).then(([gpsState, bluetoothState]) => {
      if (!mounted) return;
      if (gpsState != null) setGpsState(gpsState === GPSState.AUTHORIZED);
      if (bluetoothState != null) setBluetoothState(bluetoothState === 'PoweredOn');

      setPrevServices(services);
    });

    return () => {
      mounted = false;
    };
  }, [services]);

  const [recentGpsState, setRecentGpsState] = useState(gpsState);
  useEffect(() => {
    if (recentGpsState === gpsState) return;
    if (!(services & SERVICES.GPS)) return;

    if (gpsState) {
      onGpsActivated();
    }
    else {
      onGpsDeactivated();
    }

    setRecentGpsState(gpsState);
  }, [services, gpsState]);

  const [recentBluetoothState, setRecentBluetoothState] = useState(bluetoothState);
  useEffect(() => {
    if (recentBluetoothState === bluetoothState) return;
    if (!(services & SERVICES.BLUETOOTH)) return;

    if (bluetoothState) {
      onBluetoothActivated();
    }
    else {
      onBluetoothDeactivated();
    }

    setRecentBluetoothState(bluetoothState);
  }, [services, bluetoothState]);

  useEffect(() => {
    let gpsListener;
    if (services & SERVICES.GPS) {
      gpsListener = (state) => {
        if (state === GPSState.AUTHORIZED) {
          setGpsState(true);
        }
        else {
          setGpsState(false);
        }
      };

      GPSState.addListener(gpsListener);
    }

    let bluetoothListener;
    if (services & SERVICES.BLUETOOTH) {
      bluetoothListener = BluetoothStateManager.onStateChange((state) => {
        if (state === 'PoweredOn') {
          setBluetoothState(true);
        }
        else {
          setBluetoothState(false);
        }
      });
    }

    return () => {
      if (gpsListener) {
        GPSState.removeListener(gpsListener);
      }

      if (bluetoothListener) {
        bluetoothListener.remove();
      }
    };
  }, [services, setGpsState, setBluetoothState]);

  useEffect(() => {
    if ((services & SERVICES.GPS) && gpsState == null) return;
    if ((services & SERVICES.BLUETOOTH) && bluetoothState == null) return;

    onReady(true);
  }, [gpsState, bluetoothState]);

  const imperativeHandle = {
    exceptionalServices,
    setExceptionalServices,
  };
  useImperativeHandle(ref, () => imperativeHandle, Object.values(imperativeHandle));

  return (
    <>
      {children}
      {requiredService && ServiceRequiredComponent && <ServiceRequiredComponent service={requiredService} />}
    </>
  );
});

export default NativeServices;
