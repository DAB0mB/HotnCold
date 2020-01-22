import firebase from 'react-native-firebase';

const displayNotification = (message) => {
  if (!message.data.channelId) return;

  const props = JSON.parse(message.data.props);

  // TODO: Handle iOS
  const notification = new firebase.notifications.Notification()
    .setTitle(props.title)
    .setBody(props.body)
    .setData(props.data)
    .setNotificationId(message.data.notificationId)
    .android.setChannelId(message.data.channelId)
    .android.setLargeIcon(props.largeIcon);

  return firebase.notifications().displayNotification(notification).catch(err => console.error(err));
};

export default displayNotification;
