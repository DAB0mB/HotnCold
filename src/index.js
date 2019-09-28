import React from 'react';
import { SafeAreaView } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import {
  MapScreen,
  ProfileScreen,
  RadarScreen,
} from './screens';

const AppNavigator = createStackNavigator({
  Profile: {
    screen: ProfileScreen,
  },
  Map: {
    screen: MapScreen,
  },
  Radar: {
    screen: RadarScreen,
  },
}, {
  initialRouteName: 'Radar',
  headerMode: 'none',
});

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;
