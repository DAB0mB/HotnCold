import React, {
  createContext,
  useCallback,
  useContext,
  useImperativeHandle,
  useState,
  useMemo,
  useRef,
} from 'react';
import DropdownAlert from 'react-native-dropdownalert';

const DropdownAlertContext = createContext(null);

export const DropdownAlertProvider = React.forwardRef(({ children }, ref) => {
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

  useImperativeHandle(ref, () => dropdownAlertContext);

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
});

export const useDropdownAlert = () => {
  return useContext(DropdownAlertContext);
};

export const useAlertError = () => {
  const dropdownAlert = useDropdownAlert();

  return useCallback((error) => {
    const message = (error.message || error)?.match(/^(\w*Error:?)?(.+)/)?.[2].split();

    dropdownAlert.alertWithType('error', 'Error', message);
  }, [dropdownAlert]);
};

export const useAlertSuccess = () => {
  const dropdownAlert = useDropdownAlert();

  return useCallback((message) => {
    dropdownAlert.alertWithType('success', 'Success', message);
  }, [dropdownAlert]);
};
