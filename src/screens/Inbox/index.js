import moment from 'moment';
import React, { useCallback } from 'react';
import { StyleSheet, View, FlatList, Text, Image } from 'react-native';
import Ripple from 'react-native-material-ripple';

import Social from '../../containers/Social';
import * as queries from '../../graphql/queries';
import { useNavigation } from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useMountedRef } from '../../utils';
import Header, { $Header } from './Header';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  chatItem: {
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
  },
  chatAvatar: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
  },
  chatAvatarImage: {
    resizeMode: 'contain',
    height: 50,
    marginRight: 10,
    borderRadius: 999,
  },
  chatDetails: {
    flex: 1,
    flexDirection: 'column',
    paddingTop: 10,
    paddingBottom: 10,
  },
  chatDetailsBorder: {
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(colors.gray, .5),
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
    flexDirection: 'row',
  },
  chatRecentMessageText: {
    fontSize: 13,
    color: colors.gray,
  },
  unreadMessages: {
    backgroundColor: colors.hot,
    borderRadius: 999,
    height: 20,
    width: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  unreadMessagesText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 11,
  },
});

const getChatId = c => c.id;

export const $Inbox = {
  Header: $Header,
};

const Inbox = () => {
  const chatsQuery = queries.chats.use();
  const { chats = [] } = chatsQuery.data || {};
  const socialNav = useNavigation(Social);
  const isMountedRef = useMountedRef();

  const navToChat = useCallback((chat) => {
    setTimeout(() => {
      if (isMountedRef.current) {
        socialNav.push('Chat', { chat });
      }
    }, 200);
  }, [socialNav]);

  const renderChatItem = useCallback(({ item: chat, index }) => (
    <Ripple
      onPress={() => navToChat(chat)}
    >
      <View style={styles.chatItem}>
        <View style={styles.chatAvatar}>
          <Image style={styles.chatAvatarImage} source={{ uri: chat.picture }} />
        </View>

        <View style={[styles.chatDetails, index && styles.chatDetailsBorder].filter(Boolean)}>
          <View style={styles.chatDescription}>
            <View style={styles.chatTitle}>
              <Text style={styles.chatTitleText}>{chat.title}</Text>
            </View>

            <View style={styles.chatTime}>
              <Text style={[styles.chatTimeText, chat.unreadMessagesCount && { color: colors.hot }].filter(Boolean)}>{moment(chat.recentMessages[0].createdAt).fromNow()}</Text>
            </View>
          </View>

          <View style={styles.chatRecentMessage}>
            <View style={{ flex: 1 }}>
              <Text style={styles.chatRecentMessageText}>{chat.recentMessages[0].text}</Text>
            </View>

            {!!chat.unreadMessagesCount && (
              <View style={{ flex: 1, alignItems: 'flex-end', justifyContent: 'flex-end' }}>
                <View style={styles.unreadMessages}>
                  <Text style={styles.unreadMessagesText}>{chat.unreadMessagesCount}</Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </View>
    </Ripple>
  ), [navToChat]);

  return (
    <View style={styles.container}>
      {chats.length ? (
        <FlatList data={chats} keyExtractor={getChatId} renderItem={renderChatItem} />
      ) : chatsQuery.called && !chatsQuery.loading && (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 50 }}>
          <Text style={{ textAlign: 'center' }}>Well, you might wanna strike a conversation with someone..</Text>
        </View>
      )}
    </View>
  );
};

Inbox.Header = Header;

export default Social.create(Inbox);
