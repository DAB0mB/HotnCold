import React from 'react';
import { View, StyleSheet } from 'react-native';

import { colors } from '../theme';

export const BAR_HEIGHT = 50;

const styles = StyleSheet.create({
  container: { paddingLeft: 20, paddingRight: 20, height: BAR_HEIGHT },
  content: { flex: 1, alignSelf: 'stretch', alignItems: 'center', position: 'relative', flexDirection: 'row' },
});

const defaultStyles = StyleSheet.create({
  container: { borderWidth: 1, borderTopColor: colors.lightGray, borderBottomColor: colors.lightGray, borderLeftColor: 'white', borderRightColor: 'white', backgroundColor: 'white' },
  content: { alignItems: 'center' },
});

const inkStyles = StyleSheet.create({
  container: {
    backgroundColor: colors.ink,
  },
});

const Bar = (props) => {
  return (
    <View {...props} style={[styles.container, defaultStyles.container, props.style].filter(Boolean)}>
      <View style={[styles.content, defaultStyles.content]}>{props.children}</View>
    </View>
  );
};

const InkBar = (props) => {
  return (
    <View {...props} style={[styles.container, inkStyles.container, props.style].filter(Boolean)}>
      <View style={[styles.content, inkStyles.content]}>{props.children}</View>
    </View>
  );
};

Bar.Ink = InkBar;

export default Bar;
