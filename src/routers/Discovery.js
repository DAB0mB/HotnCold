import { fromRight } from 'react-navigation-transitions';

import FeedScreen from '../screens/Feed';
import MapScreen from '../screens/Map';
import Router from './Router';

const Discovery = Router.create({
  Feed: {
    screen: FeedScreen,
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
