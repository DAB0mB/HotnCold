import React, { useMemo, useState, useCallback } from 'react';
import { StyleSheet, View } from 'react-native';

import GiftedChat from '../components/GiftedChat';
import Base from '../containers/Base';
import Social from '../containers/Social';
import * as mutations from '../graphql/mutations';
import * as queries from '../graphql/queries';
import { useMe } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useLoading } from '../services/Loading';
import { useNavigation } from '../services/Navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

const Chat = () => {
  const me = useMe();
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const chat = baseNav.getParam('chat');
  const [loadEarlier, setLoadEarlier] = useState(false);
  const [isLoadingEarlier, setIsLoadingEarlier] = useState(false);
  const messagesQuery = queries.messages.use(chat.id, 20, {
    onCompleted: useCallback(({ messages }) => {
      const lastMessage = messages[messages.length - 1];

      if ((lastMessage && lastMessage.id) == chat.firstMessage.id) {
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

  return useLoading(!messagesQuery.called || messagesQuery.loading,
    <View style={styles.container}>
      <GiftedChat
        user={me}
        messages={messages}
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
