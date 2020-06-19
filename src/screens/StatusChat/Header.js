import React, { useCallback, useMemo, useState, useRef } from 'react';
import { Dimensions, View, Text, TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { getUserAvatarSource } from '../../assets';
import MenuPopover from '../../components/MenuPopover';
import Bar from '../../components/Bar';
import Base from '../../containers/Base';
import { useNavigation } from '../../services/Navigation';
import { colors } from '../../theme';

const winDims = Dimensions.get('window');
const menuRect = { x: winDims.width, y: 0, width: 0, height: 0 };

const styles = StyleSheet.create({
  userAvatar: { borderRadius: 40, width: 40, height: 40, resizeMode: 'contain' },
  userName: { paddingLeft: 15, color: colors.ink, fontSize: 16, fontWeight: '900' },
  menuArrow: { backgroundColor: 'transparent', width: .1, height: .1 },
});

const Header = ({ chat }) => {
  const baseNav = useNavigation(Base);
  const status = baseNav.getParam('status');
  const menuState = useState(false);
  const menuIconRef = useRef();
  const [, setMenuVisible] = menuState;
  const { author } = status;

  baseNav.useBackListener();

  const navToProfile = useCallback(() => {
    const params = {};

    if (chat?.recipient) {
      params.user = chat.recipient;
    }
    else {
      params.userId = author.id;
    }

    baseNav.push('Profile', params);
  }, [baseNav, chat?.recipient]);

  const navToParticipants = useCallback(() => {
    baseNav.push('Participants', { chat });
  }, [baseNav, chat]);

  const showMenu = useCallback(() => {
    if (chat) {
      setMenuVisible(true);
    }
  }, [chat]);

  const menuItems = useMemo(() => [
    {
      key: 'participants',
      text: 'Participants',
      icon: 'account-group',
      onPress: navToParticipants,
    }
  ], [navToParticipants]);

  return (
    <Bar>
      <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
        <View style={{ paddingRight: 10 }}>
          <McIcon name='arrow-left' size={20} color={colors.ink} solid />
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback onPress={navToProfile}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Image style={styles.userAvatar} source={getUserAvatarSource(author)} />
          <Text style={styles.userName}>{author.name}</Text>
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback onPress={showMenu}>
        <View ref={menuIconRef} style={{ position: 'absolute', right: 0 }}>
          <McIcon name='dots-vertical' size={30} color={colors.ink} onPress={showMenu} />
        </View>
      </TouchableWithoutFeedback>

      <MenuPopover
        fromRect={menuRect}
        arrowStyle={styles.menuArrow}
        state={menuState}
        items={menuItems}
      />
    </Bar>
  );
};

export default Header;
