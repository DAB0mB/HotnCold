import { fromRight } from 'react-navigation-transitions';

import MapScreen from '../screens/Map';
import RadarScreen from '../screens/Radar';
import Router from './Router';

const Discovery = Router.create({
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

export default Discovery;
