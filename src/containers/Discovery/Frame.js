import MapboxGL from '@react-native-mapbox-gl/maps';
import * as turf from '@turf/helpers';
import turfDistance from '@turf/distance';
import { ReactNativeFile } from 'apollo-upload-client';
import { useRobot } from 'hotncold-robot';
import React, { useCallback, useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Alert, Dimensions, View, StyleSheet, Text } from 'react-native';
import CONFIG from 'react-native-config';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import McIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import MIcon from 'react-native-vector-icons/MaterialIcons';

import Bar from '../../components/Bar';
import Hamburger from '../../components/Hamburger';
import MenuPopover from '../../components/MenuPopover';
import Base from '../../containers/Base';
import * as mutations from '../../graphql/mutations';
import { useAppState } from '../../services/AppState';
import { HitboxProvider } from '../../services/Hitbox';
import { useNavigation } from '../../services/Navigation';
import { useImagePicker } from '../../services/ImagePicker';
import { useAlertError } from '../../services/DropdownAlert';
import { colors } from '../../theme';
import { empty, useAsyncCallback, useCallbackWhen } from '../../utils';
import BubblesBar from './BubblesBar';
import SideMenu from './SideMenu';
import Status from './Status';

const winDims = Dimensions.get('window');

const loadingIcons = Promise.all([
  McIcon.getImageSource('map', 30, colors.hot),
  McIcon.getImageSource('layers', 30, colors.hot),
]);

const styles = StyleSheet.create({
  container: { flex: 1, position: 'relative' },
  childrenView: { height: winDims.height - getStatusBarHeight() - 110 },
  gradient: { width: '100%', position: 'absolute', padding: 10, left: 0, top: 0 },
  logo: { height: 20, resizeMode: 'contain', flex: 1 },
  headerTitle: { textAlign: 'center', fontSize: 20, fontWeight: '600', color: colors.ink },
  menuArrow: { backgroundColor: 'transparent', width: .1, height: .1 },
});

const menuRect = { x: winDims.width, y: 0, width: 0, height: 0 };

const Bubble = {
  Map: 0,
  Feed: 1,
};

export const $Frame = {};

