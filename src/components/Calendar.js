import moment from 'moment';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, StyleSheet, Text, TouchableWithoutFeedback, View } from 'react-native';
import { Calendar as SuperCalendar } from 'react-native-calendars';
import CONFIG from 'react-native-config';
import { RaisedTextButton } from 'react-native-material-buttons';

import { colors } from '../theme';

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

const Calendar = ({ visibleState, style, onConfirm, onCancel, ...calendarProps }) => {
  const [isVisible, setVisible] = visibleState;
  const [selectedDate, setSelectedDate] = useState(calendarProps.current);

  const markedDates = useMemo(() => ({
    [moment(selectedDate).format('YYYY-MM-DD')]: { selected: true, disableTouchEvent: true },
  }), [selectedDate]);

  const handleBackPress = useCallback(() => {
    if (CONFIG.USE_ROBOT) return;

    if (isVisible) {
      setVisible(false);

      return true;
    }
  }, [isVisible]);

  const handleDayChange = useCallback(({ timestamp }) => {
    setSelectedDate(new Date(timestamp));
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

    if (selectedDate !== calendarProps.current) {
      setSelectedDate(calendarProps.current);
    }

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [isVisible, calendarProps.current]);

  return isVisible && (
    <View style={[styles.container, style]}>
      <SuperCalendar
        {...calendarProps}
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
