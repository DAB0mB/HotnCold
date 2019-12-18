import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '../../theme';
import { NavigationProvider } from '../../services/Navigation';

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

const Header = ({ socialNav, navKey, Contents = () => null }) => {
  return (
    <NavigationProvider navKey={navKey} navigation={socialNav}>
      <View style={styles.container}>
        <Contents />
      </View>
    </NavigationProvider>
  );
};

export default Header;
