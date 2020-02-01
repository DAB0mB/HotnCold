import React, {
  createContext,
  useCallback,
  useContext,
  useState,
  useMemo,
  useRef,
} from 'react';
import DropdownAlert from 'react-native-dropdownalert';

const DropdownAlertContext = createContext(null);

export const DropdownAlertProvider = ({ children }) => {
  const dropdownAlertRef = useRef(null);
  const inactiveStatusBarState = useState({});
  const [inactiveStatusBar] = inactiveStatusBarState;

  const dropdownAlertContext = useMemo(() => ({
    inactiveStatusBarState,
    alertWithType(type, title, message) {
      if (dropdownAlertRef.current) {
        dropdownAlertRef.current.alertWithType(type, title, message);
      }
    }
  }), [true]);

  return (
    <DropdownAlertContext.Provider value={dropdownAlertContext}>
      {children}
      <DropdownAlert
        ref={dropdownAlertRef}
        inactiveStatusBarStyle={inactiveStatusBar.barStyle}
        inactiveStatusBarBackgroundColor={inactiveStatusBar.backgroundColor}
        translucent
      />
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
