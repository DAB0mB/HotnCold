import React, { createContext, useContext, useCallback, useEffect, useMemo } from 'react';
import { BackHandler } from 'react-native';

const NavigationContext = createContext(new Map());

export const NavigationProvider = ({ key, navigation, children }) => {
  const navMap = useContext(NavigationContext);

  return (
    <NavigationContext.Provider value={new Map([...navMap.entries(), [key, navigation]])}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (key) => {
  const navMap = useContext(NavigationContext);
  const navigation = useMemo(() => key ? navMap[key] : Array.from(navMap.values()).pop(), [key]);

  navigation.useBackListener = useCallback(() => {
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
  }, [true]);

  return navigation;
};
