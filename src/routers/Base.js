import { fadeIn, fromBottom } from 'react-navigation-transitions';

import AuthContainer from '../containers/Auth';
import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import StatusEditorContainer from '../containers/StatusEditor';
import AgreementScreen from '../screens/Agreement';
import StatusChatScreen from '../screens/StatusChat';
import ParticipantsScreen from '../screens/Participants';
import FAQScreen from '../screens/FAQ';
import ProfileScreen from '../screens/Profile';
import ProfileEditorScreen from '../screens/ProfileEditor';
import AreaSearchScreen from '../screens/AreaSearch';
import PlaceSearchScreen from '../screens/PlaceSearch';
import MessageEditorScreen from '../screens/MessageEditor';
import ReferenceDetailsScreen from '../screens/ReferenceDetails';
import UserLobbyScreen from '../screens/UserLobby';
import Router from './Router';

const handleCustomTransition = ({ scenes }) => {
  const nextScene = scenes[scenes.length - 1];

  if (nextScene.route.routeName == 'Filter') {
    return fadeIn();
  }

  if (nextScene.route.routeName == 'ReferenceDetails') {
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
  PlaceSearch: {
    screen: PlaceSearchScreen,
  },
  ReferenceDetails: {
    screen: ReferenceDetailsScreen,
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
  StatusEditor: {
    screen: StatusEditorContainer,
  },
  UserLobby: {
    screen: UserLobbyScreen,
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
