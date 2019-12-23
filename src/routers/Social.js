import { fromRight } from 'react-navigation-transitions';

import ChatScreen from '../screens/Chat';
import InboxScreen from '../screens/Inbox';
import PeopleScreen from '../screens/People';
import createRouter from './createRouter';

const Social = createRouter({
  Chat: {
    screen: ChatScreen,
  },
  Inbox: {
    screen: InboxScreen,
  },
  People: {
    screen: PeopleScreen,
  },
}, {
  initialRouteName: 'Chat',
  headerMode: 'none',
  transitionConfig: () => fromRight(),
});

export default Social;
