import { useRobot } from 'hotncold-robot';
import React, { useCallback, useMemo, useState, useLayoutEffect, useRef } from 'react';
import { Dimensions, View, StyleSheet, Text } from 'react-native';
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
import { colors } from '../../theme';
import { empty, useAsyncCallback, useCallbackWhen } from '../../utils';
import BubblesBar from './BubblesBar';
import SideMenu from './SideMenu';
import Status from './Status';

const winDims = Dimensions.get('window');

const loadingIcons = Promise.all([
  McIcon.getImageSource('map', 30, colors.hot),
  McIcon.getImageSource('thought-bubble', 30, colors.hot),
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
  Statuses: 1,
};

export const $Frame = {};

const Frame = ({
  nav: discoveryNav,
  children,
}) => {
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

  useLayoutEffect(() => {
    loadingIcons.then(([map, statuses]) => {
      setIcons({ map, statuses });
    });
  }, [true]);

  useLayoutEffect(() => {
    if (!discoveryNav) return;

    setActiveBubble(Bubble[discoveryNav.state.routeName]);
  }, [discoveryNav]);

  const navToStatuses = useCallbackWhen(() => {
    discoveryNav.push('Statuses');
    setTitle('Statuses');
  }, activeBubble != Bubble.Statuses && discoveryNav?.state.routeName === 'Map' && icons !== empty);

  const navToMap = useCallbackWhen(() => {
    discoveryNav.goBackOnceFocused();
    setTitle('Map');
  }, activeBubble != Bubble.Map && discoveryNav?.state.routeName === 'Statuses' && icons !== empty);

  const openSideMenu = useCallback(() => {
    setSideMenuOpened(true);
  }, [true]);

  const closeSideMenu = useCallback(() => {
    setSideMenuOpened(false);
  }, [true]);

  const bigBubble = {
    backgroundColor: colors.cold,
    icon: (
      <MIcon name='person-pin-circle' size={50} color='white' />
    ),
    onPress: useCallback(() => {
      baseNav.push('MessageEditor', {
        maxLength: 150,
        placeholder: 'What\'s on your mind?',
        useMutation(text, options) {
          return mutations.createStatus.use(text, options);
        },
        useSaveHandler(createStatus) {
          const [appState] = useAppState();

          return useAsyncCallback(function* () {
            const location = yield appState.discoveryMap.current.getCenter();

            createStatus(location);
          }, [createStatus, appState]);
        },
      });
    }, [baseNav]),
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
      text: appState.discoveryArea?.shortName || '-default-',
      icon: 'city',
      onPress: navToSearchArea,
    }
  ], [appState, navToSearchArea]);

  const bubbles = [
    { title: 'Map', iconSource: icons.map, onSelect: navToMap },
    { title: 'Statuses', iconSource: icons.statuses, onSelect: navToStatuses },
  ];

  useTrap($Frame, {
    navToStatuses,
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
