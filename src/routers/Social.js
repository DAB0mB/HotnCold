import { fromRight } from 'react-navigation-transitions';

import ChatScreen from '../screens/Chat';
import InboxScreen from '../screens/Inbox';
import Router from './Router';

const Social = Router.create({
  Chat: {
    screen: ChatScreen,
  },
  Inbox: {
    screen: InboxScreen,
  },
}, {
  initialRouteName: 'Chat',
  headerMode: 'none',
  transitionConfig: () => fromRight(),
});

export default Social;
