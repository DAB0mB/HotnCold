import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

import { colors } from '../../theme';

export const HEIGHT = 130;

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    backgroundColor: colors.ink,
  },
  logo: {
    height: 30,
    resizeMode: 'contain',
  },
});

const Header = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo_dark.png')} style={styles.logo} />
    </View>
  );
};

export default Header;
