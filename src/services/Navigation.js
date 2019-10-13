import React, { createContext, useContext, useEffect } from 'react';
import { BackHandler } from 'react-native';

const NavigationContext = createContext(null);

export const NavigationProvider = ({ navigation, children }) => {
  return (
    <NavigationContext.Provider value={navigation}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = () => {
  return useContext(NavigationContext);
};

export const useBackListener = () => {
  const navigation = useNavigation();

  useEffect(() => {
    let focused = false;
    let goBack = false;

    const backHandler = () => {
      if (focused) {
        navigation.goBack();
      } else {
        goBack = true;
      }

      return true;
    };

    const listener = navigation.addListener('didFocus', (e) => {
      if (goBack) {
        navigation.goBack();
      } else {
        focused = true;
      }
    });

    BackHandler.addEventListener('hardwareBackPress', backHandler);

    return () => {
      listener.remove();
      BackHandler.removeEventListener('hardwareBackPress', backHandler);
    };
  }, [true]);
};
