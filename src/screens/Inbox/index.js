import moment from 'moment';
import React, { useCallback } from 'react';
import { StyleSheet, View, Text } from 'react-native';

import ProfileList from '../../components/ProfileList';
import Social from '../../containers/Social';
import * as queries from '../../graphql/queries';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';
import { useMountState } from '../../utils';
import Header, { $Header } from './Header';

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
const getChatPicture = c => ({ uri: c.picture });

export const $Inbox = {
  Header: $Header,
};

const Inbox = () => {
  const chatsQuery = queries.chats.use();
  const { chats = [] } = chatsQuery.data || {};
  const socialNav = useNavigation(Social);
  const mountState = useMountState();

  const navToChat = useCallback((chat) => {
    setTimeout(() => {
      if (mountState.current) {
        socialNav.push('Chat', { chat });
      }
    }, 200);
  }, [socialNav]);

  const onChatItemPress = useCallback(({ item: chat }) => {
    navToChat(chat);
  }, [navToChat]);

  const renderChatItem = useCallback(({ item: chat }) => (
    <React.Fragment>
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
    </React.Fragment>
  ), [navToChat]);

  return (
    <View style={styles.container}>
      {chats.length ? (
        <ProfileList
          data={chats}
          keyExtractor={getChatId}
          renderItemBody={renderChatItem}
          pictureExtractor={getChatPicture}
          onItemPress={onChatItemPress}
        />
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
