import React, { useCallback } from 'react';
import { StyleSheet, View, Text, TouchableWithoutFeedback } from 'react-native';
import SuperPopover from 'react-native-popover-view';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors, hexToRgba } from '../theme';

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    height: 50,
  },
  itemBorder: {
    borderTopWidth: 1,
    borderColor: hexToRgba(colors.gray, .4),
  },
  itemText: {
    fontSize: 17,
    color: colors.ink,
    textAlign: 'center',
  },
});

const PopOver = ({ items, state, ...props }) => {
  const [isVisible, setVisibility] = state;

  const hidePopOver = useCallback(() => {
    setVisibility(false);
  }, [true]);

  return (
    <SuperPopover
      {...props}
      debug={__DEV__}
      isVisible={isVisible}
      onRequestClose={hidePopOver}
    >
      <View style={{ width: 150, height: items.length * 50 }}>
        {items.map((item, index) => (
          <TouchableWithoutFeedback key={item.text} onPress={() => {
            hidePopOver(); item.onPress(); 
          }}>
            <View style={[styles.item, index && styles.itemBorder].filter(Boolean)}>
              <Text style={styles.itemText}>
                <McIcon name={item.icon} size={17} color={colors.ink} /> <Text> {item.text}</Text>
              </Text>
            </View>
          </TouchableWithoutFeedback>
        ))}
      </View>
    </SuperPopover>
  );
};

export default PopOver;
