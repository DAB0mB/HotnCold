import { fromBottom } from 'react-navigation-transitions';

import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import ProfileScreen from '../screens/Profile';
import createRouter from './createRouter';

const Base = createRouter({
  Profile: {
    screen: ProfileScreen,
  },
  Discovery: {
    screen: DiscoveryContainer,
  },
  Social: {
    screen: SocialContainer,
  },
}, {
  initialRouteName: 'Discovery',
  headerMode: 'none',
  transitionConfig: () => fromBottom(),
});

export default Base;
