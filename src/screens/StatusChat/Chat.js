import React, { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';

import GiftedChat from '../../components/GiftedChat';
import Loader from '../../components/Loader';
import Base from '../../containers/Base';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation } from '../../services/Navigation';

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  loader: { alignItems: 'center', justifyContent: 'center' },
});

const Chat = ({ chat }) => {
  const { me } = useMine();
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);

  const messagesQuery = queries.messages.use(chat?.id, 20, {
    onCompleted: useCallback((data) => {
      if (!data) return;

      const messages = data.messages;

      if (!messages.length) return;

      const recentMessage = messages[0];
      const firstMessage = messages[messages.length - 1];

      if (!chat.firstMessage) {
        chat.firstMessage = recentMessage;
      }

      chat.recentMessages = messages;

      if (firstMessage.id === chat.firstMessage.id) {
        setLoadEarlier(false);
      }
      else {
        setLoadEarlier(true);
      }

      setIsLoadingEarlier(false);
    }, [chat]),
    onError: alertError,
  });

  const [sendMessage] = mutations.sendMessage.use(chat?.id, {
    onError: alertError,
  });
  const messages = messagesQuery.data?.messages;

  const onSend = useCallback((message) => {
    sendMessage(message);
  }, [sendMessage]);

  const onLoadEarlier = useCallback(() => {
    setIsLoadingEarlier(true);

    messagesQuery.fetchMore();
  }, [messagesQuery, setIsLoadingEarlier]);

  const handleAvatarPress = useCallback((user) => {
    baseNav.push('UserLobby', {
      userId: user.id,
    });
  }, [baseNav]);

  if (!chat) {
    return (
      <View style={[styles.container, styles.loader]}>
        <Loader />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GiftedChat
        user={me}
        messages={messages || chat.recentMessages}
        onLoadEarlier={onLoadEarlier}
        onSend={onSend}
        loadEarlier={loadEarlier}
        isLoadingEarlier={isLoadingEarlier}
        onPressAvatar={handleAvatarPress}
        keyboardShouldPersistTaps='never'
        scrollToBottom
      />
    </View>
  );
};

export default Chat;
