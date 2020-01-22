import { zoomIn } from 'react-navigation-transitions';

import PhoneScreen from '../screens/Phone';
import VerifyScreen from '../screens/Verify';
import Router from './Router';

const Auth = Router.create({
  Phone: {
    screen: PhoneScreen,
  },
  Verify: {
    screen: VerifyScreen,
  },
}, {
  initialRouteName: 'Phone',
  headerMode: 'none',
  transitionConfig: () => zoomIn(),
});

export default Auth;
