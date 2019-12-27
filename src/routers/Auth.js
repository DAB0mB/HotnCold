import { zoomIn } from 'react-navigation-transitions';

import PhoneScreen from '../screens/Phone';
import VerifyScreen from '../screens/Verify';
import createRouter from './createRouter';

const Auth = createRouter({
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
