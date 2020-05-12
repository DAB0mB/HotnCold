import React, { useCallback } from 'react';

import CalendarList from '../components/CalendarList';
import Base from '../containers/Base';
import { useAppState } from '../services/AppState';
import { useNavigation } from '../services/Navigation';

const Calendar = () => {
  const baseNav = useNavigation(Base);
  const minDate = baseNav.getParam('minDate');
  const maxDate = baseNav.getParam('maxDate');
  const timezone = baseNav.getParam('timezone');
  const [appState, setAppState] = useAppState();
  const current = appState.discoveryTime;

  baseNav.useBackListener();

  const onConfirm = useCallback((discoveryTime) => {
    if (discoveryTime === appState.discoveryTime) {
      return;
    }

    // Given time at the beginning of UTC day
    setAppState(appState => ({
      ...appState,
      discoveryTime,
    }));

    baseNav.goBackOnceFocused();
  }, [baseNav]);

  const onCancel = useCallback(() => {
    baseNav.goBackOnceFocused();
  }, [baseNav]);

  return (
    <CalendarList
      onConfirm={onConfirm}
      onCancel={onCancel}
      minDate={minDate}
      maxDate={maxDate}
      current={current}
      timezone={timezone}
    />
  );
};

export default Base.create(Calendar);
