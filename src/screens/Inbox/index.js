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

  },
  chatRecentMessageText: {
    fontSize: 13,
    color: colors.gray,
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

  const renderChatItem = useCallback(({ item: chat, index, separators }) => (
    <Ripple
      onPressOut={() => navToChat(chat)}
      onShowUnderlay={separators.highlight}
      onHideUnderlay={separators.unhighlight}
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
              <Text style={styles.chatTimeText}>{moment(chat.recentMessages[0].createdAt).fromNow()}</Text>
            </View>
          </View>

          <View style={styles.chatRecentMessage}>
            <Text style={styles.chatRecentMessageText}>{chat.recentMessages[0].text}</Text>
          </View>
        </View>
      </View>
    </Ripple>
  ), [navToChat]);

  return (
    <View style={styles.container}>
      <FlatList data={chats} keyExtractor={getChatId} renderItem={renderChatItem} />
    </View>
  );
};

Inbox.Header = Header;

export default Social.create(Inbox);
