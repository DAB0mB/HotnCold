import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';

import Base from '../../containers/Base';
import * as queries from '../../graphql/queries';
import { useAppState } from '../../services/AppState';
import { useNavigation } from '../../services/Navigation';
import Chat from './Chat';
import Header from './Header';
import Status from './Status';

const styles = StyleSheet.create({
  container: { flex: 1, flexDirection: 'column-reverse', backgroundColor: 'white' },
  shadow: { position: 'absolute', top: 0, left: 0, width: '100%', height: 30 },
});

const StatusChat = () => {
  const baseNav = useNavigation(Base);
  const [, setAppState] = useAppState();
  let statusId = baseNav.getParam('statusId');
  let statusQuery;
  let status;
  let chat;

  if (statusId) {
    statusQuery = queries.status.use(statusId);
    status = statusQuery.data?.status;
  }
  else {
    status = baseNav.getParam('status');
    statusId = status.id;
    statusQuery = queries.status.use(status.id);
  }

  status = statusQuery.data?.status || status;
  chat = status?.chat;

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

  return (
    <View style={styles.container}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['rgba(0, 0, 0, .05)', 'rgba(0, 0, 0, 0)']}
          style={styles.shadow}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <Chat chat={chat} />
      </View>
      <Status status={status} />
      <Header status={status} />
    </View>
  );
};

export default Base.create(StatusChat);
