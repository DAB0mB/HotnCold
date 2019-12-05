import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { colors } from '../../theme';

const styles = StyleSheet.create({
  container: {
    top: 0,
    left: 0,
    right: 0,
    height: 50,
    paddingLeft: 20,
    paddingRight: 20,
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backIcon: {
    paddingRight: 10
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 999,
    resizeMode: 'contain',
  },
  name: {
    paddingLeft: 15,
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900'
  }
});

const Header = ({ baseNavigation, socialNavigation, me }) => {
  const [contents, setContents] = useState(null);

  baseNavigation.useBackListener();

  useEffect(() => {
    const chat = baseNavigation.getParam('chat');

    if (chat) {
      setContents(
        <Header.Chat baseNavigation={baseNavigation} chat={chat} me={me} />
      );
    }
  }, [baseNavigation]);

  return (
    <View style={styles.container}>
      {contents}
    </View>
  );
};

Header.Chat = ({ baseNavigation, chat, me }) => {
  const recipient = useMemo(() => chat.users.find(u => u.id !== me.id), [chat.id, me.id]);

  return (
    <TouchableWithoutFeedback onPress={baseNavigation.goBackOnceFocused}>
      <View style={styles.chatContent}>
        <View style={styles.backIcon}>
          <McIcon name='arrow-left' size={20} color={colors.ink} solid />
        </View>
        <Image style={styles.avatar} source={{ uri: recipient.avatar }} />
        <Text style={styles.name}>{recipient.name}</Text>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Header;
