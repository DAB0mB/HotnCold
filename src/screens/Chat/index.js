import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet } from 'react-native';

import GiftedChat from '../../components/GiftedChat';
import Social from '../../containers/Social';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useBuffer } from '../../services/Loading';
import { useNavigation } from '../../services/Navigation';
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const Chat = () => {
  const { me } = useMine();
  const updateChatMessagesRef = useRef(null);
  const alertError = useAlertError();
  const socialNav = useNavigation(Social);
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const chatId = socialNav.getParam('chatId');
  let chat = socialNav.getParam('chat');

  const messagesQuery = queries.messages.use(chatId || chat.id, 20, {
    onCompleted: useCallback(() => {
      updateChatMessagesRef.current();
    }, [true]),
    onError: alertError,
  });

  const messages = useMemo(() => messagesQuery.data && messagesQuery.data.messages, [messagesQuery]);

  let loading = false;
  if (chatId) {
    const chatQuery = queries.chat.use(chatId, {
      onCompleted: useCallback(() => {
        updateChatMessagesRef.current();
      }, [true]),
      onError: alertError,
    });
    chat = chatQuery.data && chatQuery.data.chat;
    loading = !chatQuery.called || chatQuery.loading;

    useEffect(() => {
      if (loading) return;

      socialNav.setParam('chat', chat);
    }, [loading]);
  }

  updateChatMessagesRef.current = useCallback(() => {
    if (!messages || !messages.length) return;
    if (!chat) return;

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
  }, [messages, chat]);

  const [sendMessage] = mutations.sendMessage.use(chatId || chat.id, {
    onError: alertError,
  });

  const onSend = useCallback((message) => {
    sendMessage(message);
  }, [sendMessage]);

  const onLoadEarlier = useCallback(() => {
    setIsLoadingEarlier(true);

    messagesQuery.fetchMore();
  }, [messagesQuery, setIsLoadingEarlier]);

  return useBuffer(loading || !chat, () =>
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
