import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { fromRight } from 'react-navigation-transitions';

import MapScreen from '../screens/Map';
import RadarScreen from '../screens/Radar';

const Navigator = createStackNavigator({
  Radar: {
    screen: RadarScreen,
  },
  Map: {
    screen: MapScreen,
  },
}, {
  initialRouteName: 'Map',
  headerMode: 'none',
  transitionConfig: () => fromRight(),
});

export default createAppContainer(Navigator);
