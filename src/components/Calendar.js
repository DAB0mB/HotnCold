import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Calendar as SuperCalendar } from 'react-native-calendars';
import SuperDay from 'react-native-calendars/src/calendar/day/basic';
import CONFIG from 'react-native-config';
import { RaisedTextButton } from 'react-native-material-buttons';

import { colors } from '../theme';
import { useConst } from '../utils';

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.lightGray },
  buttonsDiv: { margin: 10, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row', alignSelf: 'stretch' },
  cancelButton: { color: colors.hot, fontSize: 14, paddingHorizontal: 16 },
});

const calendarTheme = {
  selectedDayBackgroundColor: colors.hot,
  todayTextColor: colors.hot,
  arrowColor: colors.hot,
};

const Calendar = ({
  visibleState,
  style,
  onConfirm,
  onCancel,
  timezone,
  current,
  minDate,
  maxDate,
  ...calendarProps
}) => {
  const [isVisible, setVisible] = visibleState;
  const [selectedDate, setSelectedDate] = useState(current);

  const momentTz = useCallback((date) => {
    let m = moment(date);

    if (timezone) {
      m = m.tz(timezone);
    }

    return m;
  }, [timezone]);

  const formattedMinDate = useMemo(() => momentTz(minDate).format('YYYY-MM-DD'), [momentTz, minDate]);
  const formattedMaxDate = useMemo(() => momentTz(maxDate).format('YYYY-MM-DD'), [momentTz, maxDate]);
  const formattedSelectedDate = useMemo(() => momentTz(selectedDate).format('YYYY-MM-DD'), [momentTz, selectedDate]);

  // Day component is not reactive
  const dayVars = useConst({});
  dayVars.minDate = minDate;
  dayVars.momentTz = momentTz;

  const Day = useCallback(({ state, ...props }) => {
    const { momentTz, minDate } = dayVars;

    const targetDate = momentTz()
      .set('date', props.date.day)
      .set('month', props.date.month - 1)
      .startOf('day')
      .toDate();

    if (targetDate.getTime() == minDate.getTime()) {
      state = 'today';
    }
    else if (state == 'today') {
      state = props.date.timestamp < minDate.getTime() ? 'disabled' : '';
    }

    return (
      <SuperDay {...props} state={state} />
    );
  }, [true]);

  const markedDates = useMemo(() => ({
    [momentTz(selectedDate).format('YYYY-MM-DD')]: { selected: true, disableTouchEvent: true },
  }), [momentTz, selectedDate]);

  const handleBackPress = useCallback(() => {
    if (CONFIG.USE_ROBOT) return;

    if (isVisible) {
      setVisible(false);

      return true;
    }
  }, [isVisible]);

  const handleDayChange = useCallback((date) => {
    setSelectedDate(
      momentTz()
        .set('date', date.day)
        .set('month', date.month - 1)
        .startOf('day')
        .toDate()
    );
  }, [selectedDate]);

  const handleConfirm = useCallback(() => {
    setVisible(false);

    if (typeof onConfirm == 'function') {
      onConfirm(selectedDate);
    }
  }, [onConfirm, selectedDate]);

  const handleCancel = useCallback(() => {
    setVisible(false);

    if (typeof onCancel == 'function') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    if (!isVisible) return;

    if (selectedDate !== current) {
      setSelectedDate(current);
    }

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [isVisible, current]);

  return isVisible && (
    <View style={[styles.container, style]}>
      <SuperCalendar
        {...calendarProps}
        minDate={formattedMinDate}
        maxDate={formattedMaxDate}
        current={formattedSelectedDate}
        dayComponent={Day}
        theme={calendarTheme}
        onDayPress={handleDayChange}
        markedDates={markedDates}
      />

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
  );
};

export default Calendar;
