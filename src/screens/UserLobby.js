import React, { useCallback, useState, useMemo } from 'react';
import { StyleSheet, View, Image, Text, TouchableWithoutFeedback, Dimensions } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { getUserAvatarSource } from '../assets';
import Base from '../containers/Base';
import * as queries from '../graphql/queries';
import Bar from '../components/Bar';
import MenuPopover from '../components/MenuPopover';
import StatusList from '../components/StatusList';
import { useMine } from '../services/Auth';
import { useAlertError } from '../services/DropdownAlert';
import { useNavigation } from '../services/Navigation';
import { useBuffer } from '../services/Loading';
import { colors } from '../theme';

const window = Dimensions.get('window');
const menuRect = { x: window.width, y: 0, width: 0, height: 0 };

const styles = StyleSheet.create({
  container: { backgroundColor: 'white', flexDirection: 'column', height: '100%' },
  options: { position: 'absolute', right: 0 },
  header: { flexDirection: 'row', padding: 20, alignItems: 'flex-start', borderBottomWidth: 1, borderBottomColor: colors.lightGray },
  avatar: { height: 90, width: 90, borderRadius: 90, marginRight: 20 },
  details: { flex: 1, flexDirection: 'column' },
  name: { marginBottom: 10, fontSize: 18 },
  description: { fontSize: 15 },
  menuArrow: { backgroundColor: 'transparent', width: .1, height: .1 },
});

const UserLobby = () => {
  const baseNav = useNavigation(Base);
  const [user, setUser] = useState(baseNav.getParam('user'));
  const isRecipient = baseNav.getParam('isRecipient');
  const { me = {} } = useMine();
  const alertError = useAlertError();
  const menuState = useState(false);
  const [, setMenuVisible] = menuState;
  const itsMe = user?.id === me.id;

  baseNav.useBackListener();

  const navToChat = useCallback(() => {
    if (isRecipient) {
      baseNav.goBack();

      return;
    }

    baseNav.push('Social', {
      $setInitialRouteState: {
        routeName: 'Chat',
        params: {
          recipientId: user.id
        }
      }
    });
  }, [baseNav, user]);

  const navToProfile = useCallback(() => {
    baseNav.push('Profile', { user });
  }, [baseNav, user]);

  const menuItems = useMemo(() => [
    !itsMe && {
      key: 'chat',
      text: 'Chat',
      icon: 'chat-bubble',
      IconComponent: MIcon,
      onPress: navToChat,
    },
    {
      key: 'profile',
      text: 'Profile',
      icon: 'account',
      onPress: navToProfile,
    }
  ].filter(Boolean), [navToChat, navToProfile, itsMe]);

  const showMenu = useCallback(() => {
    setMenuVisible(true);
  }, []);

  queries.userProfile.use(baseNav.getParam('userId'), {
    onCompleted: useCallback((data) => {
      if (!data) return;

      setUser(data.userProfile);
    }, [true]),
    onError: alertError,
  });

  return useBuffer(!user, () =>
    <React.Fragment>
      <View style={styles.container}>
        <Bar>
          <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
            <McIcon name='arrow-left' size={30} />
          </TouchableWithoutFeedback>

          <TouchableWithoutFeedback onPress={showMenu}>
            <View style={styles.options}>
              <McIcon name='dots-vertical' size={30} color={colors.ink} />
            </View>
          </TouchableWithoutFeedback>
        </Bar>

        <StatusList
          queryUserId={user.id}
          userScreen='Profile'
          hideHeader
          ListHeaderComponent={(
            <View style={styles.header}>
              <TouchableWithoutFeedback onPress={navToProfile}>
                <Image style={styles.avatar} source={getUserAvatarSource(user)} />
              </TouchableWithoutFeedback>

              <View style={styles.details}>
                <Text style={styles.name}>{user.name}</Text>
                <Text style={styles.description}>{user.bio || 'Unspecified'}</Text>
              </View>
            </View>
          )}
        />
      </View>
      <MenuPopover
        fromRect={menuRect}
        arrowStyle={styles.menuArrow}
        state={menuState}
        items={menuItems}
      />
    </React.Fragment>
  );
};

export default Base.create(UserLobby);
