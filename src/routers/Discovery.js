import { fromRight } from 'react-navigation-transitions';

import HistoryScreen from '../screens/History';
import MapScreen from '../screens/Map';
import Router from './Router';

const Discovery = Router.create({
  History: {
    screen: HistoryScreen,
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
