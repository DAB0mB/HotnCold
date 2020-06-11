import { fromRight } from 'react-navigation-transitions';

import StatusesScreen from '../screens/Statuses';
import MapScreen from '../screens/Map';
import Router from './Router';

const Discovery = Router.create({
  Statuses: {
    screen: StatusesScreen,
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
