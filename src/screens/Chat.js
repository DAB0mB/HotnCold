import React, { useMemo, useState, useCallback } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { GiftedChat, Message } from 'react-native-gifted-chat';

import Social from '../containers/Social';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import { useMe } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const Chat = () => {
  const me = useMe();
  const alertError = useAlertError();
  const socialNav = useNavigation(Social);
  const recipient = socialNav.getParam('recipient');
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const messagesQuery = queries.messages.forChat.use(recipient.id, {
    onCompleted: useCallback(() => {
      setIsLoadingEarlier(false)
    }, [isLoadingEarlier]),
    onError: alertError,
  });
  const [sendMessage] = mutations.sendMessage.use(recipient, {
    onError: alertError,
  });
  const messages = useMemo(() => messagesQuery.data && messagesQuery.data.messages, [messagesQuery]);

  const renderMessage = useCallback((props) => {
    if (props.previousMessage == null) {
      setLoadEarlier(true);
    }

    return (
      <Message {...props} />
    );
  }, [loadEarlier]);

  const onSend = useCallback(([message]) => {
    sendMessage(message);
  }, [sendMessage, recipient.id]);

  const onLoadEarlier = useCallback(() => {
    setLoadEarlier(false);

    messagesQuery.fetchMore();
  }, [messagesQuery, loadEarlier]);

  return useLoading(!(messagesQuery.called && !messagesQuery.loading),
    <View style={styles.container}>
      <GiftedChat
        user={me.forChat}
        messages={messages}
        loadEarlier={loadEarlier}
        isLoadingEarlier={isLoadingEarlier}
        onLoadEarlier={onLoadEarlier}
        onSend={onSend}
        renderMessage={renderMessage}
        scrollToBottom
        keyboardShouldPersistTaps='never'
      />
      {
        Platform.OS === 'android' && <KeyboardAvoidingView behavior="padding" />
      }
    </View>
  );
};

export default Social.create(Chat);
