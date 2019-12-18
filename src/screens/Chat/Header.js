import React, { useMemo, useState, useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Image } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { colors } from '../../theme';
import { useMe } from '../../services/Auth';
import { useNavigation } from '../../services/Navigation';

const styles = StyleSheet.create({
  header: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.ink,
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

const Header = () => {
  const me = useMe();
  const socialNav = useNavigation(Social);
  const baseNav = useNavigation(Base);
  const chat = socialNav.getParam('chat');
  const [prevNav] = useState(socialNav.isFirstRouteInParent() ? socialNav : baseNav);
  const recipient = useMemo(() => chat.users.find(u => u.id !== me.id), [chat.id, me.id]);

  prevNav.useBackListener();

  const navToProfile = useCallback(() => {
    baseNav.push('profile', {
      user: recipient
    });
  }, [baseNav]);

  return (
    <TouchableWithoutFeedback onPress={socialNav.isFirstRouteInParent() && prevNav.goBackOnceFocused}>
      <View style={styles.header}>
        <TouchableWithoutFeedback onPress={!socialNav.isFirstRouteInParent() && prevNav.goBackOnceFocused}>
          <View style={styles.backIcon}>
            <McIcon name='arrow-left' size={20} color='white' solid />
          </View>
        </TouchableWithoutFeedback>
        <TouchableWithoutFeedback onPress={!socialNav.isFirstRouteInParent() && navToProfile}>
          <Image style={styles.avatar} source={{ uri: recipient.avatar }} />
          <Text style={styles.name}>{recipient.name}</Text>
        </TouchableWithoutFeedback>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default Header;
