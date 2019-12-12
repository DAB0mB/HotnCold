import { fromRight } from 'react-navigation-transitions';

import MapScreen from '../screens/Map';
import RadarScreen from '../screens/Radar';
import createRouter from './createRouter';

const Discovery = createRouter({
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
