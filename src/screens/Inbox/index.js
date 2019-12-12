import React, { useCallback } from 'react';
import { StyleSheet, View, FlatList, TouchableHighlight, Text } from 'react-native';

import Social from '../containers/Social';
import * as queries from '../graphql/queries';
import { useLoading } from '../services/Loading';
import { useNavigation } from '../services/Navigation';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    height: 100,
  },
  chatAvatar: {
    height: 100,
  },
  chatAvatarImage: {
    resizeMode: 'contain',
    height: 100,
    borderRadius: 999,
  },
  chatDetails: {
    flex: 1,
    flexDirection: 'column',
  },
  chatDetailsBorder: {
    borderBottomRadius: 1,
    borderBottomColor: colors.gray,
  },
  chatDescription: {
    flexDirection: 'row',
  },
  chatTitle: {
    flex: 1,
  },
  chatTitleText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
  chatTime: {

  },
  chatTimeText: {
    fontSize: 12,
    color: colors.gray,
  },
  chatRecentMessage: {

  },
  chatRecentMessageText: {
    fontSize: 13,
    color: colors.gray,
  },
});

const getChatId = c => c.id;

const Inbox = () => {
  const chatsQuery = queries.chats.use();
  const { chats = [] } = chatsQuery.data || {};
  const baseNav = useNavigation(Base);
  const socialNav = useNavigation(Social);

  baseNav.useBackListener();

  const navToChat = useCallback((chat) => {
    socialNav.push('Chat', { chat });
  }, [socialNav]);

  const renderChatItem = useCallback((chat, index, separators) => (
    <TouchableHighlight
      onPress={() => navToChat(chat)}
      onShowUnderlay={separators.highlight}
      onHideUnderlay={separators.unhighlight}
    >
      <View style={styles.chatItem}>
        <View style={styles.chatAvatar}>
          <Image style={styles.chatAvatarImage} />
        </View>

        <View style={[styles.chatDetails, index && styles.chatDetailsBorder].filter(Boolean)}>
          <View style={styles.chatDescription}>
            <View style={styles.chatTitle}>
              <Text style={styles.chatTitleText}>{chat.title}</Text>
            </View>

            <View style={styles.chatTime}>
              <Text style={styles.chatTimeText}>{moment(chat.recentMessage.createdAt).fromNow()}</Text>
            </View>
          </View>

          <View style={styles.chatRecentMessage}>
            <Text style={styles.chatRecentMessageText}>{chat.recentMessage.text}</Text>
          </View>
        </View>
      </View>
    </TouchableHighlight>
  ), [navToChat]);

  return useLoading(chatsQuery.loaded,
    <View style={styles.container}>
      <FlatList data={chats} keyExtractor={getChatId} renderItem={renderChatItem} />
    </View>
  );
};

Inbox.Header = require('./Header');

export default Social.create(Inbox);
