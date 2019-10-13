import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import {
  MapScreen,
  ProfileScreen,
  RadarScreen,
} from './screens';

const Navigator = createStackNavigator({
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

export default createAppContainer(Navigator);
