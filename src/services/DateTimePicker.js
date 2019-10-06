import React, { createContext, useContext, useState, useMemo } from 'react';
import DateTimePicker from 'react-native-modal-datetime-picker';

const DateTimePickerContext = createContext(null);

export const DateTimePickerProvider = ({ children }) => {
  const [date, setDate] = useState(() => new Date());
  const [mode, setMode] = useState('date');
  const [maximumDate, setMaximumDate] = useState();
  const [minimumDate, setMinimumDate] = useState();
  const [onConfirm, setOnConfirm] = useState(() => () => {});
  const [isVisible, setIsVisible] = useState(false);

  const context = useMemo(() => ({
    setDate,
    setOnConfirm,
    setMode,
    setMaximumDate,
    setMinimumDate,

    show() {
      setIsVisible(true);
    },

    hide() {
      setIsVisible(false);
    },
  }), [
    setDate,
    setOnConfirm,
    setIsVisible,
    setMode,
    setMinimumDate,
    setMaximumDate,
  ]);

  return (
    <DateTimePickerContext.Provider value={context}>
      {children}
      <DateTimePicker
        date={date}
        maximumDate={maximumDate}
        minimumDate={minimumDate}
        onConfirm={onConfirm}
        isVisible={isVisible}
        onCancel={context.hide}
      />
    </DateTimePickerContext.Provider>
  );
};

export const useDateTimePicker = (defaults = {}) => {
  const dateTimePicker = useContext(DateTimePickerContext);

  return useMemo(() => ({
    show({
      date = defaults.date,
      mode = defaults.mode,
      onConfirm = defaults.onConfirm,
      maximumDate = defaults.maximumDate,
      minimumDate = defaults.minimumDate,
    } = {}) {
      if (onConfirm) {
        dateTimePicker.setOnConfirm(() => onConfirm);
      }
      if (date) {
        dateTimePicker.setDate(date);
      }
      if (mode) {
        dateTimePicker.setMode(mode);
      }
      if (maximumDate) {
        dateTimePicker.setMaximumDate(maximumDate);
      }
      if (minimumDate) {
        dateTimePicker.setMinimumDate(minimumDate);
      }
      dateTimePicker.show();
    },

    hide() {
      dateTimePicker.hide();
    },
  }), [
    ...Object.values(dateTimePicker),
    defaults.onConfirm,
    defaults.date,
    defaults.mode,
    defaults.maximumDate,
    defaults.minimumDate,
  ]);
};
