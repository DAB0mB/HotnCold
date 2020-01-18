import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Alert, View, Text, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import PopOver from '../../components/PopOver';
import Base from '../../containers/Base';
import Social from '../../containers/Social';
import { useSignOut } from '../../services/Auth';
import { useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useLoading } from '../../services/Loading';
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
  optionsIcon: {
    paddingRight: 10,
  },
});

const Header = () => {
  const { me } = useMine();
  const socialNav = useNavigation(Social);
  const baseNav = useNavigation(Base);
  const optionsIconRef = useRef(null);
  const optionsState = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setShowingOptions] = optionsState;
  const signOut = useSignOut();
  const alertError = useAlertError();

  const editProfile = useCallback(() => {
    baseNav.push('Profile', { user: me, itsMe: true });
  }, [baseNav, me]);

  const signOutAndFlee = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you would like to proceed?', [
      {
        text: 'Cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          setLoading(true);

          signOut().then(() => {
            baseNav.terminalPush('Auth');
          })
            .catch((error) => {
              setLoading(false);
              alertError(error);
            });
        },
      }
    ]);
  }, [signOut, alertError, baseNav]);

  const showOptions = useCallback(() => {
    setShowingOptions(true);
  }, [true]);

  const optionsItems = useMemo(() => [
    {
      text: 'Edit Profile',
      icon: 'account-edit',
      onPress: editProfile,
    },
    {
      text: 'Sign Out',
      icon: 'logout',
      onPress: signOutAndFlee,
    }
  ], [editProfile]);

  socialNav.useBackListener(() => {
    baseNav.goBack();
  });

  return useLoading(loading,
    <View style={styles.header}>
      <TouchableWithoutFeedback onPress={socialNav.goBackOnceFocused}>
        <View style={styles.backIcon}>
          <McIcon name='arrow-left' size={20} color='white' solid />
        </View>
      </TouchableWithoutFeedback>
      <Text style={styles.title}>Chats</Text>
      <View style={styles.editProfile}>
        <TouchableWithoutFeedback onPress={showOptions}>
          <View style={styles.optionsIcon} ref={optionsIconRef}>
            <McIcon name='dots-vertical' size={20} color='white' solid />
          </View>
        </TouchableWithoutFeedback>
      </View>
      <PopOver
        fromView={optionsIconRef.current}
        state={optionsState}
        items={optionsItems}
      />
    </View>
  );
};

export default Header;
