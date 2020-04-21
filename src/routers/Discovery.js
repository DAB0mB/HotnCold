import { fromRight } from 'react-navigation-transitions';

import MapScreen from '../screens/Map';
import StatusBoardScreen from '../screens/StatusBoard';
import Router from './Router';

const Discovery = Router.create({
  StatusBoard: {
    screen: StatusBoardScreen,
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