const Frame = ({
  nav: discoveryNav,
  children,
}) => {
  const alertError = useAlertError();
  const baseNav = useNavigation(Base);
  const [activeBubble, setActiveBubble] = useState(Bubble.Map);
  const [icons, setIcons] = useState(empty);
  const [sideMenuOpened, setSideMenuOpened] = useState(false);
  const [title, setTitle] = useState('Map');
  const { useTrap } = useRobot();
  const [appState] = useAppState();
  const menuState = useState(false);
  const menuIconRef = useRef();
  const [, setMenuVisible] = menuState;
  const [uploadPicture] = mutations.uploadPicture.use({
    onError: alertError,
  });

  const imagePicker = useImagePicker({
    mediaType: 'photo',
    maxWidth: 512,
    maxHeight: 512,
  });

  useLayoutEffect(() => {
    loadingIcons.then(([map, feed]) => {
      setIcons({ map, feed });
    });
  }, [true]);

  useLayoutEffect(() => {
    if (!discoveryNav) return;

    setActiveBubble(Bubble[discoveryNav.state.routeName]);
  }, [discoveryNav]);

  const navToFeed = useCallbackWhen(() => {
    discoveryNav.push('Feed');
    setTitle('Feed');
  }, activeBubble != Bubble.Feed && discoveryNav?.state.routeName === 'Map' && icons !== empty);

  const navToMap = useCallbackWhen(() => {
    discoveryNav.goBackOnceFocused();
    setTitle('Map');
  }, activeBubble != Bubble.Map && discoveryNav?.state.routeName === 'Feed' && icons !== empty);

  const openSideMenu = useCallback(() => {
    setSideMenuOpened(true);
  }, [true]);

  const closeSideMenu = useCallback(() => {
    setSideMenuOpened(false);
  }, [true]);

  const alertPublish = useCallback(() => {
    return new Promise((resolve) => {
      Alert.alert('Publish status?', 'Would you like to create a new status and make it visible to the public? You can always publish it later.', [
        {
          text: 'Cancel',
        },
        {
          text: 'Create, don\'t publish',
          onPress: () => resolve(false),
        },
        {
          text: 'Create and publish',
          onPress: () => resolve(true),
        },
      ]);
    });
  }, []);

  const bigBubble = {
    backgroundColor: colors.cold,
    icon: (
      <MIcon name='person-pin-circle' size={50} color='white' />
    ),
    onPress: useAsyncCallback(function* () {
      const mapLocation = yield appState.discoveryMap.current.getCenter();

      // Cannot be created too far
      {
        const { coords } = yield MapboxGL.locationManager.getLastKnownLocation();
        const gpsLocation = [coords.longitude, coords.latitude];
        const distance = turfDistance(turf.point(mapLocation), turf.point(gpsLocation), { units: 'meters' });
        const maxDistance = Number(CONFIG.STATUS_CREATION_RADIUS);

        if (distance > maxDistance) {
          alertError(`Status cannot be created beyond ${maxDistance} meters from your current location. Try dragging the map closer to where you're at.`);

          return;
        }
      }

      imagePicker.showImagePicker({}, (image) => {
        const file = new ReactNativeFile({
          uri: image.uri,
          name: image.fileName,
          type: image.type,
        });

        const uploadingImage = uploadPicture(file)
          .then((res) => {
            return res?.data?.uploadPicture;
          })
          .catch((e) => {
            alertError(e);
          });

        baseNav.push('MessageEditor', {
          image,
          maxLength: 150,
          placeholder: 'What\'s on your mind?',
          useMutation(text, options) {
            return mutations.createStatus.use(text, options);
          },
          useSaveHandler(createStatus) {
            return useAsyncCallback(function* () {
              const published = yield alertPublish();
              const images = yield uploadingImage;

              createStatus(images, mapLocation, published);
            }, [createStatus]);
          },
        });
      });
    }, [appState, baseNav, imagePicker, uploadPicture, alertPublish, alertError]),
  };

  const showMenu = useCallback(() => {
    setMenuVisible(true);
  }, [true]);

  const navToSearchArea = useCallback(() => {
    baseNav.push('AreaSearch');
  }, [baseNav]);

  const menuItems = useMemo(() => [
    {
      key: 'area',
      text: appState.discoveryArea?.shortName || '-GPS-',
      icon: 'airplane',
      onPress: navToSearchArea,
    }
  ], [appState, navToSearchArea]);

  const bubbles = [
    { title: 'Map', iconSource: icons.map, onSelect: navToMap },
    { title: 'Feed', iconSource: icons.feed, onSelect: navToFeed },
  ];

  useTrap($Frame, {
    navToFeed,
    navToMap,
    openSideMenu,
    closeSideMenu,
  });

  return (
    <View style={styles.container}>
      <SideMenu opened={sideMenuOpened} onClose={closeSideMenu}>
        <HitboxProvider>
          <Bar>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>{title}</Text>
            </View>

            <View style={{ position: 'absolute', left: 0 }}>
              <Hamburger color={colors.hot} type='cross' onPress={openSideMenu} active={sideMenuOpened} />
            </View>

            <View ref={menuIconRef} style={{ position: 'absolute', right: 0 }}>
              <McIcon name='dots-vertical' size={30} color={colors.hot} onPress={showMenu} />
            </View>
          </Bar>

          <View style={styles.childrenView}>{children}</View>

          <BubblesBar
            activeBubble={activeBubble}
            tintColor={colors.hot}
            bigBubble={bigBubble}
            bubbles={bubbles}
          />
        </HitboxProvider>

        <Status />
      </SideMenu>

      <MenuPopover
        fromRect={menuRect}
        arrowStyle={styles.menuArrow}
        state={menuState}
        items={menuItems}
      />
    </View>
  );
};

export default Frame;
