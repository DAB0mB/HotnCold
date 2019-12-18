import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react';
import { BackHandler } from 'react-native';

const NavigationContext = createContext(new Map());

export const NavigationProvider = ({ navKey, navigation, children }) => {
  const navMap = useContext(NavigationContext);

  return (
    <NavigationContext.Provider value={new Map([...navMap.entries(), [navKey, navigation]])}>
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (navKey) => {
  const navMap = useContext(NavigationContext);
  const navQueue = useMemo(() => Array.from(navMap.values()), [true]);
  const parentNav = useMemo(() => navQueue[navQueue.length - 2], [true]);
  const nav = useMemo(() => navKey ? navMap.get(navKey) : navQueue[navQueue.length - 1], [navKey]);
  const focused = useRef(false);
  const goBack = useRef(null);

  const utilizeFocus = useCallback(() => {
    if (typeof goBack.current == 'function') {
      goBack.current();
    }
    else {
      focused.current = true;
    }

    return true;
  }, [true]);

  nav.useBackListener = useCallback((_goBack = nav.goBack.bind(nav)) => {
    const goBackOnceFocused = nav.goBackOnceFocused = useCallback(() => {
      if (focused.current) {
        _goBack();
      }
      else {
        goBack.current = _goBack;
      }

      return true;
    }, [true]);

    // Timing is important. Register immediately
    useMemo(() => {
      const listener = nav.addListener('didFocus', utilizeFocus);
      BackHandler.addEventListener('hardwareBackPress', goBackOnceFocused);

      return () => {
        listener.remove();
        BackHandler.removeEventListener('hardwareBackPress', goBackOnceFocused);
      };
    }, [true]);
  }, [true]);

  if (parentNav && nav.isFirstRouteInParent()) {
    // If this is the first route, didFocus will not be triggered, unless we do it manually
    useLayoutEffect(() => {
      const listener = parentNav.addListener('didFocus', utilizeFocus);

      return () => {
        listener.remove();
      };
    }, [true]);
  }

  return nav;
};
