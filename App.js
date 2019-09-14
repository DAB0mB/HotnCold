import React from 'react';
import { SafeAreaView } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import { ProfileScreen, ChatScreen } from './screens';

const AppNavigator = createStackNavigator({
  Chat: {
    screen: ChatScreen,
  },
  Profile: {
    screen: ProfileScreen,
  },
}, {
  initialRouteName: 'Profile',
  headerMode: 'none',
});

const AppContainer = createAppContainer(AppNavigator);

export default AppContainer;
