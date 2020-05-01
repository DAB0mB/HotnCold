import React, { useCallback, useState } from 'react';
import { Dimensions } from 'react-native';
import { TabView, TabBar, SceneMap } from 'react-native-tab-view';

import Discovery from '../../containers/Discovery';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import Attendance from './Attendance';
import Statuses from './Statuses';

const initialLayout = { width: Dimensions.get('window').width };

const Cards = () => {
  const [index, setIndex] = useState(0);
  const discoveryNav = useNavigation(Discovery);

  discoveryNav.useBackListener();

  const [routes] = useState([
    { key: 'statuses', title: 'Statuses' },
    { key: 'attendance', title: 'Attendance' },
  ]);

  const renderScene = SceneMap({
    statuses: Statuses,
    attendance: Attendance,
  });

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
      onIndexChange={setIndex}
      initialLayout={initialLayout}
    />
  );
};

export default Discovery.create(Cards);
