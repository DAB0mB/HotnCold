import MapboxGL from '@react-native-mapbox-gl/maps';
import * as turf from '@turf/helpers';
import turfDistance from '@turf/distance';
import { ReactNativeFile } from 'apollo-upload-client';
import { useRobot } from 'hotncold-robot';
import React, { useCallback, useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Dimensions, View, StyleSheet, Text } from 'react-native';
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
import { empty, sleep, useAsyncCallback, useCallbackWhen } from '../../utils';
import BubblesBar from './BubblesBar';
import SideMenu from './SideMenu';
import Status from './Status';

const winDims = Dimensions.get('window');

const loadingIcons = Promise.all([
  McIcon.getImageSource('map', 30, colors.hot),
  McIcon.getImageSource('history', 30, colors.hot),
  McIcon.getImageSource('close', 30, colors.hot),
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
  History: 1,
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
  const [appState, setAppState] = useAppState();
  const menuState = useState(false);
  const menuIconRef = useRef();
  const pressingBigBubbleRef = useRef();
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
    loadingIcons.then(([map, history, close]) => {
      setIcons({ map, history, close });
    });
  }, [true]);

  useLayoutEffect(() => {
    if (!discoveryNav) return;

    setActiveBubble(Bubble[discoveryNav.state.routeName]);
  }, [discoveryNav]);

  const navToHistory = useCallbackWhen(() => {
    discoveryNav.push('History');
    setTitle('History');
  }, activeBubble != Bubble.History && discoveryNav?.state.routeName === 'Map' && icons !== empty);

  const navToMap = useCallbackWhen(() => {
    discoveryNav.goBackOnceFocused();
    setTitle('Map');
  }, activeBubble != Bubble.Map && discoveryNav?.state.routeName === 'History' && icons !== empty);

  const openSideMenu = useCallback(() => {
    setSideMenuOpened(true);
  }, [true]);

  const closeSideMenu = useCallback(() => {
    setSideMenuOpened(false);
  }, [true]);

  const bigBubble = {
    backgroundColor: colors.cold,
    icon: appState.isCreatingStatus ? (
      <MIcon name='check' size={50} color='white' />
    ) : (
      <MIcon name='person-pin-circle' size={50} color='white' />
    ),
    onPress: useAsyncCallback(function* () {
      if (pressingBigBubbleRef.current) return;

      pressingBigBubbleRef.current = true;

      // Wait for ripple effect to finish
      yield sleep(500);

      // eslint-disable-next-line
      pressingBigBubbleRef.current = false;

      if (appState.isCreatingStatus) {
        setAppState(appState => ({ ...appState, isCreatingStatus: false }));

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

        const localImage = yield new Promise(resolve => imagePicker.showImagePicker({}, resolve));

        const file = new ReactNativeFile({
          uri: localImage.uri,
          name: localImage.fileName,
          type: localImage.type,
        });

        const uploadingImage = uploadPicture(file)
          .then((res) => {
            return res?.data?.uploadPicture;
          }, (e) => {
            alertError(e);
          });

        baseNav.push('StatusEditor', {
          $setInitialRouteState: {
            routeName: 'StatusMessage',
            params: {
              localImage,
              uploadingImage,
              location: mapLocation,
            }
          }
        });
      }
      else {
        setAppState(appState => ({ ...appState, isCreatingStatus: true }));
      }
    }, [appState, baseNav, imagePicker, uploadPicture, alertError]),
  };

  const showMenu = useCallback(() => {
    setMenuVisible(true);
  }, [true]);

  const navToSearchPlace = useCallback(() => {
    baseNav.push('PlaceSearch');
  }, [baseNav]);

  const navToSearchArea = useCallback(() => {
    baseNav.push('AreaSearch');
  }, [baseNav]);

  const cancelLocationSelection = useCallback(() => {
    setAppState(appState => ({ ...appState, isCreatingStatus: false }));
  }, []);

  const menuItems = useMemo(() => [
    {
      key: 'place',
      text: 'Search in area',
      icon: 'search',
      IconComponent: MIcon,
      onPress: navToSearchPlace,
    },
    {
      key: 'area',
      text: appState.discoveryArea?.shortName || '-GPS-',
      icon: 'airplane',
      onPress: navToSearchArea,
    }
  ], [appState, navToSearchPlace, navToSearchArea]);

  const bubbles = appState.isCreatingStatus ? [
    { title: 'Cancel', iconSource: icons.close, onSelect: cancelLocationSelection }
  ] : [
    { title: 'Map', iconSource: icons.map, onSelect: navToMap },
    { title: 'History', iconSource: icons.history, onSelect: navToHistory },
  ];

  useTrap($Frame, {
    navToHistory,
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
            key={!!appState.isCreatingStatus}
            activeBubble={appState.isCreatingStatus ? -1 : activeBubble}
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
