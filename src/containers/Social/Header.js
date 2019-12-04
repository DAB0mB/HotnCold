import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    paddingLeft: 20,
    paddingRight: 20,
    backgroundColor: 'red',
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  }
});

const Header = () => {
  return (
    <View style={styles.container}>
      <Text>Chat</Text>
    </View>
  );
};

export default Header;
