import { useRobot } from 'hotncold-robot';
import React, { useCallback, useState } from 'react';
import { Alert, ScrollView, View, Text, ImageBackground, Image, Platform, StyleSheet, TouchableWithoutFeedback } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Ripple from 'react-native-material-ripple';
import SuperSideMenu from 'react-native-side-menu';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useSignOut, useMine } from '../../services/Auth';
import { useAlertError } from '../../services/DropdownAlert';
import { useNavigation }  from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { noop } from '../../utils';
import Base from '../Base';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  menuItem: {
    height: 50,
    alignItems: 'center',
    flexDirection: 'row',
    paddingLeft: 20,
  },
  menuItemIcon: {
    width: 30,
    textAlign: 'left',
  },
  menuItemSeparator: {
    height: 1,
    flexDirection: 'row',
  },
  header: {
    justifyContent: 'flex-end',
  },
  headerContent: {
    padding: 40,
    width: SuperSideMenu.defaultProps.openMenuOffset,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    marginBottom: 10,
    width: 90,
    height: 90,
  },
  myName: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
  },
  copyright: { margin: 10 },
  copyrightText: { fontSize: 12 },
});

const Separator = () => {
  return (
    <LinearGradient
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      colors={[hexToRgba(colors.gray, 1), 'rgba(0, 0, 0, 0)']}
      style={styles.menuItemSeparator}
    />
  );
};

export const $SideMenu = {};

const SideMenu = ({
  onClose = noop,
  onOpen = noop,
  opened,
  children,
}) => {
  const { useTrap } = useRobot();
  const [initialOpened, setInitialOpened] = useState(opened);
  const [bgStyle, setBgStyle] = useState(Platform.OS == 'android' ? { width: 0 } : {});
  const { me, myContract } = useMine();
  const baseNav = useNavigation(Base);
  const signOut = useSignOut();
  const alertError = useAlertError();

  const navToInbox = useCallback(() => {
    baseNav.push('Social', {
      $setInitialRouteState: {
        routeName: 'Inbox',
      },
    });
  }, [baseNav]);

  const navToProfile = useCallback(() => {
    baseNav.push('Profile', {
      user: me,
      itsMe: true,
    });
  }, [baseNav, me]);

  const navToProfileEditor = useCallback(() => {
    baseNav.push('ProfileEditor', { mine: { me, myContract } });
  }, [baseNav, me, myContract]);

  const ensureSignOut = useCallback(() => {
    Alert.alert('Sign Out', 'Are you sure you would like to proceed?', [
      {
        text: 'Cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          signOut().then(() => {
            baseNav.terminalPush('Auth');
          })
            .catch((error) => {
              alertError(error);
            });
        },
      }
    ]);
  }, [signOut, alertError, baseNav]);

  const navToAgreement = useCallback(() => {
    baseNav.push('Agreement', {
      hasBack: true
    });
  }, [true]);

  const navToFAQ = useCallback(() => {
    baseNav.push('FAQ');
  }, [true]);

  useTrap($SideMenu, {
    opened,
    navToInbox,
    navToProfileEditor,
    ensureSignOut,
    navToAgreement,
    navToFAQ,
  });

  const menu = (
    <View style={styles.container}>
      <ImageBackground style={[styles.header, bgStyle]} source={require('./sidemenu-background-blur.png')} onLoad={() => setBgStyle({})}>
        <LinearGradient colors={['rgba(0, 0, 0, .4)', 'rgba(0, 0, 0, .65)']}>
          <View style={styles.headerContent}>
            <TouchableWithoutFeedback onPress={navToProfile}>
              <Image source={{ uri: me.avatar }} style={styles.avatar} />
            </TouchableWithoutFeedback>
            <Text style={styles.myName}>{me.name}</Text>
          </View>
        </LinearGradient>
      </ImageBackground>

      <ScrollView style={{ flex: 1 }}>
        <Ripple style={styles.menuItem} onPress={navToInbox}>
          <View style={styles.menuItemIcon}>
            <McIcon name='message' size={16} color='rgba(0, 0, 0, .5)' />
          </View>
          <Text>Inbox</Text>
        </Ripple>

        <Separator />

        <Ripple style={styles.menuItem} onPress={navToProfileEditor}>
          <View style={styles.menuItemIcon}>
            <McIcon name='account-edit' size={16} color='rgba(0, 0, 0, .5)' />
          </View>
          <Text>Edit Profile</Text>
        </Ripple>

        <Separator />

        <Ripple style={styles.menuItem} onPress={ensureSignOut}>
          <View style={styles.menuItemIcon}>
            <McIcon name='logout' size={16} color='rgba(0, 0, 0, .5)' />
          </View>
          <Text>Sign Out</Text>
        </Ripple>

        <View style={{ height: 50 }} />

        <Separator />

        <Ripple style={styles.menuItem} onPress={navToAgreement}>
          <View style={styles.menuItemIcon}>
            <McIcon name='file-document-box-multiple' size={16} color='rgba(0, 0, 0, .5)' />
          </View>
          <Text>Terms & Policies</Text>
        </Ripple>

        <Separator />

        <Ripple style={styles.menuItem} onPress={navToFAQ}>
          <View style={styles.menuItemIcon}>
            <McIcon name='comment-question' size={16} color='rgba(0, 0, 0, .5)' />
          </View>
          <Text>FAQs</Text>
        </Ripple>
      </ScrollView>

      <View style={styles.copyright}>
        <Text style={styles.copyrightText}>© Hot &amp; Cold App, Inc 2020</Text>
      </View>
    </View>
  );

  const onChange = useCallback((isOpen) => {
    if (!initialOpened) {
      setInitialOpened(true);
    }

    if (isOpen) {
      onOpen();
    }
    else {
      onClose();
    }
  }, [onClose, onOpen, initialOpened]);

  return (
    <SuperSideMenu disableGestures menu={initialOpened && menu} isOpen={opened} onChange={onChange}>
      {children}
    </SuperSideMenu>
  );
};

export default SideMenu;
