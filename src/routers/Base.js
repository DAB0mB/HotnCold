import { fromBottom } from 'react-navigation-transitions';

import AuthContainer from '../containers/Auth';
import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import AgreementScreen from '../screens/Agreement';
import EventScreen from '../screens/Event';
import FAQScreen from '../screens/FAQ';
import ProfileScreen from '../screens/Profile';
import ProfileEditorScreen from '../screens/ProfileEditor';
import SelectionScreen from '../screens/Selection';
import StatusEditorScreen from '../screens/StatusEditor';
import Router from './Router';

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
  Event: {
    screen: EventScreen,
  },
  ProfileEditor: {
    screen: ProfileEditorScreen,
  },
  StatusEditor: {
    screen: StatusEditorScreen,
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
  transitionConfig: () => ({
    ...fromBottom(),
    containerStyleLight: {
      backgroundColor: 'white',
    },
  }),
});

export default Base;
