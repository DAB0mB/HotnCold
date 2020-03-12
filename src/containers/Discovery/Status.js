import moment from 'moment';
import React, { useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { StyleSheet, Animated, View, Text, Image, TouchableWithoutFeedback, Easing, BackHandler } from 'react-native';
import CONFIG from 'react-native-config';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';

import { useMine } from '../../services/Auth';
import { useAppState } from '../../services/AppState';
import { useAlertError }  from '../../services/DropdownAlert';
import { useNavigation }  from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useSelf, useMountedRef } from '../../utils';
import Base from '../Base';
import * as queries from '../../graphql/queries';

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 0, left: 0, right: 0 },
  xButton: { position: 'absolute', top: 0, right: 0 },
  contents: { flex: 1, margin: 15, marginTop: -15 },
  contentsText: { lineHeight: 20 },
  titles: { marginTop: 8, flex: 1 },
  nameTitle: { color: colors.ink, fontSize: 17 },
  timeTitle: { fontSize: 11 },
  avatar: { position: 'absolute', borderRadius: 999, width: 75, height: 75 },
  avatarBackground: { position: 'absolute', backgroundColor: 'white', borderColor: colors.lightGray, borderWidth: 1, borderRadius: 999, width: 80, height: 80 },
  avatarView: { position: 'relative', width: 100, height: 80, alignItems: 'center', justifyContent: 'center', transform: [{ translateY: -25 }] },
  background: { backgroundColor: 'white', minHeight: 120, borderTopWidth: 1, borderTopColor: colors.lightGray },
  header: { flexDirection: 'row' },
});

const Status = (props) => {
  const self = useSelf();
  const mountedRef = useMountedRef();
  const { me } = useMine();
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const [appState, , reduceAppState] = useAppState();
  const [displayedStatus, setStatus] = useState();
  const [statusBottom] = useState(() => new Animated.Value(200));
  const activeStatus = 'activeStatus' in props ? props.activeStatus : appState.activeStatus;

  // Must preserve hooks
  let hideActiveStatus = useCallback(() => {
    reduceAppState((appState) => {
      appState = { ...appState };
      delete appState.activeStatus;

      return appState;
    });
  }, [true]);
  hideActiveStatus = 'hideActiveStatus' in props ? props.hideActiveStatus : hideActiveStatus;

  const { user, status } = useMemo(() => {
    return activeStatus || {};
  }, [displayedStatus]);

  const tryNavToUserProfile = useCallback(() => {
    if (self.shouldNav && self.fullUser) {
      const user = self.fullUser;
      delete self.shouldNav;
      delete self.fullUser;

      baseNav.push('Profile', {
        user: user,
        itsMe: me.id === user.id,
      });
    }
  }, [true]);

  const [queryUserProfile] = queries.userProfile.use.lazy({
    onCompleted: useCallback((data) => {
      if (!data) {
        alertError('Network Error: Network request failed');

        return;
      }

      self.fullUser = data.userProfile;
      tryNavToUserProfile();
    }, [tryNavToUserProfile, alertError]),
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

  useLayoutEffect(() => {
    if (displayedStatus) {
      Animated.timing(statusBottom, {
        toValue: 200,
        duration: 150,
        delay: 0,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => {
        if (mountedRef.current) {
          setStatus(activeStatus?.status);
        }
      });

      return;
    }

    setStatus(activeStatus?.status);
  }, [!!activeStatus]);

  useLayoutEffect(() => {
    if (!displayedStatus) return;

    Animated.timing(statusBottom, {
      toValue: 0,
      duration: 150,
      delay: 0,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start();
  }, [!!displayedStatus]);

  const handleStatusPress = useCallback(() => {
    self.shouldNav = true;
    tryNavToUserProfile();
  }, [tryNavToUserProfile]);

  const onBackPress = useCallback(() => {
    if (CONFIG.USE_ROBOT) return;

    if (displayedStatus) {
      hideActiveStatus();

      return true;
    }
  }, [displayedStatus]);

  useEffect(() => {
    BackHandler.addEventListener('hardwareBackPress', onBackPress);

    return () => {
      BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    };
  }, [displayedStatus]);

  if (!displayedStatus) return null;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: statusBottom }] }]}>
      <TouchableWithoutFeedback onPress={handleStatusPress}>
        <View style={styles.background}>
          <View style={styles.header}>
            <View style={styles.avatarView} pointerEvents='box-none'>
              <View style={styles.avatarBackground} />
              <Image style={styles.avatar} source={{ uri: user.avatar }} />
            </View>

            <View style={styles.titles}>
              <Text style={styles.nameTitle}>{user.name}</Text>
              <Text style={styles.timeTitle}>{activeStatus?.isNow ? 'Active now' : moment(status.updatedAt).fromNow()}</Text>
            </View>
          </View>

          <View style={styles.contents}>
            <Text style={styles.contentsText}>{status.text}</Text>
          </View>
        </View>
      </TouchableWithoutFeedback>

      <TouchableWithoutFeedback onPress={hideActiveStatus}>
        <View style={styles.xButton}>
          <McIcon name='close' size={20} color={hexToRgba(colors.gray, .5)} style={{ margin: 10 }} />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default Status;
