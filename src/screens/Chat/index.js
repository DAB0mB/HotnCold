import React, { useMemo, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import GiftedChat from '../../components/GiftedChat';
import Social from '../../containers/Social';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useMe } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation } from '../../services/Navigation';
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const Chat = () => {
  const me = useMe();
  const alertError = useAlertError();
  const socialNav = useNavigation(Social);
  const chat = socialNav.getParam('chat');
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const messagesQuery = queries.messages.use(chat.id, 20, {
    onCompleted: useCallback(({ messages }) => {
      if (!messages.length) return;

      const recentMessage = messages[0];

      if (!chat.firstMessage) {
        chat.firstMessage = recentMessage;
      }

      chat.recentMessages = messages;

      if (recentMessage.id === chat.firstMessage.id) {
        setLoadEarlier(false);
      }
      else {
        setLoadEarlier(true);
      }

      setIsLoadingEarlier(false);
    }, []),
    onError: alertError,
  });
  const [sendMessage] = mutations.sendMessage.use(chat.id, {
    onError: alertError,
  });
  const messages = useMemo(() => messagesQuery.data && messagesQuery.data.messages, [messagesQuery]);

  const onSend = useCallback((message) => {
    sendMessage(message);
  }, [sendMessage]);

  const onLoadEarlier = useCallback(() => {
    setIsLoadingEarlier(true);

    messagesQuery.fetchMore();
  }, [messagesQuery, setIsLoadingEarlier]);

  return (
    <View style={styles.container}>
      <GiftedChat
        user={me}
        messages={messages || chat.recentMessages}
        onLoadEarlier={onLoadEarlier}
        onSend={onSend}
        loadEarlier={loadEarlier}
        isLoadingEarlier={isLoadingEarlier}
        keyboardShouldPersistTaps='never'
        scrollToBottom
      />
    </View>
  );
};

Chat.Header = Header;

export default Social.create(Chat);
