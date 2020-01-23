import { handleMessage } from './services/Notifications';

const bgMessaging = ({ data }) => {
  if (!data.channelId) return;

  const payload = data.payload ? JSON.parse(data.payload) : {};

  return handleMessage({ ...data, payload }).catch((err) => {
    console.error(err);
  });
};

export default bgMessaging;
