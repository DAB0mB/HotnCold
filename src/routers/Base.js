import { fromBottom } from 'react-navigation-transitions';

import AuthContainer from '../containers/Auth';
import DiscoveryContainer from '../containers/Discovery';
import SocialContainer from '../containers/Social';
import AgreementScreen from '../screens/Agreement';
import FAQScreen from '../screens/FAQ';
import ProfileScreen from '../screens/Profile';
import ProfileEditorScreen from '../screens/ProfileEditor';
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
  ProfileEditor: {
    screen: ProfileEditorScreen,
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
