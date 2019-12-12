import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

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
  }
});

const Header = ({ socialNav, Contents = () => null }) => {
  return (
    <NavigationProvider navKey={Social} navigation={socialNav}>
      <View style={styles.container}>
        {Contents}
      </View>
    </NavigationProvider>
  );
};

export default Header;
