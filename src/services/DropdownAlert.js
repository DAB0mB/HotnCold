import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';
import DropdownAlert from 'react-native-dropdownalert';

const DropdownAlertContext = createContext(null);

const styles = StyleSheet.create({
  wrapper: {
    padding: 0,
  },
});

export const DropdownAlertProvider = ({ dropdownAlert, children }) => {
  const dropdownAlertRef = useRef(dropdownAlert);

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
      {!dropdownAlert && <DropdownAlert ref={dropdownAlertRef} translucent />}
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
