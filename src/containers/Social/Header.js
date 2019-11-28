import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    height: 50,
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
