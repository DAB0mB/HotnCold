import moment from 'moment';
import React, { useEffect, useLayoutEffect, useState, useCallback } from 'react';
import { BackHandler, Animated, Text, View, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { DatePicker as SuperDatePicker } from 'react-native-wheel-datepicker';
import { RaisedTextButton } from 'react-native-material-buttons';
import CONFIG from 'react-native-config';

import { colors } from '../theme';
import { useMountedRef } from '../utils';

const styles = StyleSheet.create({
  container: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, .5)', alignItems: 'center', justifyContent: 'center' },
  modal: { alignSelf: 'stretch', alignItems: 'center', justifyContent: 'center', margin: 15, backgroundColor: 'white' },
  datePickerDiv: { alignSelf: 'stretch', position: 'relative' },
  datePicker: { backgroundColor: 'transparent' },
  // separatorDiv: { position: 'absolute', justifyContent: 'center', left: 0, right: 0, top: 0, bottom: 0 },
  // separator: { height: 40, borderTopWidth: 1, borderBottomWidth: 1, borderColor: hexToRgba(colors.hot, .5) },
  buttonsDiv: { margin: 10, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row', alignSelf: 'stretch' },
  cancelButton: { color: colors.hot, fontSize: 14, paddingHorizontal: 16 },
});

class PatchedDatePicker extends SuperDatePicker {
  constructor(props) {
    super(props);

    // Jan, Feb, Mar, etc
    moment.monthsShort().map((m, i) => {
      this.state.monthRange[i].label = m;
    });
  }

  genDateRange(dayNum) {
    const days = super.genDateRange(dayNum);

    // 1st, 2nd, 3rd, etc
    days.forEach((d) => {
      const n = d.value;
      const s = ['th', 'st', 'nd', 'rd'];
      const v = n % 100;

      d.label = n + (s[(v - 20) % 10] || s[v] || s[0]);
    });

    return days;
  }
}

const DatePicker = ({
  visibleState: [visibleState, setVisibleState],
  onConfirm,
  ...props,
}) => {
  const isMountedRef = useMountedRef();
  const [date, setDate] = useState(props.date);
  const [isViewVisible, setViewVisible] = useState(visibleState);
  const [opacity] = useState(() => new Animated.Value(visibleState ? 1 : 0));

  const onDateChange = useCallback((date) => {
    setDate(date);
  }, [true]);

  const handleConfirm = useCallback(() => {
    setVisibleState(false);

    onConfirm(date);
  }, [onConfirm, date]);

  const handleCancel = useCallback(() => {
    setVisibleState(false);
  }, [true]);

  useLayoutEffect(() => {
    if (isViewVisible === visibleState) return;

    if (visibleState) {
      setDate(props.date);
      setViewVisible(true);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {});
    }
    else {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        if (isMountedRef.current) {
          setViewVisible(false);
        }
      });
    }
  }, [visibleState]);

  const onBackPress = useCallback(() => {
    if (CONFIG.USE_ROBOT) return;

    if (isViewVisible) {
      setVisibleState(false);

      return true;
    }
  }, [isViewVisible]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [isViewVisible]);

  if (!isViewVisible) return null;

  return (
    <Animated.View style={[{ opacity }, styles.container]}>
      <View style={styles.modal}>
        <View style={styles.datePickerDiv}>
          <PatchedDatePicker {...props} date={date} onDateChange={onDateChange} style={styles.datePicker} />

          {/*<View style={styles.separatorDiv} pointerEvents='box-none'>
            <View style={styles.separator} pointerEvents='box-none' />
          </View>*/}
        </View>

        <View style={styles.buttonsDiv}>
          <TouchableWithoutFeedback onPress={handleCancel}>
            <Text style={styles.cancelButton}>CANCEL</Text>
          </TouchableWithoutFeedback>

          <RaisedTextButton
            onPress={handleConfirm}
            color={colors.hot}
            title='CONFIRM'
            titleColor='white'
          />
        </View>
      </View>
    </Animated.View>
  );
};

export default DatePicker;
