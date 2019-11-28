export * from 'react-native-gifted-chat';

import { useCallback, useMemo } from 'react';
import { GiftedChat as _GiftedChat } from 'react-native-gifted-chat';

const adaptUser = (user) => ({
  get _id() { return _user.id },
  get name() { return _user.name },
  get avatar() { return _user.avatar },
});

const adaptMessage = (message) => ({
  get _id() { return message.id },
  get createdAt() { return message.createdAt },
  get text() { return message.text },
  get user() { return adaptUser(message.user) },
});

const normalizeUser = (user) => {
  user = { ...user };
  user.id = user._id;
  delete user._id;

  return user;
};

const normalizeMessage = (message) => {
  message = { ...message };
  message.id = message._id;
  message.user = normalizeUser(message.user);
  delete message._id;

  return message;
};

export const GiftedChat = ({ user: _user, messages: _messages, ...props }) => {
  // Create adapted proxies instead of cloning objects, much less expensive when dealing
  // with a large amount of data
  const user = useMemo(() => adaptUser(user), [_user]);
  const messages = useMemo(() =>
    Array.apply(null, { length: _messages.length }).map((_, i) => adaptMessage(_messages[i]))
  , [_messages, _messages.length]);

  const onSend = useCallback((message) => {
    if (typeof props.onSend != 'function') return;

    message = normalizeMessage(message);

    props.onSend(message);
  }, [props.onSend]);

  return (
    <GiftedChat
      {...props}
      user={user}
      messages={messages}
      onSend={onSend}
    />
  );
};
