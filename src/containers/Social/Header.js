import React, { forwardRef, useState, useImperativeHandle } from 'react';
import { StyleSheet } from 'react-native';

import Bar from '../../components/Bar';

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    position: 'absolute',
  }
});

const Header = forwardRef((props, ref) => {
  const [children, setChildren] = useState(null);

  useImperativeHandle(ref, () => ({
    show(children) {
      setChildren(children);
    },
  }));

  return (
    <Bar.Ink style={styles.container}>
      {children}
    </Bar.Ink>
  );
});

Header.displayName = 'SocialHeader';

export default Header;
