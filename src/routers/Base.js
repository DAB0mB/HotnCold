import { fadeIn, fromBottom } from 'react-navigation-transitions';

import AuthContainer from '../containers/Auth';
import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import AgreementScreen from '../screens/Agreement';
import StatusChatScreen from '../screens/StatusChat';
import ParticipantsScreen from '../screens/Participants';
import FAQScreen from '../screens/FAQ';
import ProfileScreen from '../screens/Profile';
import ProfileEditorScreen from '../screens/ProfileEditor';
import AreaSearchScreen from '../screens/AreaSearch';
import MessageEditorScreen from '../screens/MessageEditor';
import Router from './Router';

const handleCustomTransition = ({ scenes }) => {
  const nextScene = scenes[scenes.length - 1];

  if (nextScene.route.routeName == 'Filter') {
    return fadeIn();
  }

  return fromBottom();
};

const Base = Router.create({
  Agreement: {
    screen: AgreementScreen,
  },
  StatusChat: {
    screen: StatusChatScreen,
  },
  FAQ: {
    screen: FAQScreen,
  },
  Profile: {
    screen: ProfileScreen,
  },
  Participants: {
    screen: ParticipantsScreen,
  },
  ProfileEditor: {
    screen: ProfileEditorScreen,
  },
  MessageEditor: {
    screen: MessageEditorScreen,
  },
  AreaSearch: {
    screen: AreaSearchScreen,
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
  transparentCard: true,
  initialRouteName: 'Discovery',
  headerMode: 'none',
  transitionConfig: (nav) => ({
    ...handleCustomTransition(nav),
    containerStyleLight: {
      backgroundColor: 'white',
    },
  }),
});

export default Base;
