import { fromRight } from 'react-navigation-transitions';

import CardsScreen from '../screens/Cards';
import MapScreen from '../screens/Map';
import Router from './Router';

const Discovery = Router.create({
  Cards: {
    screen: CardsScreen,
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
