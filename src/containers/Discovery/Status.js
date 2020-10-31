import moment from 'moment';
import React, { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Animated, View, Text, Image, TouchableWithoutFeedback, Easing, BackHandler } from 'react-native';
import CONFIG from 'react-native-config';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import { getUserAvatarSource, getStatusThumbSource } from '../../assets';
import ImageViewer from '../../components/ImageViewer';
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
  contentsText: { fontSize: 16, lineHeight: 20, marginTop: 5 },
  titles: { marginTop: 8, flex: 1 },
  nameTitle: { color: colors.ink, fontSize: 17 },
  avatar: { width: 40, height: 40, margin: 10, marginTop: 9 },
  background: { backgroundColor: 'white', minHeight: 120, borderTopWidth: 1, borderTopColor: colors.lightGray },
  header: { flexDirection: 'row', marginBottom: 15 },
  imageContainer: { position: 'absolute', right: 0, bottom: '100%', margin: 10, width: 120, height: 120, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.lightGray },
  image: { width: 110, height: 110 },
  modalBody: { position: 'relative', flex: 1 },
  modalX: { position: 'absolute', right: 10, top: 10 },
  statusType: { borderRadius: 12, width: 12, height: 12, marginRight: 5 },
});

const Status = (props) => {
  const baseNav = useNavigation(Base);
  const [appState, setAppState] = useAppState();
  const [statusDisplayed, setStatusDisplayed] = useState(false);
  const [isImageViewerOpen, setImageViewerOpen] = useState(false);
  const [statusBottom] = useState(() => new Animated.Value(200));
  const [containerMeasures, setContainerMeasures] = useState();
  const containerRef = useRef();

  const _status = 'status' in props ? props.status : appState.activeStatus;
  const status = useMemo(() => _status, [statusDisplayed]);

  useEffect(() => {
    if (status?.firstImage) {
      Image.prefetch(status.firstImage);
    }
  }, [status]);

  // Must preserve hooks
  let hideStatus = useCallback(() => {
    setContainerMeasures(null);

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

  const openImageViewer = useCallback(() => {
    setImageViewerOpen(true);
  }, []);

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

  useAsyncLayoutEffect(function* () {
    if (!statusDisplayed) return;

    yield new Promise((resolve) => {
      Animated.timing(statusBottom, {
        toValue: 0,
        duration: 150,
        delay: 0,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(resolve);
    });

    const containerMeasures = yield new Promise((resolve) => {
      containerRef.current.measure((x, y, width, height) => {
        resolve({ x, y, width, height });
      });
    });

    setContainerMeasures(containerMeasures);
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
    <React.Fragment>
      <Animated.View ref={containerRef} style={[styles.container, { transform: [{ translateY: statusBottom }] }]}>
        <TouchableWithoutFeedback onPress={handleStatusPress}>
          <View style={styles.background}>
            <View style={styles.header}>
              <Image style={styles.avatar} source={getUserAvatarSource(status.author)} />

              <View style={styles.titles}>
                <Text style={styles.nameTitle}>{status.author.name}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <View style={[styles.statusType, { backgroundColor: status.isMeetup ? colors.hot : colors.cold }]} />
                  <Text>{moment(status.createdAt).fromNow()}</Text>
                </View>
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

        <View style={styles.imageContainer}>
          <Image style={styles.image} source={getStatusThumbSource(status)} />
        </View>
      </Animated.View>

      {containerMeasures && (
        <TouchableWithoutFeedback onPress={openImageViewer}>
          <View style={{ position: 'absolute', right: 10, bottom: containerMeasures.height + 10, width: 120, height: 120 }}>
            <ImageViewer imageUrls={status.firstImage} openState={[isImageViewerOpen, setImageViewerOpen]} />
          </View>
        </TouchableWithoutFeedback>
      )}
    </React.Fragment>
  );
};

export default Status;
