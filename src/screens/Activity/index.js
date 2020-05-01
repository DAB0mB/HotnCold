import React, { useCallback, useState } from 'react';
import { Dimensions } from 'react-native';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

import Discovery from '../../containers/Discovery';
import { useAppState } from '../../services/AppState';
import { useScreenFrame } from '../../services/Frame';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import Attendance from './Attendance';
import Statuses from './Statuses';

const initialLayout = { width: Dimensions.get('window').width };

const Activity = () => {
  const [appState, setAppState] = useAppState();
  const [index, setIndex] = useState(() => appState.activityTabIndex || 0);
  const discoveryNav = useNavigation(Discovery);

  discoveryNav.useBackListener();
  useScreenFrame();

  const [routes] = useState([
    { key: 'statuses', title: 'Statuses' },
    { key: 'attendance', title: 'Attendance' },
  ]);

  const renderScene = SceneMap({
    statuses: Statuses,
    attendance: Attendance,
  });

  const handleIndexChange = useCallback((index) => {
    setAppState(appState => ({
      ...appState,
      activityTabIndex: index,
    }));

    setIndex(index);
  }, [true]);

  const renderTabBar = useCallback(props => (
    <TabBar
      {...props}
      indicatorStyle={{ backgroundColor: colors.hot }}
      style={{ backgroundColor: 'white' }}
      labelStyle={{ color: colors.hot }}
    />
  ), [true]);

  return (
    <TabView
      navigationState={{ index, routes }}
      renderScene={renderScene}
      renderTabBar={renderTabBar}
      onIndexChange={handleIndexChange}
      initialLayout={initialLayout}
    />
  );
};

export default Discovery.create(Activity);
