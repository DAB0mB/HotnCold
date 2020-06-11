import moment from 'moment';
import React, { useMemo, useState, useEffect, useCallback, useLayoutEffect } from 'react';
import { StyleSheet, Animated, View, Text, Image, TouchableWithoutFeedback, Easing, BackHandler } from 'react-native';
import CONFIG from 'react-native-config';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { getUserAvatarSource } from '../../assets';
import { useAppState } from '../../services/AppState';
import { useNavigation }  from '../../services/Navigation';
import { colors, hexToRgba } from '../../theme';
import { useAsyncLayoutEffect } from '../../utils';
import Base from '../Base';

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
  const baseNav = useNavigation(Base);
  const [appState, setAppState] = useAppState();
  const [statusDisplayed, setStatusDisplayed] = useState(false);
  const [statusBottom] = useState(() => new Animated.Value(200));

  const _status = 'status' in props ? props.status : appState.activeStatus;
  const status = useMemo(() => _status, [statusDisplayed]);

  // Must preserve hooks
  let hideStatus = useCallback(() => {
    setAppState((appState) => {
      appState = { ...appState };
      delete appState.activeStatus;

      return appState;
    });
  }, [true]);
  hideStatus = 'hideStatus' in props ? props.hideStatus : hideStatus;

  const navToStatusChat = useCallback(() => {
    baseNav.push('StatusChat', { status });
  }, [baseNav, status]);

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

    setStatusDisplayed(_status ? (key => ++key) : 0);
  }, [_status]);

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
    navToStatusChat();
  }, [navToStatusChat]);

  const onBackPress = useCallback(() => {
    if (CONFIG.USE_ROBOT) return;

    if (statusDisplayed) {
      hideStatus();

      return true;
    }
  }, [statusDisplayed]);

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
              <Image style={styles.avatar} source={getUserAvatarSource(status.author)} />
            </View>

            <View style={styles.titles}>
              <Text style={styles.nameTitle}>{status.author.name}</Text>
              <Text>{moment(status.createdAt).fromNow()}</Text>
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

      <TouchableWithoutFeedback onPress={hideStatus}>
        <View style={styles.xButton}>
          <McIcon name='close' size={20} color={hexToRgba(colors.gray, .5)} style={{ margin: 10 }} />
        </View>
      </TouchableWithoutFeedback>
    </Animated.View>
  );
};

export default Status;
