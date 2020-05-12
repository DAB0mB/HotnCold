import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { CalendarList as SuperCalendarList } from 'react-native-calendars';
import SuperDay from 'react-native-calendars/src/calendar/day/basic';
import LinearGradient from 'react-native-linear-gradient';
import { RaisedTextButton } from 'react-native-material-buttons';

import { colors } from '../theme';
import { useConst } from '../utils';

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', borderWidth: 1, borderColor: colors.lightGray },
  buttonsDiv: { backgroundColor: 'white', padding: 10, alignItems: 'center', justifyContent: 'flex-end', flexDirection: 'row', alignSelf: 'stretch' },
  cancelButton: { color: colors.hot, fontSize: 14, paddingHorizontal: 16 },
});

const calendarTheme = {
  selectedDayBackgroundColor: colors.hot,
  todayTextColor: colors.hot,
  arrowColor: colors.hot,
};

const CalendarList = ({
  style,
  onConfirm,
  onCancel,
  timezone,
  current,
  minDate,
  maxDate,
  ...calendarProps
}) => {
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
    if (typeof onConfirm == 'function') {
      onConfirm(selectedDate);
    }
  }, [onConfirm, selectedDate]);

  const handleCancel = useCallback(() => {
    if (typeof onCancel == 'function') {
      onCancel();
    }
  }, [onCancel]);

  useEffect(() => {
    if (selectedDate !== current) {
      setSelectedDate(current);
    }
  }, [current]);

  return (
    <View style={[styles.container, style, { position: 'relative' }]}>
      <SuperCalendarList
        {...calendarProps}
        minDate={formattedMinDate}
        maxDate={formattedMaxDate}
        current={formattedSelectedDate}
        dayComponent={Day}
        theme={calendarTheme}
        onDayPress={handleDayChange}
        markedDates={markedDates}
      />

      <View style={{ position: 'absolute', bottom: 0, right: 0, left: 0 }}>
        <LinearGradient
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0 }}
          colors={['rgba(255, 255, 255, 1)', 'rgba(255, 255, 255, 0)']}
          style={{ alignSelf: 'stretch', height: 50 }}
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
    </View>
  );
};

export default CalendarList;
