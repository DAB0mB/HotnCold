import React from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Base from '../../containers/Base';
import * as queries from '../../graphql/queries';
import { useNavigation } from '../../services/Navigation';
import Chat from './Chat';
import Header from './Header';
import Status from './Status';

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column', backgroundColor: 'white' },
  shadow: { position: 'absolute', top: 0, left: 0, width: '100%', height: 30 },
});

const StatusChat = () => {
  const baseNav = useNavigation(Base);
  const status = baseNav.getParam('status');
  const statusChatQuery = queries.statusChat.use(status.id);
  const chat = statusChatQuery.data?.statusChat;

  return (
    <View style={styles.container}>
      <Header chat={chat} />
      <Status />
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['rgba(0, 0, 0, .05)', 'rgba(0, 0, 0, 0)']}
          style={styles.shadow}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Chat chat={chat} />
      </View>
    </View>
  );
};

export default Base.create(StatusChat);
