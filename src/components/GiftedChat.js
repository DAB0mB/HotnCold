import { ReactNativeFile } from 'apollo-upload-client';
import React, { useCallback, useMemo } from 'react';
import { StyleSheet, Image } from 'react-native';
import { GiftedChat as _GiftedChat, Actions, Bubble, Send, Time, MessageText, MessageImage } from 'react-native-gifted-chat';
import UUID from 'uuid/v4';

import attachPng from '../assets/attach.png';
import avatarPng from '../assets/avatar.png';
import * as mutations from '../graphql/mutations';
import { useImagePicker } from '../services/ImagePicker';
import { useAlertError } from '../services/DropdownAlert';
import { colors } from '../theme';
import { useAsyncCallback } from '../utils';

const styles = StyleSheet.create({
  actionsContainer: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginLeft: 4, marginRight: -10, marginBottom: 0 },
  actionsImage: { width: 26, height: 26 },
});

const adaptUser = (user) => ({
  get _id() {
    return user.id;
  },
  get name() {
    return user.name;
  },
  get avatar() {
    return user.avatar || avatarPng;
  },
});

const adaptMessage = (message) => ({
  get _id() {
    return message.id;
  },
  get createdAt() {
    return message.createdAt;
  },
  get text() {
    return message.text;
  },
  get image() {
    return message.image;
  },
  get pending() {
    return message.pending;
  },
  get sent() {
    return message.sent;
  },
  get user() {
    return adaptUser(message.user);
  },
});

const normalizeUser = (user) => {
  user = { ...user };
  user.id = user._id;
  delete user._id;

  if (user.avatar === avatarPng) {
    user.avatar = null;
  }

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

const renderMessageImage = (props) => {
  return (
    <MessageImage {...props} />
  );
};

const GiftedChat = ({ user: _user, messages: _messages, ...props }) => {
  const alertError = useAlertError();
  const imagePicker = useImagePicker();
  const [uploadPicture] = mutations.uploadPicture.use({
    onError: alertError,
  });

  // Create adapted proxies instead of cloning objects, much less expensive when dealing
  // with a large amount of data
  const user = useMemo(() => adaptUser(_user), [_user]);
  const messages = useMemo(() =>
    !_messages ? [] :
      Array.apply(null, { length: _messages.length }).map(($0, i) => adaptMessage(_messages[i]))
  , [_messages, _messages && _messages.length]);

  const onSend = useCallback(([message]) => {
    if (typeof props.onSend != 'function') return;

    message = normalizeMessage(message);

    props.onSend(message);
  }, [props.onSend]);

  const onPressAvatar = useCallback((user) => {
    if (typeof props.onPressAvatar != 'function') return;

    user = normalizeMessage(user);

    props.onPressAvatar(user);
  }, [props.onPressAvatar]);

  const uploadImage = useAsyncCallback(function* () {
    if (typeof props.onSend != 'function') return;

    const localImage = yield new Promise(resolve => imagePicker.showImagePicker({}, resolve));

    const file = new ReactNativeFile({
      uri: localImage.uri,
      name: localImage.fileName,
      type: localImage.type,
    });

    let image;
    try {
      const res = yield uploadPicture(file);
      image = res?.data?.uploadPicture;
    }
    catch (e) {
      alertError(e);
    }

    if (!image) return;

    props.onSend({
      id: UUID(),
      createdAt: new Date(),
      image,
      user: _user,
    });
  }, [_user, uploadPicture, imagePicker, onSend]);

  const renderActions = useCallback((props) => (
    <Actions
      {...props}
      containerStyle={styles.actionsContainer}
      icon={() => (
        <Image
          style={styles.actionsImage}
          source={attachPng}
        />
      )}
      options={{
        'Upload image': uploadImage,
        'Cancel': () => {
          // Abort
        },
      }}
      optionTintColor={colors.ink}
    />
  ), [uploadImage]);

  return (
    <_GiftedChat
      {...props}
      user={user}
      messages={messages}
      onSend={onSend}
      onPressAvatar={onPressAvatar}
      renderBubble={renderBubble}
      renderActions={renderActions}
      renderSend={renderSend}
      renderTime={renderTime}
      renderMessageText={renderMessageText}
      renderMessageImage={renderMessageImage}
    />
  );
};

export default GiftedChat;
