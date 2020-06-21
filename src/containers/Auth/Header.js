import React from 'react';
import { View, StyleSheet, Image } from 'react-native';

export const HEIGHT = 130;

const styles = StyleSheet.create({
  container: { top: 0, left: 0, right: 0, height: HEIGHT, alignItems: 'center', justifyContent: 'center', position: 'absolute' },
  logo: { height: 42, resizeMode: 'contain' },
});

const Header = () => {
  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo_any.png')} style={styles.logo} />
    </View>
  );
};

export default Header;
