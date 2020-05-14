import { fadeIn, fromBottom } from 'react-navigation-transitions';

import AuthContainer from '../containers/Auth';
import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import AgreementScreen from '../screens/Agreement';
import AttendeesScreen from '../screens/Attendees';
import CalendarScreen from '../screens/Calendar';
import EventScreen from '../screens/Event';
import FAQScreen from '../screens/FAQ';
import ProfileScreen from '../screens/Profile';
import FilterScreen from '../screens/Filter';
import ProfileEditorScreen from '../screens/ProfileEditor';
import SelectionScreen from '../screens/Selection';
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
  FAQ: {
    screen: FAQScreen,
  },
  Profile: {
    screen: ProfileScreen,
  },
  Selection: {
    screen: SelectionScreen,
  },
  Attendees: {
    screen: AttendeesScreen,
  },
  Event: {
    screen: EventScreen,
  },
  Filter: {
    screen: FilterScreen,
  },
  ProfileEditor: {
    screen: ProfileEditorScreen,
  },
  MessageEditor: {
    screen: MessageEditorScreen,
  },
  Calendar: {
    screen: CalendarScreen,
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
