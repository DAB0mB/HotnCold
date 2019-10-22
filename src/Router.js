import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { fromRight, fromBottom } from 'react-navigation-transitions'

import MapScreen from './screens/Map';
import ProfileScreen from './screens/Profile';
import RadarScreen from './screens/Radar';

const handleCustomTransition = ({ scenes }) => {
  const prevScene = scenes[scenes.length - 2];
  const nextScene = scenes[scenes.length - 1];

  if (
    prevScene
    && prevScene.route.routeName === 'Map'
    && nextScene.route.routeName === 'Radar'
  ) {
    return fromRight();
  }

  return fromBottom();
}

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
  transitionConfig: (nav) => handleCustomTransition(nav),
});

export default createAppContainer(Navigator);
