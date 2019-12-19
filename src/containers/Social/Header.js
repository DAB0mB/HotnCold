import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '../../theme';

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'stretch',
    backgroundColor: colors.ink
  }
});

const Header = ({ children }) => {
  return (
    <View style={styles.container}>
      {children}
    </View>
  );
};

export default Header;
