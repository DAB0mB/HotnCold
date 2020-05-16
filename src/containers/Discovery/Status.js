import React, { useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { Alert, StyleSheet, Animated, View, Text, Image, TouchableWithoutFeedback, Easing, BackHandler } from 'react-native';
import CONFIG from 'react-native-config';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { getUserAvatarSource } from '../../assets';
import { useMine } from '../../services/Auth';
import { useAppState } from '../../services/AppState';
import { useAlertError }  from '../../services/DropdownAlert';
import { useNavigation }  from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useConst, useAsyncLayoutEffect } from '../../utils';
import Base from '../Base';
import * as mutations from '../../graphql/mutations';
import * as queries from '../../graphql/queries';

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  xButton: { position: 'absolute', top: 0, right: 0 },
  deleteButton: { position: 'absolute', bottom: 0, right: 0 },
  contents: { flex: 1, margin: 15, marginTop: -15 },
  contentsText: { lineHeight: 20 },
  titles: { marginTop: 8, flex: 1 },
  nameTitle: { color: colors.ink, fontSize: 17 },
  avatar: { position: 'absolute', width: 75, height: 75 },
  avatarBackground: { position: 'absolute', backgroundColor: 'white', borderColor: colors.lightGray, borderWidth: 1, borderRadius: 999, width: 80, height: 80 },
  avatarView: { position: 'relative', width: 100, height: 80, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -25 }] },
  background: { backgroundColor: 'white', minHeight: 120, borderTopWidth: 1, borderTopColor: colors.lightGray },
  header: { flexDirection: 'row' },
});

const Status = (props) => {
  const self = useConst();
  const { me } = useMine();
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const [appState, setAppState] = useAppState();
  const [statusDisplayed, setStatusDisplayed] = useState(false);
  const [statusBottom] = useState(() => new Animated.Value(200));
  const activeStatus = 'activeStatus' in props ? props.activeStatus : appState.activeStatus;
  const [deleteStatus] = mutations.deleteStatus.use();

  // Must preserve hooks
  let hideActiveStatus = useCallback(() => {
    setAppState((appState) => {
      appState = { ...appState };
      delete appState.activeStatus;

      return appState;
    });
  }, [true]);
  hideActiveStatus = 'hideActiveStatus' in props ? props.hideActiveStatus : hideActiveStatus;

  const { user, status } = useMemo(() => {
    return activeStatus || {};
  }, [statusDisplayed]);

  const tryNavToUserProfile = useCallback(() => {
    if (self.shouldNav && self.fullUser) {
      const user = self.fullUser;
      delete self.shouldNav;
      delete self.fullUser;

      baseNav.push('Profile', { user });
    }
  }, [true]);

  const [queryUserProfile] = queries.userProfile.use.lazy({
    onCompleted: useCallback((data) => {
      if (!data) return;

      self.fullUser = data.userProfile;
      tryNavToUserProfile();
    }, [tryNavToUserProfile]),
    onError: alertError,
  });

  useEffect(() => {
    if (!activeStatus) return;

    if (activeStatus.isPartial) {
      queryUserProfile({
        variables: { userId: activeStatus.user.id }
      });
    }
    else {
      self.fullUser = activeStatus.user;
    }
  }, [queryUserProfile, activeStatus?.isPartial, activeStatus?.user]);

  useAsyncLayoutEffect(function* () {
    if (statusDisplayed) {
      yield new Promise(resolve => Animated.timing(statusBottom, {
        toValue: 200,
        duration: 150,
        delay: 0,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(resolve));
    }

    setStatusDisplayed(!activeStatus ? 0 : key => ++key);
  }, [activeStatus?.status?.id]);

  useLayoutEffect(() => {
    if (!statusDisplayed) return;

    Animated.timing(statusBottom, {
      toValue: 0,
      duration: 150,
      delay: 0,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [statusDisplayed]);

  const handleStatusPress = useCallback(() => {
    self.shouldNav = true;
    tryNavToUserProfile();
  }, [tryNavToUserProfile]);

  const onBackPress = useCallback(() => {
    if (CONFIG.USE_ROBOT) return;

    if (statusDisplayed) {
      hideActiveStatus();

      return true;
    }
  }, [statusDisplayed]);

  const handleDeleteStatus = useCallback(() => {
    Alert.alert('Delete', 'Are you sure you would like to delete this status?', [
      {
        text: 'Cancel',
      },
      {
        text: 'Yes',
        onPress: () => {
          deleteStatus(status.id).then(hideActiveStatus, (error) => {
            alertError(error);
          });
        },
      }
    ]);
  }, [status, hideActiveStatus, deleteStatus, alertError]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [statusDisplayed]);

  if (!statusDisplayed) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: statusBottom }] }]}>
      <TouchableWithoutFeedback onPress={handleStatusPress}>
        <View style={styles.background}>
          <View style={styles.header}>
            <View style={styles.avatarView} pointerEvents='box-none'>
              <View style={styles.avatarBackground} />
              <Image style={styles.avatar} source={getUserAvatarSource(user)} />
            </View>

            <View style={styles.titles}>
              <Text style={styles.nameTitle}>{user.name}</Text>
            </View>
          </View>

          <View style={styles.contents}>
            {status.text ? (
              <Text style={styles.contentsText}>{status.text}</Text>
            ) : (
              <Text style={[styles.contentsText, { color: 'red' }]}>
                <MIcon name='not-interested' color={colors.red} /> <Text>No status</Text>
              </Text>
            )}
          </View>
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback onPress={hideActiveStatus}>
        <View style={styles.xButton}>
          <McIcon name='close' size={20} color={hexToRgba(colors.gray, .5)} style={{ margin: 10 }} />
        </View>
      </TouchableWithoutFeedback>

      {user.id === me.id && (
        <TouchableWithoutFeedback onPress={handleDeleteStatus}>
          <View style={styles.deleteButton}>
            <McIcon name='trash-can' size={20} color={hexToRgba(colors.gray, .5)} style={{ margin: 10 }} />
          </View>
        </TouchableWithoutFeedback>
      )}
    </Animated.View>
  );
};

export default Status;
