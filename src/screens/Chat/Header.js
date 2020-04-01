import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Image } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { useMine } from '../../services/Auth';
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
  const { me } = useMine();
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

  const { Container, Back, Thumb } = useMemo(() => {
    if (socialNav.isFirstRouteInParent()) {
      return {
        Container({ children }) {
          return (
            <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
              {children}
            </TouchableWithoutFeedback>
          );
        },
        Back: React.Fragment,
        Thumb: React.Fragment,
      };
    }
    else {
      return {
        Container: React.Fragment,
        Back({ children }) {
          return (
            <TouchableWithoutFeedback onPress={socialNav.goBackOnceFocused}>
              {children}
            </TouchableWithoutFeedback>
          );
        },
        Thumb({ children }) {
          return (
            <TouchableWithoutFeedback onPress={navToProfile}>
              {children}
            </TouchableWithoutFeedback>
          );
        },
      };
    }
  }, [true]);

  return (
    <Container>
      <View style={styles.header}>
        <Back>
          <View style={styles.backIcon}>
            <McIcon name='arrow-left' size={20} color='white' solid />
          </View>
        </Back>

        <Thumb>
          <View style={pick(styles.header, ['flexDirection', 'alignItems'])}>
            <Image style={styles.avatar} source={{ uri: recipient.avatar }} />
            <Text style={styles.name}>{recipient.name}</Text>
          </View>
        </Thumb>
      </View>
    </Container>
  );
};

export default Header;