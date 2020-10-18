import { fromRight } from 'react-navigation-transitions';

import StatusMessageScreen from '../screens/StatusMessage';
import StatusOptionsScreen from '../screens/StatusOptions';
import Router from './Router';

const StatusEditor = Router.create({
  StatusMessage: {
    screen: StatusMessageScreen,
  },
  StatusOptions: {
    screen: StatusOptionsScreen,
  },
}, {
  initialRouteName: 'StatusMessage',
  headerMode: 'none',
  transitionConfig: () => fromRight(),
});

export default StatusEditor;
