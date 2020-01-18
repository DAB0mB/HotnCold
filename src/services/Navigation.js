import React, {
  createContext,
  useContext,
  useCallback,
  useMemo,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { BackHandler } from 'react-native';
import { StackActions, NavigationActions } from 'react-navigation';

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
  const shouldGoBack = useRef(false);
  const goBack = useRef(null);

  const utilizeFocus = useCallback(() => {
    focused.current = true;

    if (shouldGoBack.current) {
      goBack.current();
    }
  }, [true]);

  const [dynamicParams] = useState({});

  nav.useParam = useCallback((paramName) => {
    const state = dynamicParams[paramName] = useState(nav.getParam(paramName));

    return state[0];
  }, [nav]);

  nav.setParam = useCallback((paramName, paramValue) => {
    const state = dynamicParams[paramName];

    if (!state) {
      throw Error(`Nav param state "${paramName}" doesn't exist`);
    }

    nav.setParams({
      [paramName]: paramValue
    });

    return state[1](paramValue);
  }, [nav]);

  // Push and reset navigation stack
  nav.terminalPush = useCallback((routeName, params) => {
    nav.push(routeName, params);

    const didBlurListener = nav.addListener('didBlur', ({ action }) => {
      didBlurListener.remove();

      nav.dispatch(StackActions.reset({
        index: 0,
        actions: [NavigationActions.navigate({ routeName, params, key: action.toChildKey })]
      }));
    });
  }, [true]);

  nav.useBackListener = useCallback((_goBack = nav.goBack.bind(nav)) => {
    goBack.current = _goBack;

    const goBackOnceFocused = nav.goBackOnceFocused = useCallback(() => {
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
