import React from 'react';
import { SafeAreaView } from 'react-native';
import BleManager from 'react-native-ble-manager';
import BlePeripheral from 'react-native-ble-peripheral';
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
  initialRouteName: 'Map',
  headerMode: 'none',
});

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;
