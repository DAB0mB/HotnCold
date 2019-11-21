import { createAppContainer } from 'react-navigation';
import { createStackNavigator } from 'react-navigation-stack';
import { fromRight } from 'react-navigation-transitions';

import ChatScreen from '../screens/Chat';

const Navigator = createStackNavigator({
  Chat: {
    screen: ChatScreen,
  },
}, {
  initialRouteName: 'Chat',
  headerMode: 'none',
  transitionConfig: () => fromRight(),
});

export default createAppContainer(Navigator);
