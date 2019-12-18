import React, { useCallback } from 'react';
import { View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { useMe } from '../../services/Auth';
import { useNavigation } from '../../services/Navigation';

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
  title: {
    paddingLeft: 15,
    color: 'white',
    fontSize: 16,
    fontWeight: '900'
  },
  editProfile: {
    flex: 1,
    alignItems: 'flex-end',
  },
  editProfileIcon: {
    paddingRight: 10,
  },
});

const Header = () => {
  const me = useMe();
  const socialNav = useNavigation(Social);
  const baseNav = useNavigation(Base);

  socialNav.useBackListener(() => {
    baseNav.goBack();
  });

  const editProfile = useCallback(() => {
    baseNav.push('Profile', { user: me, itsMe: true });
  }, [baseNav, me]);

  return (
    <View style={styles.header}>
      <TouchableWithoutFeedback onPress={socialNav.goBackOnceFocused}>
        <View style={styles.backIcon}>
          <McIcon name='arrow-left' size={20} color='white' solid />
        </View>
      </TouchableWithoutFeedback>
      <Text style={styles.title}>Chats</Text>
      <View style={styles.editProfile}>
        <TouchableWithoutFeedback onPress={editProfile}>
          <View style={styles.editProfileIcon}>
            <McIcon name='account-edit' size={20} color='white' solid />
          </View>
        </TouchableWithoutFeedback>
      </View>
    </View>
  );
};

export default Header;
