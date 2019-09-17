import React from 'react';
import { SafeAreaView } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import { ProfileScreen, MapScreen } from './screens';

const AppNavigator = createStackNavigator({
  Profile: {
    screen: ProfileScreen,
  },
  Map: {
    screen: MapScreen,
  },
}, {
  initialRouteName: 'Map',
  headerMode: 'none',
});

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;
