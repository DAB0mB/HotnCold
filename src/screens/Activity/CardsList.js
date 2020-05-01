import moment from 'moment';
import React, { useCallback } from 'react';
import { FlatList, View, Text, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import Ripple from 'react-native-material-ripple';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors, hexToRgba } from '../../theme';

const styles = StyleSheet.create({
  item: {
    position: 'relative',
    backgroundColor: 'white',
    margin: 20,
  },
  listFooter: {
    height: 50,
  },
  itemRipple: {
    padding: 5,
  },
  itemTextView: {
    flex: 1,
    padding: 20,
    paddingBottom: 37,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    textAlign: 'center',
    fontSize: 18,
    color: colors.ink,
  },
  itemDate: {
    color: colors.ink,
  },
  deleteItemView: {
    position: 'absolute',
    right: 0,
    top: 0,
    padding: 5,
  },
});

const CardsList = ({ timestampKey, textKey, timezone, onItemPress, onItemDelete, ...props }) => {
  const momentTz = useCallback((date) => {
    let m = moment(date);

    if (timezone) {
      m = m.tz(timezone);
    }

    return m;
  }, [timezone]);

  const getCalendarDay = useCallback((date) => {
    // Today, Tomorrow, Upcoming Tuesday, 01/01/2020
    return momentTz(date).calendar(null, {
      sameDay: '[Today]',
      nextDay: '[Tomorrow]',
      nextWeek: '[Upcoming] dddd',
      sameElse: 'DD/MM/YYYY'
    }).split(' at ')[0];
  }, [momentTz]);

  const renderItem = useCallback(({ item, index }) => (
    <View style={styles.item}>
      <Ripple style={styles.itemRipple} onPress={() => onItemPress(item, index)}>
        <View style={{ flexDirection: 'row' }}>
          <View style={{ flex: 1 }}>
            <Text style={styles.itemDate}>{getCalendarDay(item[timestampKey])}</Text>
          </View>
        </View>

        <View style={styles.itemTextView}>
          <Text style={styles.itemText}>{item[textKey]}</Text>
        </View>
      </Ripple>

      <TouchableWithoutFeedback onPress={() => onItemDelete(item, index)}>
        <View style={styles.deleteItemView}>
          <McIcon name='trash-can' color={hexToRgba(colors.gray, .5)} size={20} />
        </View>
      </TouchableWithoutFeedback>
    </View>
  ), [onItemDelete, onItemPress, timestampKey, textKey]);

  return (
    <FlatList
      {...props}
      renderItem={renderItem}
    />
  );
};

export default CardsList;
