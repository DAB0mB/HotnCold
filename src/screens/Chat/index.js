import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import GiftedChat from '../../components/GiftedChat';
import Loader from '../../components/Loader';
import Social from '../../containers/Social';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import * as subscriptions from '../../graphql/subscriptions';
import { useAppState } from '../../services/AppState';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation } from '../../services/Navigation';
import Header from './Header';

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { alignItems: 'center', justifyContent: 'center' },
});

const Chat = () => {
  const { me } = useMine();
  const alertError = useAlertError();
  const socialNav = useNavigation(Social);
  const [chat, setChat] = useState(socialNav.getParam('chat'));
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [markChatAsRead] = mutations.markChatAsRead.use(chat?.id);
  const [, setAppState] = useAppState();

  const [findOrCreateChat] = mutations.findOrCreateChat.use(socialNav.getParam('recipientId'), {
    onCompleted: useCallback((data) => {
      if (!data) return;

      const chat = data.findOrCreateChat;

      setChat(chat);
    }, [true]),
    onError: alertError,
  });

  queries.chat.use(socialNav.getParam('chatId'), {
    onCompleted: useCallback((data) => {
      if (!data) return;

      const chat = data.chat;

      setChat(chat);
    }, [true]),
    onError: alertError,
  });

  useEffect(() => {
    if (!chat && !socialNav.getParam('chatId')) {
      findOrCreateChat();
    }
  }, [true]);

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

  useEffect(() => {
    if (chat) {
      markChatAsRead();
    }
  }, [chat]);

  subscriptions.chatBumped.use({
    onSubscriptionData: useCallback(() => {
      if (chat) {
        markChatAsRead();
      }
    }, [chat]),
  }),

  useEffect(() => {
    if (!chat) return;

    let recentActiveChat;

    setAppState(appState => {
      recentActiveChat = appState.activeChat;

      return {
        ...appState,
        activeChat: chat,
      };
    });

    return () => {
      setAppState((appState) => {
        return {
          ...appState,
          activeChat: recentActiveChat,
        };
      });
    };
  }, [chat?.id]);

  Social.useHeader(
    <Header chat={chat} />
  );

  if (!chat) {
    return (
      <View style={[styles.container, styles.loading]}>
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
        keyboardShouldPersistTaps='never'
        scrollToBottom
      />
    </View>
  );
};

export default Social.create(Chat);