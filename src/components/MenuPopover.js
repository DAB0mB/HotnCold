import React, { useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import Ripple from 'react-native-material-ripple';
import Popover from 'react-native-popover-view';
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

const MenuPopover = ({ items, state, ...props }) => {
  const [isVisible, setVisibility] = state;

  const hidePopover = useCallback(() => {
    setVisibility(false);
  }, [true]);

  return (
    <Popover
      {...props}
      debug={__DEV__}
      isVisible={isVisible}
      onRequestClose={hidePopover}
    >
      <View style={{ width: 150, height: items.length * 50, borderColor: colors.lightGray, borderWidth: 1 }}>
        {items.map(({ IconComponent = McIcon, ...item }, index) => (
          <Ripple key={item.key} onPress={() => {
            hidePopover(); item.onPress();
          }}>
            <View style={[styles.item, index && styles.itemBorder].filter(Boolean)}>
              <Text style={styles.itemText}>
                <IconComponent name={item.icon} size={17} color={colors.ink} /> <Text> {item.text}</Text>
              </Text>
            </View>
          </Ripple>
        ))}
      </View>
    </Popover>
  );
};

export default MenuPopover;
