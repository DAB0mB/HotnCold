import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';

import GiftedChat from '../../components/GiftedChat';
import Social from '../../containers/Social';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';
import * as subscriptions from '../../graphql/subscriptions';
import { useMine } from '../../services/Auth';
import { useAppState } from '../../services/AppState';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation } from '../../services/Navigation';
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const Chat = () => {
  const { me } = useMine();
  const alertError = useAlertError();
  const socialNav = useNavigation(Social);
  const chat = socialNav.getParam('chat');
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const [markChatAsRead] = mutations.markChatAsRead.use(chat.id);
  const [, setAppState] = useAppState();
  const messagesQuery = queries.messages.use(chat.id, 20, {
    onCompleted: useCallback((data) => {
      if (!data) {
        alertError('Network Error: Network request failed');

        return;
      }

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
    }, [alertError]),
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

  useEffect(() => {
    markChatAsRead();
  }, [true]);

  subscriptions.chatBumped.use({
    onSubscriptionData: useCallback(() => {
      markChatAsRead();
    }, [true]),
  }),

  useEffect(() => {
    setAppState(appState => ({
      ...appState,
      activeChat: chat,
    }));

    return () => {
      setAppState((appState) => {
        appState = { ...appState };
        delete appState.activeChat;

        return appState;
      });
    };
  }, [chat.id]);

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