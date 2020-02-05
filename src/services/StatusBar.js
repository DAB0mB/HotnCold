import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';

import { useNavigation } from './Navigation';
import { useDropdownAlert } from './DropdownAlert';

const statusBarRef = React.createRef();

export const StatusBarProvider = ({ children, ...props }) => {
  const nav = useNavigation();
  const dropdownAlert = useDropdownAlert();
  const [, setInactiveStatusBar] = dropdownAlert.inactiveStatusBarState;

  useEffect(() => {
    statusBarRef.current = props;
    setInactiveStatusBar(props);

    const willFocusListener = nav.addListener('willFocus', () => {
      statusBarRef.current = props;
      setInactiveStatusBar(props);
    });

    return () => {
      willFocusListener.remove();
    };
  }, [true]);

  return (
    <React.Fragment>
      {!nav.getParam('$terminated') && (
        <StatusBar {...props} />
      )}
      {children}
    </React.Fragment>
  );
};

export const useStatusBarRef = () => {
  return statusBarRef;
};
