import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useMemo,
  useLayoutEffect,
  useRef,
} from 'react';
import { BackHandler } from 'react-native';
import CONFIG from 'react-native-config';
import { StackActions, NavigationActions } from 'react-navigation';

let focusedNav;
const NavigationContext = createContext(new Map());

export const NavigationProvider = ({ navKey, navigation, children }) => {
  const navMap = useContext(NavigationContext);

  useEffect(() => {
    let recentNav = focusedNav;
    let targetNav = navigation;
    const prevNavs = Array.from(navMap.values());

    while (targetNav?.isFirstRouteInParent()) {
      targetNav = prevNavs.pop();
    }

    // Probably root
    if (!targetNav) {
      focusedNav = navigation;

      return;
    }

    const didFocusListener = targetNav.addListener('didFocus', () => {
      focusedNav = navigation;
    });

    const willBlurListener = targetNav.addListener('willBlur', ({ action }) => {
      if (action.type === NavigationActions.BACK) {
        focusedNav = recentNav;
      }
    });

    return () => {
      didFocusListener.remove();
      willBlurListener.remove();
    };
  }, [true]);

  return (
    <NavigationContext.Provider value={new Map([...navMap.entries(), [navKey, navigation]])}>
      {children}
    </NavigationContext.Provider>
  );
};

export const getFocusedNav = () => focusedNav;

export const useNavigation = (navKey) => {
  const navMap = useContext(NavigationContext);
  const navQueue = useMemo(() => Array.from(navMap.values()), [true]);
  const parentNav = useMemo(() => navQueue[navQueue.length - 2], [true]);
  const nav = useMemo(() => navKey ? navMap.get(navKey) : navQueue[navQueue.length - 1], [navKey]);
  const focused = useRef(false);
  const shouldGoBack = useRef(false);
  const goBack = useRef(null);

  const utilizeFocus = useCallback(() => {
    focused.current = true;

    if (shouldGoBack.current) {
      goBack.current();
    }
  }, [true]);

  // Push and reset navigation stack
  nav.terminalPush = useCallback((routeName, params, history = []) => {
    nav.push(routeName, params);

    const didBlurListener = nav.addListener('didBlur', ({ action }) => {
      didBlurListener.remove();

      nav.dispatch(StackActions.reset({
        index: history.length,
        actions: [...history, NavigationActions.navigate({ routeName, params, key: action.toChildKey })],
      }));
    });
  }, [true]);

  nav.useBackListener = useCallback((_goBack = nav.goBack.bind(nav)) => {
    goBack.current = _goBack;

    const goBackOnceFocused = nav.goBackOnceFocused = useCallback(() => {
      if (CONFIG.USE_ROBOT) return true;

      if (focused.current) {
        _goBack();
      }
      else {
        shouldGoBack.current = true;
      }

      BackHandler.removeEventListener('hardwareBackPress', goBackOnceFocused);

      return true;
    }, [true]);

    // Timing is important. Register immediately
    useLayoutEffect(() => {
      BackHandler.addEventListener('hardwareBackPress', goBackOnceFocused);
      const didFocusListener = nav.addListener('didFocus', utilizeFocus);

      return () => {
        BackHandler.removeEventListener('hardwareBackPress', goBackOnceFocused);
        didFocusListener.remove();
      };
    }, [true]);
  }, [true]);

  if (parentNav && nav.isFirstRouteInParent()) {
    // If this is the first route, didFocus will not be triggered, unless we do it manually
    useLayoutEffect(() => {
      const didFocusListener = parentNav.addListener('didFocus', utilizeFocus);

      return () => {
        didFocusListener.remove();
      };
    }, [true]);
  }

  return nav;
};
