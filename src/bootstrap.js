import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import MapboxGL from '@react-native-mapbox-gl/maps';
import BleManager from 'react-native-ble-manager';
import BluetoothStateManager from 'react-native-bluetooth-state-manager';
import CONFIG from 'react-native-config';
import Cookie from 'react-native-cookie';
import firebase from 'react-native-firebase';

const bootstrap = () => Promise.all([
  MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN),
  __DEV__ && CONFIG.INITIAL_USER_TOKEN && Cookie.set(CONFIG.SERVER_URI, 'authToken', CONFIG.INITIAL_USER_TOKEN),

  BluetoothStateManager.getState().then((state) => {
    if (state === 'Unsupported') {
      return false;
    }

    return BleManager.start();
  }).then(() => {
    return true;
  }),

  new Promise((resolve, reject) => {
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      stationaryRadius: 50,
      distanceFilter: 50,
      notificationTitle: 'Hot&Cold location tracking',
      notificationText: 'enabled',
      debug: __DEV__,
      startOnBoot: false,
      stopOnTerminate: true,
      locationProvider: BackgroundGeolocation.ACTIVITY_PROVIDER,
      interval: 10000,
      fastestInterval: 5000,
      activitiesInterval: 10000,
      stopOnStillActivity: false,
      url: `${CONFIG.SERVER_URI}/location`,
    }, resolve, reject);
  }),

  new Promise((resolve, reject) => {
    // Build a channel
    const channel = new firebase.notifications.Android.Channel('chat-messages', 'Chat Messages', firebase.notifications.Android.Importance.High)
      .setDescription('Triggered from messages sent by users via the chat');

    // Create the channel
    firebase.notifications().android.createChannel(channel).then(resolve, reject);
  }),
]).then((results) => {
  return {
    deviceInfo: {
      supportsBluetooth: results[2]
    },
  };
});

export default bootstrap;
