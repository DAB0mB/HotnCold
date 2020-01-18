import { AppRegistry } from 'react-native';

import App from './src';
import bgMessaging from './src/bgMessaging';

AppRegistry.registerComponent('hotncold', () => App);
AppRegistry.registerHeadlessTask('RNFirebaseBackgroundMessage', () => bgMessaging);
