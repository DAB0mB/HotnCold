import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import DropdownAlert from 'react-native-dropdownalert';

const DropdownAlertContext = createContext(null);

export const DropdownAlertProvider = ({ children }) => {
  const dropdownAlertRef = useRef(null);

  const dropDownAlertContext = useMemo(() => ({
    alertWithType(...args) {
      if (dropdownAlertRef.current) {
        dropdownAlertRef.current.alertWithType(...args);
      }
    }
  }), [dropdownAlertRef]);

  return (
    <DropdownAlertContext.Provider value={dropDownAlertContext}>
      {children}
      <DropdownAlert ref={dropdownAlertRef} inactiveStatusBarStyle='dark-content' translucent />
    </DropdownAlertContext.Provider>
  );
};

export const useDropdownAlert = () => {
  return useContext(DropdownAlertContext);
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
