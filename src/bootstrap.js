import 'moment-timezone';
import 'react-native-gesture-handler';

import BackgroundGeolocation from '@mauron85/react-native-background-geolocation';
import MapboxGL from '@react-native-mapbox-gl/maps';
import CONFIG from 'react-native-config';
import firebase from 'react-native-firebase';

import { promiseObj } from './utils';

const bootstrap = () => promiseObj({
  mapboxAccessToken: MapboxGL.setAccessToken(CONFIG.MAPBOX_ACCESS_TOKEN),

  backgroundGeolocation: promiseObj((resolve, reject) => {
    BackgroundGeolocation.configure({
      desiredAccuracy: BackgroundGeolocation.HIGH_ACCURACY,
      stationaryRadius: 50,
      distanceFilter: 50,
      notificationTitle: 'Hot&Cold Radar',
      notificationText: 'activated',
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

  notifications: new Promise((resolve, reject) => {
    // Build a channel
    const channel = new firebase.notifications.Android.Channel('chat-messages', 'Chat Messages', firebase.notifications.Android.Importance.High)
      .setDescription('Triggered from messages sent by users via the chat');

    // Create the channel
    firebase.notifications().android.createChannel(channel).then(resolve, reject);
  }),
}).then((/* results */) => {
  return {
    // Here we can define bootstrap payload
  };
});

export default bootstrap;
