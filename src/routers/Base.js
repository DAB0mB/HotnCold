import { fromBottom } from 'react-navigation-transitions';

import AuthContainer from '../containers/Auth';
import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import ProfileScreen from '../screens/Profile';
import Router from './Router';

const Base = Router.create({
  Profile: {
    screen: ProfileScreen,
  },
  Auth: {
    screen: AuthContainer,
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
