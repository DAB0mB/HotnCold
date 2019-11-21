import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { fromBottom } from 'react-navigation-transitions';

import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import ProfileScreen from '../screens/Profile';

const Navigator = createStackNavigator({
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

export default createAppContainer(Navigator);
