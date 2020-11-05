import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import { Alert, Dimensions, View, Text, TouchableWithoutFeedback, Image, StyleSheet } from 'react-native';
import Toast from 'react-native-simple-toast';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { getUserAvatarSource } from '../../assets';
import MenuPopover from '../../components/MenuPopover';
import Bar from '../../components/Bar';
import Base from '../../containers/Base';
import { useNavigation } from '../../services/Navigation';
import { useAlertError } from '../../services/DropdownAlert';
import { colors } from '../../theme';
import { useAsyncCallback, sleep } from '../../utils';
import * as mutations from '../../graphql/mutations';

const winDims = Dimensions.get('window');
const menuRect = { x: winDims.width, y: 0, width: 0, height: 0 };

const styles = StyleSheet.create({
  userAvatar: { borderRadius: 40, width: 40, height: 40, resizeMode: 'contain' },
  userName: { paddingLeft: 15, color: colors.ink, fontSize: 16, fontWeight: '900' },
  menuArrow: { backgroundColor: 'transparent', width: .1, height: .1 },
});

const Header = ({ status = {} }) => {
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const menuState = useState(false);
  const menuIconRef = useRef();
  const [, setMenuVisible] = menuState;
  const { author, chat } = status;
  // TODO: Add listener to statusQuery
  const [subscribed, setSubscribed] = useState(!chat ? null : (chat.subscribed || false));
  const [published, setPublished] = useState(status.published);
  const [toggleChatSubscription] = mutations.toggleChatSubscription.use(chat?.id, {
    onError: alertError,
  });
  const [publishStatus] = mutations.publishStatus.use(status.id, {
    onError: alertError,
  });

  baseNav.useBackListener();

  useEffect(() => {
    if (chat != null && subscribed == null) {
      setSubscribed(chat.subscribed);
    }
  }, [chat == null]);

  useEffect(() => {
    if (published !== status.published) {
      setPublished(status.published);
    }
  }, [status.published]);

  const toggleSubscription = useAsyncCallback(function* () {
    toggleChatSubscription(chat);

    Toast.show(`Notifications are ${chat.subscribed ? 'OFF' : 'ON'}`, Toast.SHORT, Toast.BOTTOM);

    // Waiting for modal to close first so changes won't be reflected until next open
    yield sleep(500);

    setSubscribed(s => !s);
  }, [toggleSubscription, chat]);

  const publish = useAsyncCallback(function* () {
    yield new Promise((resolve) => {
      Alert.alert('Publish status?', 'Would you like to make your status visible to the public? Once so, it cannot be reverted.', [
        {
          text: 'Cancel',
        },
        {
          text: 'Publish now',
          onPress: () => resolve(),
        },
      ]);
    });

    publishStatus();

    Toast.show('Status successfully published', Toast.SHORT, Toast.BOTTOM);

    // Waiting for modal to close first so changes won't be reflected until next open
    yield sleep(500);

    setPublished(true);
  }, [publishStatus]);

  const navToUserLobby = useCallback(() => {
    const params = {};

    if (chat?.recipient) {
      params.user = chat.recipient;
    }
    else {
      params.userId = author.id;
    }

    baseNav.push('UserLobby', params);
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
    },
    chat && {
      key: 'subscription',
      text: subscribed ? 'Unsubscribe' : 'Subscribe',
      icon: subscribed ? 'bell-off' : 'bell',
      onPress: toggleSubscription,
    },
    !published && {
      key: 'publish',
      text: 'Publish',
      icon: 'visibility',
      IconComponent: MIcon,
      onPress: publish,
    },
  ].filter(Boolean), [chat, published, subscribed, publish, toggleSubscription, navToParticipants]);

  return (
    <Bar>
      <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
        <View style={{ paddingRight: 10 }}>
          <McIcon name='arrow-left' size={20} color={colors.ink} solid />
        </View>
      </TouchableWithoutFeedback>

      {author && (
        <TouchableWithoutFeedback onPress={navToUserLobby}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Image style={styles.userAvatar} source={getUserAvatarSource(author)} />
            <Text style={styles.userName}>{author.name}</Text>
          </View>
        </TouchableWithoutFeedback>
      )}

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
