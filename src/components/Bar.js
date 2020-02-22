import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '../theme';

const styles = StyleSheet.create({
  container: {
    paddingLeft: 20,
    paddingRight: 20,
    height: 50,
    borderWidth: 1,
    borderTopColor: colors.lightGray,
    borderBottomColor: colors.lightGray,
    borderLeftColor: 'white',
    borderRightColor: 'white',
    backgroundColor: 'white',
  },
  content: {
    flex: 1,
    alignSelf: 'stretch',
    position: 'relative',
    alignItems: 'center',
    flexDirection: 'row',
  },
});

const Bar = (props) => {
  return (
    <View {...props} style={[styles.container, props.style].filter(Boolean)}>
      <View style={styles.content}>{props.children}</View>
    </View>
  );
};

export default Bar;