import React, {
  createContext,
  useEffect,
  useLayoutEffect,
  useContext,
  useState,
  useMemo,
} from 'react';
import { NavigationActions } from 'react-navigation';

import { useNavigation } from './Navigation';

const FrameContext = createContext(null);
const empty = {};

export const FrameProvider = ({ FrameComponent, children, ...defaultProps }) => {
  const [frameProps, setFrameProps] = useState({});

  const contextMemo = {
    frameProps,
    setFrameProps,
  };
  const context = useMemo(() => contextMemo, Object.values(contextMemo));

  return (
    <FrameContext.Provider value={context}>
      <FrameComponent {...defaultProps} {...frameProps}>
        {children}
      </FrameComponent>
    </FrameContext.Provider>
  );
};

export const useFrame = () => {
  return useContext(FrameContext);
};

export const useScreenFrame = (screenProps = empty) => {
  const nav = useNavigation();
  const { frameProps, setFrameProps } = useFrame();

  useEffect(() => {
    const listener = nav.addListener('willBlur', ({ action }) => {
      if (
        action.type === NavigationActions.BACK ||
        action.type === 'Navigation/POP' // Missing enum??
      ) {
        setFrameProps(frameProps);
      }
    });

    return () => {
      listener.remove();
    };
  }, [true]);

  useLayoutEffect(() => {
    setFrameProps({ ...frameProps, ...screenProps, nav });
  }, [nav, ...Object.values(screenProps)]);
};
