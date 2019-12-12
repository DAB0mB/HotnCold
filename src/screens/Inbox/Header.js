import React, { useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useMe } from '../services/Auth';
import { useNavigation } from '../services/Navigation';

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
  title: {
    paddingLeft: 15,
    color: 'white',
    fontSize: 16,
    fontWeight: '900'
  },
  editProfileIcon: {
    paddingRight: 10,
  },
});

const Header = () => {
  const me = useMe();
  const baseNav = useNavigation(Base);

  baseNav.useBackListener();

  const editProfile = useCallback(() => {
    baseNav.push('Profile', { user: me, itsMe: true });
  }, [baseNav, me]);

  return (
    <View style={styles.header}>
      <View style={{ flex: 1 }}>
        <TouchableWithoutFeedback onPress={baseNav.goBackOnceFocused}>
          <View style={styles.backIcon}>
            <McIcon name='arrow-left' size={20} color='white' solid />
          </View>
        </TouchableWithoutFeedback>
        <Text style={styles.title}>Chats</Text>
      </View>
      <TouchableWithoutFeedback onPress={editProfile}>
        <View style={styles.editProfileIcon}>
          <McIcon name='account-edit' size={20} color='white' solid />
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
};

export default Header;
