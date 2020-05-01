import { fromRight } from 'react-navigation-transitions';

import ActivityScreen from '../screens/Activity';
import MapScreen from '../screens/Map';
import Router from './Router';

const Discovery = Router.create({
  Activity: {
    screen: ActivityScreen,
  },
  Map: {
    screen: MapScreen,
  },
}, {
  initialRouteName: 'Map',
  headerMode: 'none',
  transitionConfig: () => fromRight(),
});

export default Discovery;
