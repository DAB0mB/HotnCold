import React, {
  createContext,
  useLayoutEffect,
  useEffect,
  useContext,
  useState,
  useMemo,
} from 'react';
import { NavigationActions } from 'react-navigation';

const HeaderContext = createContext(null);

export const HeaderProvider = ({ HeaderComponent, defaultProps = {}, children }) => {
  const [headerProps, setHeaderProps] = useState({});

  const contextMemo = {
    headerProps,
    setHeaderProps,
  };
  const context = useMemo(() => contextMemo, Object.values(contextMemo));

  return (
    <HeaderContext.Provider value={context}>
      {children}
      <HeaderComponent {...defaultProps} {...headerProps} />
    </HeaderContext.Provider>
  );
};

export const useHeader = () => {
  return useContext(HeaderContext);
};

export const useNavInHeader = (nav) => {
  const { headerProps, setHeaderProps } = useHeader();

  useLayoutEffect(() => {
    const listener = nav.addListener('willBlur', ({ action }) => {
      if (action.type === NavigationActions.BACK) {
        setHeaderProps(headerProps);
      }
    });

    return () => {
      listener.remove();
    };
  }, [true]);

  useEffect(() => {
    setHeaderProps({ ...headerProps, nav });
  }, [true]);
};
