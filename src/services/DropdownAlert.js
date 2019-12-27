import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import DropdownAlert from 'react-native-dropdownalert';

import { useStatusBar } from './StatusBar';

const $inactiveStatusBarState = Symbol('inactiveStatusBarState');
const DropdownAlertContext = createContext(null);

export const DropdownAlertProvider = ({ children }) => {
  const dropdownAlertRef = useRef(null);
  const inactiveStatusBarState = useState({});
  const [inactiveStatusBar] = inactiveStatusBarState;

  const dropdownAlertContext = useMemo(() => ({
    [$inactiveStatusBarState]: inactiveStatusBarState,

    alertWithType(...args) {
      if (dropdownAlertRef.current) {
        dropdownAlertRef.current.alertWithType(...args);
      }
    }
  }), [dropdownAlertRef]);

  return (
    <DropdownAlertContext.Provider value={dropdownAlertContext}>
      {children}
      <DropdownAlert
        ref={dropdownAlertRef}
        inactiveStatusBarStyle={inactiveStatusBar.style}
        inactiveStatusBarBackgroundColor={inactiveStatusBar.backgroundColor}
        translucent
      />
    </DropdownAlertContext.Provider>
  );
};

export const useDropdownAlert = () => {
  const dropdownAlert = useContext(DropdownAlertContext);
  const statusBar = useStatusBar();

  useEffect(() => {
    const [inactiveStatusBar, setInactiveStatusBar] = dropdownAlert[$inactiveStatusBarState];

    setInactiveStatusBar({ ...inactiveStatusBar, ...statusBar });

    return () => {
      setInactiveStatusBar(inactiveStatusBar);
    };
  }, [dropdownAlert, statusBar]);

  return dropdownAlert;
};

export const useAlertError = () => {
  const dropdownAlert = useDropdownAlert();

  return useCallback((error) => {
    dropdownAlert.alertWithType('error', 'Error', error.message || error);
  }, [dropdownAlert]);
};

export const useAlertSuccess = () => {
  const dropdownAlert = useDropdownAlert();

  return useCallback((message) => {
    dropdownAlert.alertWithType('success', 'Success', message);
  }, [dropdownAlert]);
};
