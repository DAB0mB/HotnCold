import React, { useCallback, useState, useEffect } from 'react';
import { StyleSheet, View, FlatList, Text, Image } from 'react-native';
import Ripple from 'react-native-material-ripple';

import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { colors, hexToRgba } from '../../theme';
import * as queries from '../../graphql/queries';
import { useNavigation } from '../../services/Navigation';
import { useMountedRef } from '../../utils';
import Header from './Header';

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  userItem: {
    paddingLeft: 10,
    paddingRight: 10,
    flexDirection: 'row',
  },
  userAvatar: {
    width: 60,
    height: '100%',
    justifyContent: 'center',
  },
  userAvatarImage: {
    resizeMode: 'contain',
    height: 50,
    marginRight: 10,
    borderRadius: 999,
  },
  userName: {
    flex: 1,
    flexDirection: 'row',
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  userNameBorder: {
    borderBottomWidth: 1,
    borderBottomColor: hexToRgba(colors.gray, .5),
  },
  userNameText: {
    fontSize: 16,
    fontWeight: '900',
    color: colors.ink,
  },
});

const getUserId = c => c.id;

const People = () => {
  const usersQuery = queries.users.profiles.use();
  // Cache should be ready from Map screen
  const { users = [] } = usersQuery.data || {};
  const baseNav = useNavigation(Base);
  const isMountedRef = useMountedRef();
  const [selectedUser, setSelectedUser] = useState(null);
  const [userProfileState, setUserProfileState] = useState(null);

  const createUserHook = useCallback(() => () => {
    const _userProfileState = useState(null);

    if (!userProfileState) {
      setUserProfileState(_userProfileState);
    }

    return _userProfileState[0];
  }, [true]);

  const navToProfile = useCallback((user) => {
    setTimeout(() => {
      if (isMountedRef.current) {
        baseNav.push('Profile', { user: usersQuery.loading ? createUserHook() : user });
      }
    }, 200);

    setSelectedUser(user);
  }, [baseNav, usersQuery]);

  useEffect(() => {
    if (usersQuery.loading) return;
    if (!selectedUser) return;
    if (!userProfileState) return;

    const [, setUserProfile] = userProfileState;
    const userProfile = users.find(u => u.id === selectedUser.id);

    setUserProfile(userProfile);
  }, [usersQuery, selectedUser, userProfileState]);

  const renderUserItem = useCallback(({ item: user, index, separators }) => (
    <Ripple
      onPressOut={() => navToProfile(user)}
      onShowUnderlay={separators.highlight}
      onHideUnderlay={separators.unhighlight}
    >
      <View style={styles.userItem}>
        <View style={styles.userAvatar}>
          <Image style={styles.userAvatarImage} source={{ uri: user.avatar }} />
        </View>

        <View style={[styles.userName, index && styles.userNameBorder].filter(Boolean)}>
          <Text style={styles.userNameText}>{user.name}</Text>
        </View>
      </View>
    </Ripple>
  ), [navToProfile]);

  return (
    <View style={styles.container}>
      <FlatList data={users} keyExtractor={getUserId} renderItem={renderUserItem} />
    </View>
  );
};

People.Header = Header;

export default Social.create(People);
