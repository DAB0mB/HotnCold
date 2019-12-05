import React, { useCallback, useMemo } from 'react';
import { GiftedChat as _GiftedChat, Bubble, Send, Time, MessageText } from 'react-native-gifted-chat';

import { colors } from '../theme';

const adaptUser = (user) => ({
  get _id() { return user.id },
  get name() { return user.name },
  get avatar() { return user.avatar },
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

const renderBubble = (props) => {
  return (
    <Bubble {...props} wrapperStyle={renderBubble.wrapperStyle} />
  );
};

renderBubble.wrapperStyle = {
  right: {
    backgroundColor: colors.hot,
  },
  left: {
    backgroundColor: colors.cold,
  },
};

const renderSend = (props) => {
  return (
    <Send {...props} textStyle={renderSend.sendTextStyle} />
  );
};

renderSend.sendTextStyle = {
  color: colors.ink,
};

const renderTime = (props) => {
  return (
    <Time {...props} timeTextStyle={renderTime.timeTextStyle} />
  );
};

renderTime.timeTextStyle = {
  left: { color: colors.ink },
  right: { color: 'white' },
};

const renderMessageText = (props) => {
  return (
    <MessageText {...props} textStyle={renderMessageText.textStyle} linkStyle={renderMessageText.linkStyle} />
  );
};

renderMessageText.textStyle = {
  left: { color: colors.ink },
  right: { color: 'white' },
};

renderMessageText.linkStyle = {
  left: { color: colors.hot },
  right: { color: colors.cold },
};

const GiftedChat = ({ user: _user, messages: _messages, ...props }) => {
  // Create adapted proxies instead of cloning objects, much less expensive when dealing
  // with a large amount of data
  const user = useMemo(() => adaptUser(_user), [_user]);
  const messages = useMemo(() =>
    !_messages ? [] :
    Array.apply(null, { length: _messages.length }).map((undefined, i) => adaptMessage(_messages[i]))
  , [_messages, _messages && _messages.length]);

  const onSend = useCallback(([message]) => {
    if (typeof props.onSend != 'function') return;

    message = normalizeMessage(message);

    props.onSend(message);
  }, [props.onSend]);

  return (
    <_GiftedChat
      {...props}
      user={user}
      messages={messages}
      onSend={onSend}
      renderBubble={renderBubble}
      renderSend={renderSend}
      renderTime={renderTime}
      renderMessageText={renderMessageText}
    />
  );
};

export default GiftedChat;
