import React from 'react';
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

const Header = ({ children }) => {
  return (
    <Bar.Ink style={styles.container}>
      {children}
    </Bar.Ink>
  );
};

export default Header;
