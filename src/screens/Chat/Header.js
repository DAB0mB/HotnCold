import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Image } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { useMe } from '../../services/Auth';
import { useNavigation } from '../../services/Navigation';
import { pick } from '../../utils';

const styles = StyleSheet.create({
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 20,
    paddingRight: 20,
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
    color: 'white',
    fontSize: 16,
    fontWeight: '900'
  }
});

const noop = () => {};

const Header = () => {
  const me = useMe();
  const socialNav = useNavigation(Social);
  const baseNav = useNavigation(Base);
  const chat = socialNav.getParam('chat');
  const activeNav = useMemo(() => socialNav.isFirstRouteInParent() ? baseNav : socialNav, [true]);
  const recipient = useMemo(() => chat.users.find(u => u.id !== me.id), [chat.id, me.id]);

  activeNav.useBackListener();

  const navToProfile = useCallback(() => {
    baseNav.push('Profile', {
      user: recipient,
      isRecipient: true,
    });
  }, [baseNav]);

  return (
    <TouchableWithoutFeedback onPress={socialNav.isFirstRouteInParent() ? baseNav.goBackOnceFocused : noop}>
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={socialNav.isFirstRouteInParent() ? noop : socialNav.goBackOnceFocused}>
          <View style={styles.backIcon}>
            <McIcon name='arrow-left' size={20} color='white' solid />
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={socialNav.isFirstRouteInParent() ? noop : navToProfile}>
          <View style={pick(styles.header, ['flexDirection', 'alignItems'])}>
            <Image style={styles.avatar} source={{ uri: recipient.avatar }} />
            <Text style={styles.name}>{recipient.name}</Text>
          </View>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Header;
