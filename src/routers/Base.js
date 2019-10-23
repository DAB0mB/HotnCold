import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';

import DiscoveryContainer from '../containers/Discovery';
import ProfileScreen from '../screens/Profile';

const Navigator = createStackNavigator({
  Profile: {
    screen: ProfileScreen,
  },
  Discovery: {
    screen: DiscoveryContainer,
  },
}, {
  initialRouteName: 'Discovery',
  headerMode: 'none',
});

export default createAppContainer(Navigator);
