import React, { useMemo, useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet, Image } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getUserAvatarSource } from '../../assets';
import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { useNavigation } from '../../services/Navigation';
import { pick } from '../../utils';

const styles = StyleSheet.create({
  header: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  backIcon: { paddingRight: 10 },
  avatar: { width: 40, height: 40, resizeMode: 'contain' },
  name: { paddingLeft: 15, color: 'white', fontSize: 16, fontWeight: '900' },
});

const Header = ({ chat }) => {
  const socialNav = useNavigation(Social);
  const baseNav = useNavigation(Base);
  const activeNav = useMemo(() => socialNav.isFirstRouteInParent() ? baseNav : socialNav, [true]);
  const { recipient } = chat || {};

  activeNav.useBackListener();

  const navToUserLobby = useCallback(() => {
    baseNav.push('UserLobby', {
      user: recipient,
      isRecipient: true,
    });
  }, [baseNav, recipient]);

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
            <TouchableWithoutFeedback onPress={navToUserLobby}>
              {children}
            </TouchableWithoutFeedback>
          );
        },
      };
    }
  }, [true]);

  if (!chat) {
    return null;
  }

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
            <Image style={styles.avatar} source={getUserAvatarSource(recipient)} />
            <Text style={styles.name}>{chat.title}</Text>
          </View>
        </Thumb>
      </View>
    </Container>
  );
};

export default Header;