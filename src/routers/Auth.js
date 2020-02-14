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
  transitionConfig: () => {
    const zoomInConfig = zoomIn();

    return {
      transitionSpec: {
        ...zoomInConfig.transitionSpec
      },
      screenInterpolator: ({ position, scene }) => {
        const { index } = scene;

        const opacity = position.interpolate({
          inputRange: [index - 1, index, index + 1],
          outputRange: [0, 1, 0],
        });

        return {
          ...zoomInConfig.screenInterpolator({ position, scene }),
          opacity,
        };
      },
    };
  },
});

export default Auth;
